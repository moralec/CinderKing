// (A copy of archetypes/game-phaser/testkit/replay-rpg.mjs of the build kit, unchanged below; engine.mjs runs it with lib/gate.mjs.)
// replay-rpg.mjs - the round 1-3 replay of the Town RPG (the R1-R3 hook of the coding semi's briefs: player, maps, landmarks,
// blocked, dialogueOpen, lastMessage, party, battle, menuOpen, menuOptions, quest, actions.move/pressA/pressB/pressStart/save/load/
// grantXp/startBattle/setEncounters). gate.mjs runs it when a plan copies this file to tests/replay.mjs; a plan for another
// game keeps the empty replay.mjs (or writes its own list of the same shape).
//
// Each entry: { id, what, run: async (t, H) => note }. run throws (or H.fail) when the old thing broke; the message says what a
// player would see and where to look. Every entry starts on a fresh page. These are the checker's round 1-3 checks that matter
// most (the ones later rounds broke: move(dir, 2), dialogue pages, the battle log, the house door, the quest giver), cut short.
export const REPLAY = [
  { id: 'R1-01', what: 'the round 1-3 hook is complete', run: async (t, H) => {
    const miss = await H.ev(`(() => { const g = window.__game, miss = []; const q = g.player;
      if (!q || !Number.isInteger(q.x) || !Number.isInteger(q.y) || !q.map) miss.push('player{x,y,map}');
      for (const k of ['inventory', 'maps', 'party']) if (!Array.isArray(g[k])) miss.push(k + '[]');
      const L = g.landmarks || {}; for (const k of ['door', 'exit', 'npc', 'water', 'giver', 'toForest', 'toTown']) if (!L[k]) miss.push('landmarks.' + k);
      if (typeof g.blocked !== 'function') miss.push('blocked()');
      for (const k of ['move', 'pressA', 'pressB', 'pressStart', 'save', 'load', 'grantXp', 'useItem', 'startBattle', 'setEncounters']) if (typeof (g.actions || {})[k] !== 'function') miss.push('actions.' + k);
      for (const k of ['dialogueOpen', 'lastMessage', 'menuOpen', 'menuOptions', 'quest', 'battle', 'ui']) if (!(k in g)) miss.push(k);
      return miss; })()`, ['window.__game missing']);
    H.must(miss.length === 0, 'window.__game lost round 1-3 fields: ' + miss.join(', ') + ' (a later file replaced or shadowed them: keep every old field)');
  } },
  { id: 'R1-03', what: 'move(dir, 2) walks exactly 2 tiles', run: async (t, H) => {
    const q = await H.pos();
    for (const [d, [dx, dy]] of Object.entries(H.DV)) {
      if (!(await H.free(q.x + dx, q.y + dy)) || !(await H.free(q.x + 2 * dx, q.y + 2 * dy))) continue;
      await H.ev(`Promise.resolve(window.__game.actions.move('${d}', 2)).then(() => true)`);
      let a = await H.settle(q, 3000); if (Math.abs(a.x - q.x) + Math.abs(a.y - q.y) < 2) { await H.sleep(800); a = await H.settle(a, 2000); }
      H.must(a.x === q.x + 2 * dx && a.y === q.y + 2 * dy && a.map === q.map, `actions.move('${d}', 2) went from ${q.x},${q.y} to ${a.x},${a.y} on ${a.map}: it must walk exactly 2 tiles (a wrapped move that drops the count, or steps that stop after one?)`);
      return `move('${d}', 2) ok`;
    }
    H.fail('no clear 2-tile line next to the start tile');
  } },
  { id: 'R1-06', what: 'the house door leads in and the exit back out', run: async (t, H) => {
    const door = await H.lm('door'), start = await H.pos(); H.must(door, 'landmarks.door missing');
    await H.walkTo(door.x, door.y);
    let now = await H.pos();
    if (now.map === start.map) { await H.walkTo(door.x, door.y, true); await H.face(door.x, door.y); await H.sleep(300); if ((await H.pos()).map === start.map) { await H.A(800); } now = await H.settle(await H.pos()); }
    H.must(now.map !== start.map, `walking onto the house door (${door.x},${door.y}) did not change the map (still ${now.map})`);
    const ex = await H.lm('exit'); H.must(ex, 'landmarks.exit missing');
    await H.walkTo(ex.x, ex.y); await H.sleep(500); now = await H.settle(await H.pos());
    if (now.map !== start.map) { await H.walkTo(ex.x, ex.y, true); await H.face(ex.x, ex.y); await H.sleep(400); now = await H.settle(await H.pos()); }
    H.must(now.map === start.map, `the house exit (${ex.x},${ex.y}) did not lead back to ${start.map} (now ${now.map})`);
  } },
  { id: 'R1-08', what: 'the villager talks in >= 2 pages and the box closes', run: async (t, H) => {
    const n = await H.lm('npc'); H.must(n, 'landmarks.npc missing');
    const r = await H.walkTo(n.x, n.y, true); H.must(r.ok, 'cannot reach the villager: ' + r.why);
    await H.face(n.x, n.y); await H.A(700);
    H.must(await H.ev('window.__game.dialogueOpen', false), 'A facing the villager opened no dialogue (dialogueOpen stayed false)');
    const pages = new Set(); let closed = false;
    for (let i = 0; i < 14; i++) { const m = await H.ev('window.__game.lastMessage', ''); if (m) pages.add(m); await H.A(400); if (!(await H.ev('window.__game.dialogueOpen', true))) { closed = true; break; } }
    H.must(pages.size >= 2 && closed, `the villager's dialogue showed ${pages.size} distinct page(s) (lastMessage per A press) and closed ${closed}: it must page through >= 2 pages, one per A, then close`);
  } },
  { id: 'R2-12', what: 'Start opens the menu with Party and Items, B closes it', run: async (t, H) => {
    await H.ev('window.__game.actions.pressStart()'); await H.sleep(600);
    const open = await H.ev('window.__game.menuOpen', false), opts = (await H.ev('window.__game.menuOptions', [])) || [];
    await H.ev('window.__game.actions.pressB()'); await H.sleep(500);
    const closed = !(await H.ev('window.__game.menuOpen', true));
    H.must(open && ['party', 'items'].every((k) => opts.some((o) => String(o).toLowerCase().includes(k))) && closed, `Start menu: open ${open}, options ${JSON.stringify(opts)}, B closed it ${closed}`);
  } },
  { id: 'R2-14', what: 'a battle: A rolls a visible d20, the log grows, the battle ends', run: async (t, H) => {
    H.must(await H.ev('window.__game.actions.startBattle()', false), 'actions.startBattle() returned false on a fresh page');
    H.must(await H.until('!!(window.__game.battle && window.__game.battle.active)', 3000), 'startBattle() did not make battle.active true');
    await H.sleep(600);
    const l0 = (await H.ev('(window.__game.battle.log || []).length', 0)) || 0;
    await H.A(1200);
    const br = await H.ev('({ r: window.__game.battle.lastRoll, n: (window.__game.battle.log || []).length })', {});
    const r = br.r;
    H.must(r && r.die === 20 && Number.isInteger(r.value) && r.value >= 1 && r.value <= 20 && Number.isFinite(r.total), `A in a battle must roll a d20: battle.lastRoll ${JSON.stringify(r)}`);
    H.must(br.n > l0, `A in a battle must add a line to battle.log (it stayed at ${l0} lines): the attack is not logged`);
    for (let i = 0; i < 80 && (await H.ev('!!(window.__game.battle && window.__game.battle.active)', false)); i++) await H.A(250);
    const res = await H.ev('window.__game.battle && window.__game.battle.result', null);
    H.must(['win', 'lose'].includes(res), `repeated A must end the battle with battle.result 'win' or 'lose' (got ${JSON.stringify(res)})`);
  } },
  { id: 'R2-17', what: 'grantXp raises the level and max HP', run: async (t, H) => {
    const c0 = await H.ev('({ l: window.__game.party[0].level, m: window.__game.party[0].maxHp })');
    for (let i = 0; i < 8; i++) {
      await H.ev(`window.__game.actions.grantXp(${i < 4 ? 100 : 1000})`); await H.sleep(300); await H.busyClear();
      const c1 = await H.ev('({ l: window.__game.party[0].level, m: window.__game.party[0].maxHp })');
      if (c1.l > c0.l) { H.must(c1.m > c0.m, `level ${c0.l} -> ${c1.l} but maxHp stayed ${c0.m}`); return; }
    }
    H.fail('grantXp (4400 XP in all) raised no level');
  } },
  { id: 'R2-18', what: 'save, move, load restores; and after a page reload', run: async (t, H) => {
    const st = () => H.ev('({ x: window.__game.player.x, y: window.__game.player.y, map: window.__game.player.map, inv: window.__game.inventory.length, lvl: window.__game.party[0].level })');
    const s0 = await st(); await H.ev('window.__game.actions.save()'); await H.sleep(300);
    const d = await H.openDir(); if (d) await H.step(d);
    await H.ev('window.__game.actions.load()'); await H.sleep(1000);
    const s1 = await st();
    H.must(JSON.stringify(s1) === JSON.stringify(s0), `actions.load() after a step did not restore the save: saved ${JSON.stringify(s0)}, got ${JSON.stringify(s1)}`);
    await t.open({ clear: false }); await H.ev('window.__game.actions.load()'); await H.sleep(1000);
    const s2 = await st();
    H.must(JSON.stringify(s2) === JSON.stringify(s0), `after a page reload actions.load() gave ${JSON.stringify(s2)}, saved ${JSON.stringify(s0)}`);
  } },
  { id: 'R3-20', what: 'the town edge leads to the forest and back', run: async (t, H) => {
    H.portals(['door', 'exit', 'toForest', 'toTown', 'crypt', 'cryptExit']);
    const start = await H.pos();
    H.must(await H.through('toForest'), 'walking onto landmarks.toForest did not change the map');
    const f = await H.pos();
    H.must(await H.through('toTown'), `in the forest (${f.map}) walking onto landmarks.toTown did not change the map`);
    const back = await H.pos(); H.must(back.map === start.map, `toTown led to ${back.map}, not ${start.map}`);
  } },
  { id: 'R3-21', what: 'the quest giver starts the quest: stage 0 -> 1', run: async (t, H) => {
    H.portals(['door', 'exit', 'toForest', 'toTown', 'crypt', 'cryptExit']);
    const s0 = await H.ev('window.__game.quest.stage', null);
    const g = await H.lm('giver'); H.must(g, 'landmarks.giver missing');
    const r = await H.walkTo(g.x, g.y, true); H.must(r.ok, 'cannot reach the quest giver: ' + r.why);
    await H.face(g.x, g.y); await H.A(600);
    let pages = 0; for (let i = 0; i < 14 && (await H.ev('window.__game.dialogueOpen', false)); i++) { pages++; await H.A(300); }
    const s1 = await H.ev('window.__game.quest.stage', null);
    H.must(s0 === 0 && s1 === 1 && pages >= 2, `talking to the quest giver: ${pages} page(s), quest.stage ${s0} -> ${s1} (wanted >= 2 pages and 0 -> 1)`);
  } },
];
