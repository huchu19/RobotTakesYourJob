/* ============================================================
   GAME — all state and rules. No DOM, no canvas.
   The UI and renderer subscribe via Game.on(event, fn).

   Events:
     'change'     structural change (rebuild lists)
     'log'        { text, cls }        line for the office log
     'learned'    { task }             robot absorbed a task
     'target'     { task|null }        robot picked a new victim
     'reskill'    { task }             player bought a task
     'pip-start' / 'pip-end'
     'win' / 'gameover'
     'sabotage'   { kind }             union rep / coffee spill
   ============================================================ */

const Game = (() => {

  const taskById = {};
  DATA.tasks.forEach(t => { taskById[t.id] = t; });
  const perkById = {};
  DATA.perks.forEach(p => { perkById[p.id] = p; });
  const AUTOMATABLE_TOTAL = DATA.tasks.filter(t => !t.immune).length;

  /* ---------- tiny event emitter ---------- */
  const listeners = {};
  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }
  function emit(ev, payload) { (listeners[ev] || []).forEach(fn => fn(payload)); }

  /* ---------- state ---------- */
  let S = null;

  function freshState() {
    const tasks = {};
    DATA.tasks.forEach(t => {
      tasks[t.id] = { owned: t.cost === 0, level: 1, automated: false };
    });
    return {
      v: 1,
      money: 0,
      totalEarned: 0,
      companyProfits: 0,
      playTime: 0,
      tasks,
      perkCounts: {},
      robot: { target: null, progress: 0, duration: 0, absorbed: 0, grace: BALANCE.graceBeforeFirstLesson, idleAnnounced: false },
      pip: { active: false, remaining: 0 },
      flags: { introSeen: false, won: false, gameOver: false, muted: true },
      stats: { tasksLost: 0, clicks: 0, coffeesSpilled: 0, unionCalls: 0 },
      lastSeen: Date.now(),
    };
  }

  /* ---------- money formatting ---------- */
  function fmt(n) {
    const abs = Math.abs(n);
    if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (abs >= 1e4) return '$' + (n / 1e3).toFixed(1) + 'K';
    if (abs < 100 && Math.floor(n) !== n) return '$' + n.toFixed(1);
    return '$' + Math.floor(n).toLocaleString('en-US');
  }

  /* ---------- derived numbers ---------- */
  function perkCount(id) { return S.perkCounts[id] || 0; }

  function incomeMult() {
    let m = 1;
    DATA.perks.forEach(p => {
      if (!perkCount(p.id)) return;
      if (p.type === 'incomeMult') m *= 1 + p.value;
      if (p.type === 'pipBonus' && p.bonusMult) m *= 1 + p.bonusMult;
    });
    return m;
  }
  function reskillDiscount() {
    let m = 1;
    DATA.perks.forEach(p => {
      if (perkCount(p.id) && p.type === 'reskillDiscount') m *= 1 - p.value;
    });
    return m;
  }
  function upgDiscount() {
    let m = 1;
    DATA.perks.forEach(p => {
      if (perkCount(p.id) && p.type === 'upgDiscount') m *= 1 - p.value;
    });
    return m;
  }
  function pipSeconds() {
    let s = BALANCE.pipSeconds;
    DATA.perks.forEach(p => {
      if (perkCount(p.id) && p.type === 'pipBonus') s += p.value;
    });
    return s;
  }

  function taskLevelMult(st) { return 1 + BALANCE.lvlIncomeStep * (st.level - 1); }

  function taskIncome(t) {
    const st = S.tasks[t.id];
    return t.income * taskLevelMult(st) * incomeMult();
  }

  function activeTasks() {
    return DATA.tasks.filter(t => S.tasks[t.id].owned && !S.tasks[t.id].automated);
  }
  function automatedTasks() {
    return DATA.tasks.filter(t => S.tasks[t.id].automated);
  }

  function ips() {
    return activeTasks().reduce((sum, t) => sum + taskIncome(t), 0);
  }
  function automatedIps() {
    return automatedTasks().reduce((sum, t) => sum + t.income * taskLevelMult(S.tasks[t.id]), 0);
  }

  function clickPower() {
    return Math.max(BALANCE.clickMinimum, ips() * BALANCE.clickSeconds);
  }

  function unlockCost(t) { return Math.round(t.cost * reskillDiscount()); }
  function upgradeCost(t) {
    const st = S.tasks[t.id];
    return Math.round(t.upgBase * Math.pow(BALANCE.upgCostScale, st.level - 1) * upgDiscount());
  }
  function perkCost(p) {
    const n = perkCount(p.id);
    return Math.round(p.cost * Math.pow(p.costScale || 1, n));
  }

  function tierUnlocked(tier) {
    const def = DATA.tiers.find(x => x.id === tier);
    return S.robot.absorbed >= (def ? def.unlockAuto : 0);
  }

  function doom() { return Math.min(1, S.robot.absorbed / AUTOMATABLE_TOTAL); }

  function robotVersion() {
    const a = S.robot.absorbed;
    if (a >= 7) return 3;
    if (a >= 3) return 2;
    return 1;
  }

  function day() { return Math.floor(S.playTime / BALANCE.dayLength) + 1; }

  /* ---------- logging ---------- */
  function log(text, cls) { emit('log', { text, cls, day: day() }); }

  /* ---------- robot brain ---------- */
  function learnDuration(t) {
    const speed = Math.max(BALANCE.learnFloor, BALANCE.learnBase * Math.pow(BALANCE.learnDecay, S.robot.absorbed));
    return speed * t.resist;
  }

  function validTargets() {
    return activeTasks().filter(t => !t.immune);
  }

  function acquireTarget() {
    const targets = validTargets();
    if (!targets.length) {
      if (S.robot.target !== null || !S.robot.idleAnnounced) {
        S.robot.target = null;
        S.robot.progress = 0;
        if (!S.robot.idleAnnounced && S.robot.absorbed > 0) {
          log(DATA.robotIdleLines[S.robot.absorbed % DATA.robotIdleLines.length], 'log-bad');
          S.robot.idleAnnounced = true;
        }
        emit('target', { task: null });
      }
      return;
    }
    S.robot.idleAnnounced = false;
    const lowestTier = Math.min(...targets.map(t => t.tier));
    const pool = targets.filter(t => t.tier === lowestTier);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    S.robot.target = pick.id;
    S.robot.progress = 0;
    S.robot.duration = learnDuration(pick);
    emit('target', { task: pick });
  }

  function absorb(t) {
    S.tasks[t.id].automated = true;
    S.robot.absorbed++;
    S.stats.tasksLost++;
    S.robot.target = null;
    S.robot.progress = 0;
    log(t.autoFlavor, 'log-bad');
    emit('learned', { task: t });
    emit('change');

    if (activeTasks().length === 0 && !S.flags.gameOver) startPip();
  }

  function startPip() {
    S.pip.active = true;
    S.pip.remaining = pipSeconds();
    log('HR has placed you on a Performance Improvement Plan. The improvement they would like is a job.', 'log-bad');
    emit('pip-start');
  }
  function endPip() {
    S.pip.active = false;
    emit('pip-end');
  }

  function gameOver() {
    S.flags.gameOver = true;
    S.robot.target = null;
    emit('gameover');
  }

  /* ---------- the tick ---------- */
  function tick(dt) {
    if (!S || S.flags.gameOver || !Number.isFinite(dt) || dt <= 0) return;

    // Split long background ticks so each lesson and PIP starts at its actual time.
    while (dt > 0 && !S.flags.gameOver) {
      if (S.robot.grace <= 0 && S.robot.target === null) acquireTarget();
      let step = dt;
      if (S.robot.grace > 0) step = Math.min(step, S.robot.grace);
      else if (S.robot.target) step = Math.min(step, Math.max(0, S.robot.duration - S.robot.progress));
      if (S.pip.active) step = Math.min(step, Math.max(0, S.pip.remaining));
      advance(step);
      dt -= step;
    }
  }

  function advance(dt) {
    const wasOnPip = S.pip.active;

    S.playTime += dt;

    const earned = ips() * dt;
    S.money += earned;
    S.totalEarned += earned;
    S.companyProfits += automatedIps() * BALANCE.companyGreedMult * dt;

    /* robot learning */
    if (S.robot.grace > 0) {
      S.robot.grace -= dt;
    } else if (S.robot.target === null) {
      acquireTarget();
    } else {
      S.robot.progress += dt;
      if (S.robot.progress >= S.robot.duration) {
        const t = taskById[S.robot.target];
        if (t) absorb(t);
        else { S.robot.target = null; }
      }
    }

    /* PIP countdown */
    if (wasOnPip && S.pip.active) {
      S.pip.remaining -= dt;
      if (S.pip.remaining <= 0) gameOver();
    }
  }

  /* ---------- player actions ---------- */
  function buyTask(id) {
    if (!S || S.flags.gameOver) return false;
    const t = taskById[id];
    const st = S.tasks[id];
    if (!t || !st || st.owned || st.automated) return false;
    if (!tierUnlocked(t.tier)) return false;
    const cost = unlockCost(t);
    if (S.money < cost) return false;

    S.money -= cost;
    st.owned = true;
    st.level = 1;
    S.robot.idleAnnounced = false;

    const line = DATA.reskillLines[Math.floor(Math.random() * DATA.reskillLines.length)];
    log('RESKILLED: ' + t.name + '. ' + line, 'log-good');

    if (S.pip.active) {
      endPip();
      log('The PIP is rescinded. HR seems almost disappointed.', 'log-good');
    }

    emit('reskill', { task: t });
    emit('change');

    if (t.immune && !S.flags.won) {
      S.flags.won = true;
      emit('win');
    }
    return true;
  }

  function upgradeTask(id) {
    if (!S || S.flags.gameOver) return false;
    const t = taskById[id];
    const st = S.tasks[id];
    if (!t || !st.owned || st.automated) return false;
    const cost = upgradeCost(t);
    if (S.money < cost) return false;
    S.money -= cost;
    st.level++;
    emit('change');
    return true;
  }

  function buyPerk(id) {
    if (!S || S.flags.gameOver) return false;
    const p = perkById[id];
    if (!p) return false;
    if (!p.repeatable && perkCount(id) > 0) return false;
    const cost = perkCost(p);
    if (S.money < cost) return false;

    /* instant perks need a valid robot state to act on */
    if (p.type === 'delayRobot' || p.type === 'sabotage') {
      if (S.robot.target === null) return false;
    }

    S.money -= cost;
    S.perkCounts[id] = perkCount(id) + 1;

    if (p.type === 'delayRobot') {
      S.robot.progress = Math.max(0, S.robot.progress - p.value);
      S.stats.unionCalls++;
      log('Gary from the union files a grievance. The Robot pauses to read all 900 pages. Beautiful.', 'log-good');
      emit('sabotage', { kind: 'union' });
    } else if (p.type === 'sabotage') {
      S.robot.progress = 0;
      S.stats.coffeesSpilled++;
      log('You spill coffee on the Robot. It reboots. Somewhere in its logs, it writes your name.', 'log-good');
      emit('sabotage', { kind: 'coffee' });
    } else {
      log('PURCHASED: ' + p.name + '.', 'log-good');
    }

    emit('change');
    return true;
  }

  function clickWork() {
    if (S.flags.gameOver) return 0;
    const gain = clickPower();
    S.money += gain;
    S.totalEarned += gain;
    S.stats.clicks++;
    return gain;
  }

  /* ---------- persistence ---------- */
  function storage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* file:// privacy modes etc. */ }
    return null;
  }

  function save() {
    const store = storage();
    if (!store || !S) return;
    S.lastSeen = Date.now();
    try { store.setItem(BALANCE.saveKey, JSON.stringify(S)); } catch (e) { /* full disk, private mode */ }
  }

  /* Advance a saved game across the time the tab was closed.
     Generous rules: full income rate, capped hours, the robot may
     finish at most ONE lesson while you're away, PIP is frozen. */
  function applyOffline(elapsed) {
    if (!S || S.flags.gameOver || !Number.isFinite(elapsed) || elapsed <= 0) {
      return { elapsed: 0, earned: 0, learnedTask: null };
    }
    const capped = Math.min(elapsed, BALANCE.offlineCapHours * 3600);
    const earned = ips() * capped;
    S.money += earned;
    S.totalEarned += earned;
    S.companyProfits += automatedIps() * BALANCE.companyGreedMult * capped;
    S.playTime += capped;

    let learnedTask = null;
    if (!S.flags.gameOver && !S.pip.active) {
      let t = S.robot.grace > 0 ? null : (S.robot.target ? taskById[S.robot.target] : null);
      S.robot.grace = Math.max(0, S.robot.grace - capped);
      if (t) {
        S.robot.progress += capped;
        if (S.robot.progress >= S.robot.duration) {
          learnedTask = t;
          S.tasks[t.id].automated = true;
          S.robot.absorbed++;
          S.stats.tasksLost++;
          S.robot.target = null;
          S.robot.progress = 0;
          if (activeTasks().length === 0) startPip();
        }
      }
    }
    return { elapsed: capped, earned, learnedTask };
  }

  function load() {
    const store = storage();
    let offline = null;
    S = null;
    if (store) {
      try {
        const raw = store.getItem(BALANCE.saveKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.v === 1 && parsed.tasks) {
            S = Object.assign(freshState(), parsed);
            // Restore missing fields from older saves; reject damaged values.
            const defaults = freshState();
            for (const key of ['money', 'totalEarned', 'companyProfits', 'playTime', 'lastSeen']) {
              if (!Number.isFinite(S[key]) || S[key] < 0) throw new Error('Invalid save');
            }
            for (const section of ['robot', 'pip', 'flags', 'stats']) {
              S[section] = Object.assign({}, defaults[section], parsed[section]);
              for (const [key, value] of Object.entries(defaults[section])) {
                if (value === null) continue;
                const saved = S[section][key];
                if (typeof saved !== typeof value ||
                    (typeof value === 'number' && (!Number.isFinite(saved) || saved < 0))) {
                  throw new Error('Invalid save');
                }
              }
            }
            S.perkCounts = Object.fromEntries(DATA.perks.map(p => {
              const count = parsed.perkCounts?.[p.id] ?? 0;
              if (!Number.isSafeInteger(count) || count < 0 || (!p.repeatable && count > 1)) {
                throw new Error('Invalid save');
              }
              return [p.id, count];
            }));
            /* forward-compat: ensure every task exists in the save */
            DATA.tasks.forEach(t => {
              if (!S.tasks[t.id]) S.tasks[t.id] = defaults.tasks[t.id];
              const st = S.tasks[t.id];
              if (typeof st.owned !== 'boolean' || typeof st.automated !== 'boolean' ||
                  !Number.isSafeInteger(st.level) || st.level < 1 ||
                  (st.automated && (!st.owned || t.immune))) throw new Error('Invalid save');
            });
            if (S.robot.target !== null && (!taskById[S.robot.target] ||
                !validTargets().some(t => t.id === S.robot.target) || S.robot.duration <= 0)) {
              S.robot.target = null;
              S.robot.progress = 0;
            }
            const away = (Date.now() - (S.lastSeen || Date.now())) / 1000;
            if (away > 15 && S.flags.introSeen && !S.flags.gameOver) offline = applyOffline(away);
          }
        }
      } catch (e) { S = null; }
    }
    if (!S) S = freshState();
    // Persist credited earnings immediately so a quick reload cannot claim them twice.
    save();
    return offline;
  }

  function reset() {
    const muted = S ? S.flags.muted : true;
    const store = storage();
    if (store) { try { store.removeItem(BALANCE.saveKey); } catch (e) {} }
    S = freshState();
    S.flags.muted = muted;
    S.flags.introSeen = true; // don't replay the intro on a deliberate restart
    emit('change');
  }

  /* ---------- public API ---------- */
  return {
    on, emit, tick, save, load, reset, fmt,
    away: applyOffline,
    buyTask, upgradeTask, buyPerk, clickWork,
    ips, automatedIps, clickPower, doom, day, robotVersion,
    unlockCost, upgradeCost, perkCost, perkCount, taskIncome,
    tierUnlocked, activeTasks, automatedTasks, validTargets,
    taskById: id => taskById[id],
    get state() { return S; },
    AUTOMATABLE_TOTAL,
  };
})();

/* Allow the headless smoke test to import this file under Node. */
if (typeof module !== 'undefined' && module.exports) module.exports = { Game };
