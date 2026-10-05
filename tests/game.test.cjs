const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const saved = new Map();
  const context = vm.createContext({
    localStorage: {
      getItem: key => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
      removeItem: key => saved.delete(key),
    },
  });
  for (const file of ['data.js', 'game.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
  }
  const api = vm.runInContext('({ Game, DATA, BALANCE })', context);
  api.Game.load();
  return { ...api, saved, context };
}

test('starting income, overtime and upgrades use the published economy', () => {
  const { Game } = setup();
  assert.equal(Game.activeTasks().length, 3);
  assert.equal(Game.ips(), 3.6);
  Game.tick(10);
  assert.equal(Game.state.money, 36);
  assert.equal(Game.clickWork(), 3.6);
  assert.equal(Game.upgradeTask('t_reports'), true);
  assert.equal(Game.state.tasks.t_reports.level, 2);
  assert.ok(Math.abs(Game.ips() - 3.96) < 1e-9);
  assert.equal(Game.upgradeTask('unknown'), false);
});

test('reskilling respects tiers, balances and permanent automation', () => {
  const { Game } = setup();
  assert.equal(Game.buyTask('t_meetings'), false);
  Game.state.money = 1000;
  assert.equal(Game.buyTask('t_rideshare'), false);
  assert.equal(Game.buyTask('t_meetings'), true);
  assert.equal(Game.buyTask('t_meetings'), false);
  // Any tier-one task may be selected; meetings take longer to automate.
  Game.tick(200);
  assert.equal(Game.state.robot.absorbed, 1);
  assert.equal(Game.buyTask('t_rideshare'), true);
  const lost = Game.automatedTasks()[0];
  assert.equal(Game.buyTask(lost.id), false);
  assert.equal(Game.upgradeTask(lost.id), false);
});

test('long ticks match many short ticks across lessons, PIP and game over', () => {
  const one = setup();
  const many = setup();
  for (const fixture of [one, many]) vm.runInContext('Math.random = () => 0', fixture.context);
  one.Game.tick(800);
  for (let i = 0; i < 3200; i++) many.Game.tick(0.25);
  assert.equal(one.Game.state.flags.gameOver, true);
  assert.equal(one.Game.state.robot.absorbed, 3);
  assert.ok(Math.abs(one.Game.state.money - many.Game.state.money) < 1e-7);
  assert.ok(Math.abs(one.Game.state.playTime - many.Game.state.playTime) < 1e-7);
});

test('reskilling ends PIP; meditation extends it', () => {
  const { Game, BALANCE } = setup();
  Game.state.money = 10000;
  Game.buyPerk('p_calm');
  Game.tick(40 + 110 + 110 * 0.93 + 110 * 0.93 ** 2);
  assert.equal(Game.state.pip.active, true);
  assert.ok(Math.abs(Game.state.pip.remaining - BALANCE.pipSeconds - 30) < 1e-8);
  assert.equal(Game.buyTask('t_rideshare'), true);
  assert.equal(Game.state.pip.active, false);
});

test('perks apply discounts and sabotage only when a lesson is active', () => {
  const { Game } = setup();
  Game.state.money = 10000;
  assert.equal(Game.buyPerk('p_union'), false);
  assert.equal(Game.buyPerk('p_linkedin'), true);
  assert.equal(Game.buyPerk('p_linkedin'), false);
  assert.equal(Game.unlockCost(Game.taskById('t_rideshare')), 144);
  Game.tick(100);
  assert.equal(Game.state.robot.progress, 60);
  assert.equal(Game.buyPerk('p_union'), true);
  assert.equal(Game.state.robot.progress, 15);
  assert.equal(Game.buyPerk('p_coffee'), true);
  assert.equal(Game.state.robot.progress, 0);
  assert.equal(Game.perkCount('p_coffee'), 1);
});

test('game over prevents all purchases, work, ticks and offline earnings', () => {
  const { Game } = setup();
  Game.tick(800);
  Game.state.money = 100000;
  const before = JSON.stringify(Game.state);
  assert.equal(Game.buyTask('t_meetings'), false);
  assert.equal(Game.upgradeTask('t_reports'), false);
  assert.equal(Game.buyPerk('p_chair'), false);
  assert.equal(Game.clickWork(), 0);
  Game.tick(100);
  assert.equal(Game.away(1000).earned, 0);
  assert.equal(JSON.stringify(Game.state), before);
});

test('offline earnings are capped, finish one lesson and freeze PIP', () => {
  const { Game } = setup();
  Game.tick(50);
  const result = Game.away(24 * 3600);
  assert.equal(result.elapsed, 8 * 3600);
  assert.equal(result.earned, 3.6 * 8 * 3600);
  assert.equal(Game.state.robot.absorbed, 1);
  Game.state.pip = { active: true, remaining: 37 };
  Game.away(300);
  assert.equal(Game.state.pip.remaining, 37);
  assert.equal(Game.state.robot.absorbed, 1);
});

test('save/load restores state and cannot credit the same absence twice', () => {
  const { Game, BALANCE, saved } = setup();
  Game.state.flags.introSeen = true;
  Game.state.money = 123;
  Game.save();
  const record = JSON.parse(saved.get(BALANCE.saveKey));
  record.lastSeen -= 60000;
  saved.set(BALANCE.saveKey, JSON.stringify(record));
  const off = Game.load();
  assert.ok(off.earned >= 216 && off.earned < 217);
  const balance = Game.state.money;
  assert.equal(Game.load(), null);
  assert.equal(Game.state.money, balance);
});

test('damaged saves recover, and missing fields receive defaults', () => {
  const { Game, BALANCE, saved } = setup();
  for (const raw of ['invalid json', '{"v":1,"tasks":{},"money":"bad"}', '{"v":1,"tasks":{},"flags":null,"robot":{"progress":"bad"}}']) {
    saved.set(BALANCE.saveKey, raw);
    assert.doesNotThrow(() => Game.load());
    assert.equal(Game.ips(), 3.6);
    assert.equal(Game.state.money, 0);
  }
  saved.set(BALANCE.saveKey, '{"v":1,"tasks":{},"flags":{"introSeen":true}}');
  Game.load();
  assert.equal(Game.state.flags.introSeen, true);
  assert.equal(Game.state.flags.gameOver, false);
  assert.equal(Game.ips(), 3.6);
});

test('unavailable storage does not stop play', () => {
  const { Game, context } = setup();
  vm.runInContext('Object.defineProperty(globalThis, "localStorage", { get() { throw new Error("blocked"); } })', context);
  assert.doesNotThrow(() => { Game.load(); Game.tick(1); Game.save(); Game.reset(); });
});

test('therapist triggers victory once and can never be automated', () => {
  const { Game } = setup();
  Game.state.money = 100000;
  Game.state.robot.absorbed = 8;
  let victories = 0;
  Game.on('win', () => victories++);
  assert.equal(Game.buyTask('t_therapist'), true);
  assert.equal(Game.state.flags.won, true);
  assert.equal(Game.buyTask('t_therapist'), false);
  Game.tick(2000);
  assert.equal(Game.state.tasks.t_therapist.automated, false);
  assert.equal(Game.state.flags.gameOver, false);
  assert.equal(victories, 1);
});

test('reset clears progress and preserves the sound preference', () => {
  const { Game } = setup();
  Game.state.flags.muted = false;
  Game.tick(100);
  Game.reset();
  assert.equal(Game.state.money, 0);
  assert.equal(Game.state.flags.muted, false);
  assert.equal(Game.state.flags.introSeen, true);
  assert.equal(Game.activeTasks().length, 3);
});

test('invalid elapsed times do not corrupt state', () => {
  const { Game } = setup();
  const before = JSON.stringify(Game.state);
  for (const dt of [NaN, Infinity, -1, 0]) { Game.tick(dt); Game.away(dt); }
  assert.equal(JSON.stringify(Game.state), before);
});
