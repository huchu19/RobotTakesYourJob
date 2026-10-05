/* ============================================================
   UI — everything DOM. Subscribes to Game events, renders
   panels, and forwards player intent back into Game.
   ============================================================ */

const UI = (() => {

  const $ = id => document.getElementById(id);
  const els = {};
  let costButtons = [];       // [{btn, getCost, extra}] refreshed on rebuild
  let cheapestReskill = Infinity;

  /* ================= helpers ================= */

  function fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ================= log ================= */

  function addLog(text, cls, day) {
    const li = el('li', cls || '');
    li.innerHTML = `<span class="log-day">D${day || Game.day()}</span>${text}`;
    els.logList.prepend(li);
    while (els.logList.children.length > 60) els.logList.lastChild.remove();
  }

  /* ================= toasts ================= */

  function toast(title, small, cls, ms) {
    const t = el('div', 'toast ' + (cls || ''), title + (small ? `<span class="toast-small">${small}</span>` : ''));
    els.toasts.appendChild(t);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 450);
    }, ms || 5000);
    while (els.toasts.children.length > 3) els.toasts.firstChild.remove();
  }

  /* ================= modal ================= */

  function showModal({ title, body, cls, buttons }) {
    els.modal.className = 'modal ' + (cls || '');
    els.modalTitle.innerHTML = title;
    els.modalBody.innerHTML = body;
    els.modalBtns.innerHTML = '';
    (buttons || [{ label: 'OK' }]).forEach(b => {
      const btn = el('button', 'pxbtn ' + (b.cls || ''), b.label);
      btn.onclick = () => { hideModal(); if (b.fn) b.fn(); };
      els.modalBtns.appendChild(btn);
    });
    els.veil.classList.remove('hidden');
  }
  function hideModal() { els.veil.classList.add('hidden'); }
  function modalOpen() { return !els.veil.classList.contains('hidden'); }

  /* ================= card builders ================= */

  function iconCanvas(iconKey) {
    const cv = el('canvas', 'card-icon');
    Renderer.drawIcon(cv, iconKey);
    return cv;
  }

  function taskCard(t) {
    const st = Game.state.tasks[t.id];
    const targeted = Game.state.robot.target === t.id;
    const card = el('div', 'card' + (t.immune ? ' immune' : '') + (targeted ? ' targeted' : ''));
    card.appendChild(iconCanvas(t.icon));
    card.appendChild(el('div', 'card-name', t.name));
    card.appendChild(el('div', 'card-sub',
      `<span class="inc">${Game.fmt(Game.taskIncome(t))}/s</span> · <span class="lvl">LV ${st.level}</span>` +
      (targeted ? ' · <span style="color:var(--red)">⚠ BEING STUDIED</span>' : '') +
      (t.immune ? ' · <span style="color:var(--green)">UN-AUTOMATABLE</span>' : '')));

    const act = el('div', 'card-act');
    const upgCost = Game.upgradeCost(t);
    const btn = el('button', 'pxbtn buy', 'UPGRADE');
    btn.onclick = () => {
      if (Game.upgradeTask(t.id)) SFX.play('upgrade');
      else SFX.play('error');
    };
    act.appendChild(btn);
    act.appendChild(el('div', 'card-cost', Game.fmt(upgCost)));
    card.appendChild(act);
    card.appendChild(el('div', 'card-flavor', t.flavor));
    costButtons.push({ btn, getCost: () => Game.upgradeCost(t) });
    return card;
  }

  function lostCard(t) {
    const card = el('div', 'card automated');
    card.appendChild(iconCanvas(t.icon));
    card.appendChild(el('div', 'card-name', t.name));
    card.appendChild(el('div', 'card-sub', 'Now performed flawlessly, joylessly, forever.'));
    const act = el('div', 'card-act');
    act.appendChild(el('div', 'stamp auto', 'AUTOMATED'));
    card.appendChild(act);
    return card;
  }

  function reskillCard(t) {
    const cost = Game.unlockCost(t);
    const card = el('div', 'card');
    card.appendChild(iconCanvas(t.icon));
    card.appendChild(el('div', 'card-name', t.name));
    card.appendChild(el('div', 'card-sub', `${t.desc}<br><span class="inc">${Game.fmt(t.income)}/s</span> base`));
    const act = el('div', 'card-act');
    const btn = el('button', 'pxbtn buy', 'RESKILL');
    btn.onclick = () => {
      if (Game.buyTask(t.id)) SFX.play('buy');
      else SFX.play('error');
    };
    act.appendChild(btn);
    act.appendChild(el('div', 'card-cost', Game.fmt(cost)));
    card.appendChild(act);
    costButtons.push({ btn, getCost: () => Game.unlockCost(t) });
    return card;
  }

  function perkCard(p) {
    const owned = Game.perkCount(p.id);
    const card = el('div', 'card perk');
    const soldOut = !p.repeatable && owned > 0;
    card.appendChild(el('div', 'card-name', p.name + (p.repeatable && owned ? ` <span class="lvl">×${owned}</span>` : '')));
    card.appendChild(el('div', 'card-sub', p.desc));
    const act = el('div', 'card-act');
    if (soldOut) {
      act.appendChild(el('div', 'stamp safe', 'OWNED'));
    } else {
      const btn = el('button', 'pxbtn buy', 'BUY');
      btn.onclick = () => {
        if (Game.buyPerk(p.id)) SFX.play(p.type === 'sabotage' ? 'sabotage' : 'buy');
        else SFX.play('error');
      };
      act.appendChild(btn);
      act.appendChild(el('div', 'card-cost', Game.fmt(Game.perkCost(p))));
      const extra = (p.type === 'delayRobot' || p.type === 'sabotage')
        ? () => Game.state.robot.target !== null : null;
      costButtons.push({ btn, getCost: () => Game.perkCost(p), extra });
    }
    card.appendChild(act);
    return card;
  }

  /* ================= tab pages ================= */

  function rebuild() {
    costButtons = [];
    const S = Game.state;

    /* ---- TASKS ---- */
    const tasksPage = els.tabTasks;
    tasksPage.innerHTML = '';
    const active = Game.activeTasks();
    if (active.length) {
      tasksPage.appendChild(el('div', 'tier-head', 'YOUR REMAINING PURPOSE <span class="tier-tag">Tasks currently keeping you employed.</span>'));
      active.forEach(t => tasksPage.appendChild(taskCard(t)));
    } else {
      tasksPage.appendChild(el('div', 'empty-note', 'You have no tasks.<br>The desk is clean. Too clean.<br><b style="color:var(--yellow)">RESKILL. NOW.</b>'));
    }
    const lost = Game.automatedTasks();
    if (lost.length) {
      tasksPage.appendChild(el('div', 'tier-head', 'LOST TO THE MACHINE <span class="tier-tag">A memorial wall of things you used to do.</span>'));
      lost.forEach(t => tasksPage.appendChild(lostCard(t)));
    }

    /* ---- RESKILL ---- */
    const shop = els.tabReskill;
    shop.innerHTML = '';
    cheapestReskill = Infinity;
    DATA.tiers.forEach(tier => {
      const tierTasks = DATA.tasks.filter(t => t.tier === tier.id);
      const buyable = tierTasks.filter(t => !S.tasks[t.id].owned && !S.tasks[t.id].automated);
      if (!buyable.length) return;
      shop.appendChild(el('div', 'tier-head', tier.name + `<span class="tier-tag">${tier.tagline}</span>`));
      if (!Game.tierUnlocked(tier.id)) {
        const need = tier.unlockAuto - S.robot.absorbed;
        shop.appendChild(el('div', 'tier-locked-note',
          `LOCKED — you're not desperate enough yet. Unlocks after <b>${need} more</b> of your tasks ${need === 1 ? 'is' : 'are'} automated.`));
        return;
      }
      buyable.forEach(t => {
        shop.appendChild(reskillCard(t));
        cheapestReskill = Math.min(cheapestReskill, Game.unlockCost(t));
      });
    });
    if (!shop.children.length) {
      shop.appendChild(el('div', 'empty-note', 'The job market is empty.<br>You hold every remaining human profession.<br>All of them.'));
    }

    /* ---- PERKS ---- */
    const perks = els.tabPerks;
    perks.innerHTML = '';
    perks.appendChild(el('div', 'tier-head', 'CAREER DEVELOPMENT <span class="tier-tag">Purchases that whisper "you\'re fine" while the floor turns to chrome.</span>'));
    DATA.perks.forEach(p => perks.appendChild(perkCard(p)));

    /* robot readout */
    els.roVer.textContent = `HR-9000 v${Game.robotVersion()}.0`;
    els.roCount.textContent = `${S.robot.absorbed}/${Game.AUTOMATABLE_TOTAL}`;
  }

  /* ================= cheap per-tick updates ================= */

  function updateThreatBar() {
    const S = Game.state;
    const bar = els.threatBar;
    let cls = '', label = '', fill = 0, time = '';

    if (S.flags.gameOver) {
      cls = 'idle'; label = 'EMPLOYMENT TERMINATED.'; fill = 0;
    } else if (S.pip.active) {
      cls = 'pip';
      label = '⚠ PERFORMANCE IMPROVEMENT PLAN — GET A TASK';
      fill = Math.min(1, S.pip.remaining / (BALANCE.pipSeconds +
        DATA.perks.filter(p => p.type === 'pipBonus' && Game.perkCount(p.id))
          .reduce((sum, p) => sum + p.value, 0)));
      time = fmtTime(S.pip.remaining);
    } else if (S.robot.grace > 0) {
      cls = 'idle';
      label = 'THE ROBOT IS OBSERVING YOUR WORKFLOW…';
      fill = 1 - S.robot.grace / BALANCE.graceBeforeFirstLesson;
      time = fmtTime(S.robot.grace);
    } else if (S.robot.target) {
      const t = Game.taskById(S.robot.target);
      fill = Math.min(1, S.robot.progress / S.robot.duration);
      label = `THE ROBOT IS LEARNING: ${t.name.toUpperCase()}`;
      time = fmtTime(S.robot.duration - S.robot.progress);
      cls = fill > 0.72 ? 'alert' : '';
    } else {
      cls = 'idle';
      label = S.flags.won
        ? 'IT HAS EVERY JOB. IT IS IN THERAPY. (YOURS.)'
        : 'THE ROBOT HAS NOTHING LEFT TO LEARN. IT WATCHES.';
      fill = 0;
    }

    bar.className = cls;
    els.threatLabel.textContent = label;
    els.threatFill.style.width = (fill * 100).toFixed(1) + '%';
    els.threatTime.textContent = time;
  }

  function updateStatus() {
    const S = Game.state;
    let html;
    if (S.flags.gameOver) html = '<span class="badge badge-doom">REDUNDANT</span>';
    else if (S.pip.active) html = '<span class="badge badge-warn">ON PIP</span>';
    else if (S.flags.won) html = '<span class="badge badge-win">AUTO-PROOF</span>';
    else html = '<span class="badge badge-ok">EMPLOYED</span>';
    if (els.status.innerHTML !== html) els.status.innerHTML = html;
  }

  function lerpHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  function updateCheap() {
    const S = Game.state;
    if (!S) return;
    els.money.textContent = Game.fmt(S.money);
    els.ips.textContent = Game.fmt(Game.ips()) + '/s';
    els.day.textContent = 'DAY ' + Game.day();
    els.profits.textContent = Game.fmt(S.companyProfits);
    els.workAmt.textContent = '+' + Game.fmt(Game.clickPower());
    $('btn-work').disabled = S.flags.gameOver;

    updateThreatBar();
    updateStatus();

    /* affordability */
    costButtons.forEach(({ btn, getCost, extra }) => {
      const ok = !S.flags.gameOver && S.money >= getCost() && (!extra || extra());
      btn.disabled = !ok;
    });

    /* nudge dot on the RESKILL tab when something is affordable */
    const dot = S.money >= cheapestReskill && cheapestReskill !== Infinity;
    const tabBtn = els.tabBtns.reskill;
    const has = tabBtn.querySelector('.tab-dot');
    if (dot && !has) tabBtn.insertAdjacentHTML('beforeend', ' <span class="tab-dot">●</span>');
    if (!dot && has) has.remove();

    /* doom leaks into the chrome of the page itself */
    const doom = Game.doom();
    document.documentElement.style.setProperty('--doom', doom.toFixed(3));
    document.documentElement.style.setProperty('--accent', lerpHex('#d6cdb8', '#ff3b4d', doom));
  }

  /* ================= ticker ================= */

  function shuffleTicker() {
    const picks = [...DATA.headlines].sort(() => Math.random() - 0.5).slice(0, 6);
    els.tickerText.textContent = picks.join('  +++  ') + '  +++';
  }

  /* ================= game event wiring ================= */

  function onLearned({ task }) {
    SFX.play('learn');
    Renderer.learnFx(task);
    els.stageWrap.classList.remove('shake');
    void els.stageWrap.offsetWidth;      // restart the animation
    els.stageWrap.classList.add('shake');
    toast(`THE ROBOT HAS LEARNED:<br>${task.name.toUpperCase()}`,
      `Income lost: ${Game.fmt(task.income)}/s. It does not thank you for the training data.`, '', 6000);
  }

  function onWin() {
    SFX.play('win');
    showModal({
      title: '★ ' + DATA.winText.title + ' ★',
      body: DATA.winText.body +
        `<br><br><span class="mstat">Achieved on <b>DAY ${Game.day()}</b> · Total earned: <b>${Game.fmt(Game.state.totalEarned)}</b> · Tasks fed to the machine: <b>${Game.state.stats.tasksLost}</b></span>`,
      cls: 'win',
      buttons: [{ label: 'KEEP LISTENING (ENDLESS)', cls: 'buy' }],
    });
  }

  function onGameOver() {
    SFX.play('lose');
    const S = Game.state;
    showModal({
      title: DATA.loseText.title,
      body: DATA.loseText.body + `
        <br><br>
        <p class="mstat">Days employed: <b>DAY ${Game.day()}</b></p>
        <p class="mstat">Total earned: <b>${Game.fmt(S.totalEarned)}</b></p>
        <p class="mstat">Tasks lost to the machine: <b>${S.stats.tasksLost}</b></p>
        <p class="mstat">Overtime clicks: <b>${S.stats.clicks}</b> · Coffees weaponized: <b>${S.stats.coffeesSpilled}</b></p>`,
      cls: 'doom',
      buttons: [{
        label: 'START OVER (AGAIN)', cls: 'danger',
        fn: () => { Game.reset(); rebuild(); addLog('A new hire badge prints. It is warm. It is yours. For now.', 'log-flavor', 1); },
      }],
    });
  }

  function showIntro() {
    showModal({
      title: 'DAY 1 — ORIENTATION',
      body: `
        <p>Welcome to <b>Innovatech Dynamics</b>. You are our new <b>Data Entry Clerk</b>.</p>
        <p>You may have noticed <b style="color:var(--red)">HR-9000</b> by the charging dock. It is a productivity companion. It is here to help. It watches you work so it can "help" better.</p>
        <p class="mstat">▸ Your tasks earn money automatically — even while you're away.<br>
        ▸ Smash <b>WORK OVERTIME</b> for a little extra.<br>
        ▸ When the Robot learns a task, it's gone forever. <b>RESKILL</b> before you run out of job.</p>`,
      buttons: [{ label: 'CLOCK IN', cls: 'buy', fn: () => {
        Game.state.flags.introSeen = true;
        addLog('You clock in. The badge reader beeps approvingly. It is the most validation you will receive today.', 'log-flavor', 1);
      } }],
    });
  }

  function showOffline(off) {
    const line = DATA.offlineLines[Math.floor(Math.random() * DATA.offlineLines.length)];
    const hrs = off.elapsed >= 3600
      ? (off.elapsed / 3600).toFixed(1) + ' hours'
      : Math.round(off.elapsed / 60) + ' minutes';
    showModal({
      title: 'WHILE YOU WERE AWAY',
      body: `<p>${line}</p>
        <p class="mstat">Time away: <b>${hrs}</b><br>Earned: <b>${Game.fmt(off.earned)}</b></p>` +
        (off.learnedTask ? `<p style="color:var(--red)">The Robot used the quiet time well. It has learned to <b>${off.learnedTask.name}</b>.</p>` : ''),
      buttons: [{ label: 'BACK TO WORK' }],
    });
  }

  /* ================= actions ================= */

  function doWork(px, py) {
    if (Game.state.flags.gameOver || modalOpen()) return;
    const gain = Game.clickWork();
    SFX.play('cash');
    Renderer.floater('+' + Game.fmt(gain), '#6fdc4f', px, py);
  }

  /* ================= init ================= */

  function init() {
    els.money = $('stat-money'); els.ips = $('stat-ips'); els.day = $('stat-day');
    els.profits = $('stat-profits'); els.status = $('stat-status');
    els.threatBar = $('threat-bar'); els.threatLabel = $('threat-label');
    els.threatFill = $('threat-fill'); els.threatTime = $('threat-time');
    els.logList = $('log-list'); els.toasts = $('toasts');
    els.veil = $('modal-veil'); els.modal = $('modal');
    els.modalTitle = $('modal-title'); els.modalBody = $('modal-body'); els.modalBtns = $('modal-btns');
    els.tabTasks = $('tab-tasks'); els.tabReskill = $('tab-reskill'); els.tabPerks = $('tab-perks');
    els.tickerText = $('ticker-text'); els.stageWrap = $('stage-wrap');
    els.workAmt = $('work-amt'); els.roVer = $('ro-ver'); els.roCount = $('ro-count');
    els.tabBtns = {};

    /* tabs */
    document.querySelectorAll('.tab').forEach(btn => {
      els.tabBtns[btn.dataset.tab] = btn;
      btn.onclick = () => {
        SFX.play('tab');
        document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-page').forEach(p =>
          p.classList.toggle('active', p.id === 'tab-' + btn.dataset.tab));
      };
    });

    /* work button + clicking the office itself */
    $('btn-work').onclick = () => doWork();
    els.stageWrap.addEventListener('pointerdown', ev => {
      const r = els.stageWrap.getBoundingClientRect();
      doWork((ev.clientX - r.left) / r.width * 320, (ev.clientY - r.top) / r.height * 180);
    });

    /* spacebar = overtime */
    document.addEventListener('keydown', ev => {
      if (ev.code === 'Space' && !modalOpen() && ev.target === document.body) {
        ev.preventDefault();
        doWork();
      }
    });

    /* sound toggle */
    const muteBtn = $('btn-mute');
    function syncMute() { muteBtn.textContent = SFX.muted ? 'SND:OFF' : 'SND:ON'; }
    muteBtn.onclick = () => {
      SFX.setMuted(!SFX.muted);
      Game.state.flags.muted = SFX.muted;
      syncMute();
      SFX.play('click');
    };
    SFX.setMuted(Game.state.flags.muted !== false);
    syncMute();

    /* reset */
    $('btn-reset').onclick = () => showModal({
      title: 'WIPE SAVE?',
      body: '<p>This deletes your entire career. The Robot keeps its memories. You do not.</p>',
      cls: 'doom',
      buttons: [
        { label: 'CANCEL' },
        { label: 'WIPE IT', cls: 'danger', fn: () => { Game.reset(); rebuild(); addLog('Fresh start. Same fluorescent hum.', 'log-flavor', 1); } },
      ],
    });

    /* game events */
    Game.on('change', rebuild);
    Game.on('log', ({ text, cls, day }) => addLog(text, cls, day));
    Game.on('learned', onLearned);
    Game.on('target', ({ task }) => {
      rebuild();
      if (task) addLog(`The Robot swivels its sensors toward: <b>${task.name}</b>.`, 'log-bad');
    });
    Game.on('reskill', ({ task }) => toast('RESKILLED:<br>' + task.name.toUpperCase(), task.desc, 'good', 3500));
    Game.on('pip-start', () => { SFX.play('pip'); toast('⚠ PERFORMANCE IMPROVEMENT PLAN ⚠', 'You have no tasks. HR is "concerned". Reskill before the timer dies, or you do (professionally).', '', 7000); });
    Game.on('sabotage', ({ kind }) => Renderer.sabotageFx(kind));
    Game.on('win', onWin);
    Game.on('gameover', onGameOver);

    /* ticker */
    shuffleTicker();
    els.tickerText.addEventListener('animationiteration', shuffleTicker);

    rebuild();
    updateCheap();
    setInterval(updateCheap, 150);
    if (Game.state.flags.gameOver) onGameOver();

    /* ambient flavor drip */
    setInterval(() => {
      const S = Game.state;
      if (!S || S.flags.gameOver || modalOpen()) return;
      if (Math.random() < 0.45) {
        addLog(DATA.events[Math.floor(Math.random() * DATA.events.length)], 'log-flavor');
      }
    }, 50 * 1000);
  }

  return { init, showIntro, showOffline, addLog, toast, modalOpen };
})();
