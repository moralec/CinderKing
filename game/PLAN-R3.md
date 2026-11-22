# PLAN: Brindlemere, round 3 (the Thornwood quest)

Follow this literally, top to bottom. Do not redesign. Round 3 is ADDED to your round 2 game in new small files.

- **Never edit an existing file in `js/`** (no need to read them). You only create files in `js/` and add script tags to `index.html`.
- **Write each file in one go, exactly as given** (copy, do not improve; map rows character by character).
- Tags: `<script src="js/NAME.js"></script>`. Final order after battleview: quest, world, stage, actors, things, foes, pack, smoke.
- **Clean selftest** = `timeout 120 python3 selftest.py` prints `errors: none`, `every field named in BRIEF.md is present`, and `move('right', 1)` goes from (9,8) to (10,8). Run it after every step, fix every error (`SMOKE` = the newest file is wrong; `bad row` / `bad symbol` = a map row typo), tick the box, go on.

- [x] **1. Quest state, bag, hook.** Write `js/quest.js`; tag after the `js/battleview.js` tag. Done when: clean selftest.

```js
// js/quest.js - quest state, bag, save, round 3 hook fields
G.quest = G.quest || { stage:0, flags:[] };
G.bag = G.bag || [];
const DRAUGHT = 'Healing Draught', KEY = 'Crypt Key', BELL = "Gravecaller's Bell", CHARM = 'Thornwood Charm';
const GOALS = [ 'Talk to Elder Maren\neast of the pond.', 'Find Brother Tobin\nat the cemetery in\nThornwood, east.',
  'Open the chest in\nthe north glade.', 'Unlock the crypt\ngate with the key.', 'Defeat the\nGravecaller in the\ncrypt.',
  'Take the bell back\nto Elder Maren.', 'Brindlemere sleeps\nin peace at last.' ];
const at = (map, x, y) => ({ map, x, y });
const SPOT = { giver:at('town', 24, 6), helper:at('forest', 3, 8), keeper:at('forest', 22, 13),
  chest:at('forest', 27, 3), crypt:at('forest', 27, 13), boss:at('crypt', 8, 3), vial:at('crypt', 14, 7),
  toForest:at('town', 29, 8), toTown:at('forest', 0, 9), cryptExit:at('crypt', 8, 11),
  cemetery:at('forest', 23, 14), forestGrass:at('forest', 14, 6) };
const say = pages => uiScene().showDialogue(pages);
const count = name => G.bag.filter(n => n === name).length;
const Quest = {
  set(n) { G.quest.stage = n; World.refresh(); },
  flag(id) { const f = G.quest.flags; if (f.includes(id)) return false; f.push(id); return true; } };
const Bag = {
  add(name) { G.bag.push(name); },
  drop(name) { const i = G.bag.indexOf(name); if (i >= 0) G.bag.splice(i, 1); return i >= 0; },
  use(name) { const h = G.hero; if (name !== DRAUGHT || h.hp >= h.maxHp || !Bag.drop(name)) return false;
    const r = roll(4) + roll(4) + 2; h.hp = Math.min(h.maxHp, h.hp + r);
    if (inBattle()) { G.battle.log.push(`Draught 2d4+2=${r} HP ${h.hp}/${h.maxHp}`); Battle.onChange(); }
    else say([`You drink a ${DRAUGHT}: 2d4+2 = ${r}. HP ${h.hp}/${h.maxHp}.`]);
    return true; } };
const saveR2 = Save.save;
Save.save = () => { const ok = saveR2(), s = JSON.parse(localStorage.getItem('brindlemere'));
  localStorage.setItem('brindlemere', JSON.stringify({ ...s, quest:G.quest, bag:G.bag })); return ok; };
Object.defineProperties(hook, {
  quest: { get: () => ({ id:'crypt', name:'The Restless Crypt', stage:G.quest.stage, done:G.quest.stage > 5,
    log:GOALS.slice(0, G.quest.stage + 1).map(s => s.replace(/\n/g, ' ')) }) },
  inventory: { get: () => G.inventory.concat(G.bag) } });
Object.assign(hook.landmarks, SPOT);
Object.assign(hook.actions, { useItem: name => Bag.use(name), setEncounters: on => { G.calm = !on; },
  startBattle: boss => { if (G.dialogueOpen || inBattle() || G.menuOpen || G.busy) return false; Battle.start(boss ? BOSS : null); return true; } });
```

- [x] **2. Self-check.** Write `js/smoke.js`; tag last. It plays what exists at each selftest. **Later tags go just before the smoke tag.** Done when: clean selftest.

```js
// js/smoke.js - temporary self-check, deleted in step 9
setTimeout(() => { const g = window.__game, a = g.actions;
  const shut = () => { for (let i = 0; i < 300 && (g.dialogueOpen || inBattle()); i++) a.pressA(); };
  const reach = (k, x, y) => { const t = SPOT[k], m = MAPS[t.map], seen = { [x + ',' + y]:1 }, q = [[x, y]];
    for (const [cx, cy] of q) { if (Math.abs(cx - t.x) + Math.abs(cy - t.y) < 2) return;
      for (const [dx, dy] of Object.values(DIRS)) { const nx = cx + dx, ny = cy + dy, r = m.rows[ny], c = r && m.legend[r[nx]], id = nx + ',' + ny;
        if (c && !c.solid && !seen[id]) { seen[id] = 1; q.push([nx, ny]); } } }
    throw new Error(`no path to ${k} on ${t.map}: compare the map rows with PLAN.md`); };
  const talk = k => { const t = ACTORS.find(t => t.x === SPOT[k].x && t.y === SPOT[k].y && t.map === SPOT[k].map); if (t) { t.talk(); shut(); } };
  try {
    a.grantXp(200); shut(); G.hero.hp = 1; Bag.add(DRAUGHT);
    if (!a.useItem(DRAUGHT) || G.hero.hp < 2 || g.inventory.length) throw new Error('the draught did not heal');
    shut();
    if (MAPS.crypt) { reach('giver', 9, 8); reach('toForest', 9, 8); reach('boss', 8, 10); reach('vial', 8, 10);
      for (const k of ['helper', 'keeper', 'chest', 'crypt', 'forestGrass']) reach(k, 1, 9); }
    if (typeof ACTORS !== 'undefined') { const want = typeof BOSS !== 'undefined' ? 6 : ACTORS.length > 3 ? 4 : 2;
      ['giver', 'helper', 'keeper', 'chest', 'crypt', 'vial'].forEach(talk);
      for (let i = 0; i < 40 && want > 4 && g.quest.stage < 5; i++) talk('boss');
      talk('giver'); if (g.quest.stage !== want) throw new Error(`quest stopped at stage ${g.quest.stage}, expected ${want}`); }
    G.quest = { stage:0, flags:[] }; G.bag = []; G.hero.hp = G.hero.maxHp; a.save(); a.load(); shut();
    if (g.menuOpen || g.dialogueOpen || inBattle()) throw new Error('menu, battle or box stuck');
  } catch (e) { console.error('SMOKE ' + e.stack); } }, 1200);
```

- [x] **3. Maps.** Write `js/world.js`; add its tag. Done when: clean selftest; its `maps:` line reads `town 30x15, house 16x9, forest 32x20, crypt 17x12`.

```js
// js/world.js - map data: east Brindlemere, Thornwood, the Hollow Crypt
const sol = o => ({ g:0, o, solid:1 }), dun = (d, more) => ({ g:109, d, ...more });
Object.assign(TOWN_LEGEND, { a:sol(48), b:sol(49), c:sol(50), d:sol(60), e:sol(61), h:sol(62), k:sol(76), q:sol(89), x:sol(88), z:sol(79),
  O:sol(104), '!':sol(83), A:sol(15) });
const FOREST_LEGEND = { ...TOWN_LEGEND, m:{ g:0, o:29 }, l:sol(106), s:{ g:43 }, n:{ g:1, p:65, solid:1 }, '+':{ g:1, p:64, solid:1 },
  '(':{ g:0, p:76, solid:1 }, '#':{ g:0, p:77, solid:1 }, ')':{ g:0, p:78, solid:1 }, 1:sol(99), 2:sol(100), 3:sol(101), B:{ g:126, solid:1 }, C:{ g:103 } };
const CRYPT_LEGEND = { '#':dun(40, { solid:1 }), b:dun(29, { solid:1 }), g:dun(19, { solid:1 }), '.':dun(0), ',':dun(12), ':':dun(24, { grass:1 }),
  c:dun(0, { p:54, solid:1 }), u:dun(0, { p:56, solid:1 }), E:dun(45) };
const EAST = [ 'TTTTTTTTTTT', '.,.Y..f..YT', '..abbc.,..T', ',.deeh..O.T', '..kqxz.f..T', '.,.p....,.T', 'f..p...<_>T', '...p.....!T',
  'pppppppppppppp', '.,...f...oT', '..t.,..A..T', '.....f....T', ',.A....,.tT', '..,..f....T', 'TTTTTTTTTTT' ];
MAPS.town.rows = MAPS.town.rows.map((r, y) => r.slice(0, 30 - EAST[y].length) + EAST[y]);
MAPS.town.warps.push({ x:29, y:8, to:'forest', tx:1, ty:9, facing:'right' });
MAPS.forest = { name:'forest', scene:'Forest', legend:FOREST_LEGEND, props:[], npcs:[], rows:[
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTYTTTTTYTTTTTYTTTTTTYTTTTTTYTTT',
  'TT.GGGGG.TTTTTTYTTTTTT.,..f...TT',
  'TTGGGGGG..pppppppppppp........TT',
  'TT.GGGGG.TpTTTTTTYTTTT..f...,.TT',
  'TTT.,..TTTpTGGGGGGTTTTT.,..m.TTT',
  'TTTTTTTTTTp.GGGGGGTTTYTTTTTTTTTT',
  'TT..l.TTTTpTGGGGGGTTTTTTTTYTTTTT',
  'TT.,..YTTTpTTTYTTTTTTTTTTTTTTTTT',
  'pppppppppppppppppppppTTTTTTYTTTT',
  'TTTTYTTT.TTTTTTYTTTTpTTTYTTTTTTT',
  'TT.,.f...m..TTA(####s#########)T',
  'TT..,.....f.TTA.n.+.s,.n..123.+T',
  'TT.WWW..GGGGTTA.....s.....BCB..T',
  'TT.WWW.mGGGGTTA.n.+.ssssssss.n.T',
  'TT.WWW..GGGGTTA.,.........f....T',
  'TT...,..GGGGTTA.n.+.n.+.n.+.n.+T',
  'TT.f......,.TTA......,.....f...T',
  'TTTYTTTTTTYTTTAATAAATAATAAATAATT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT' ],
  warps:[ { x:0, y:9, to:'town', tx:28, ty:8, facing:'left' }, { x:27, y:13, to:'crypt', tx:8, ty:10, facing:'up' } ] };
MAPS.crypt = { name:'crypt', scene:'Crypt', legend:CRYPT_LEGEND, dun:1, props:[], npcs:[], rows:[
  '#####gb#b#bg#####',
  '#c.c#...c...#c.c#',
  '#...#.u...u.#...#',
  '#:.:#.......#:.:#',
  '#...#.......#...#',
  '#.:.#.......#.:.#',
  '#...........,...#',
  '#:..#.......#...#',
  '#.c.#..,....#.c.#',
  '#####.......#####',
  '#####.,...,.#####',
  '########E########' ],
  warps:[ { x:8, y:11, to:'forest', tx:27, ty:14, facing:'down' } ] };
hook.maps = Object.values(MAPS).map(m => ({ name:m.name, width:m.rows[0].length, height:m.rows.length }));
for (const m of Object.values(MAPS)) m.rows.forEach((r, y) => { if (r.length !== m.rows[0].length) console.error('bad row', m.name, y);
  for (const c of r) if (!m.legend[c]) console.error('bad symbol', c, m.name, y); });
```

- [x] **4. Scenes.** Write `js/stage.js`; add its tag. Done when: clean selftest.

```js
// js/stage.js - scenes for the new maps, dungeon tiles, things drawn on top
class ForestScene extends MapScene { constructor() { super('Forest', 'forest'); } }
class CryptScene extends MapScene { constructor() { super('Crypt', 'crypt'); } }
const World = { draw() {}, refresh() {}, at: () => null };   // actors.js fills these
const bootCreate = BootScene.prototype.create, mapCreate = MapScene.prototype.create;
BootScene.prototype.create = function () { this.scene.add('Forest', ForestScene); this.scene.add('Crypt', CryptScene); bootCreate.call(this); };
MapScene.prototype.create = function () { mapCreate.call(this);
  const m = MAPS[this.mapName], cells = m.rows.map(r => [...r].map(c => m.legend[c]));
  if (m.dun) { const t = this.make.tilemap({ data:cells.map(r => r.map(c => c.d ?? -1)), tileWidth:16, tileHeight:16 });
    t.createLayer(0, t.addTilesetImage('dun', 'dun', 16, 16, 0, 0), 0, 0).setDepth(1.5); }
  cells.forEach((r, y) => r.forEach((c, x) => { if (c.p) this.add.sprite(x * 16 + 8, y * 16 + 8, 'dun', c.p).setDepth(2); }));
  World.draw(this); };
{ const s = Save.read(); if (s) Object.assign(G, s); }   // a save made in the forest or crypt
```

- [x] **5. People.** Write `js/actors.js`; add its tag. Done when: clean selftest (it talks to all three).

```js
// js/actors.js - people and things you face and press A on
const give = (flag, pages) => { if (!Quest.flag(flag)) return false; Bag.add(DRAUGHT); World.refresh(); say([...pages, `You got a ${DRAUGHT}.`]); return true; };
const ACTORS = [
  { ...SPOT.giver, f: () => 100, talk() { const s = G.quest.stage;
    if (s === 0) { Bag.add(DRAUGHT); Quest.set(1); say(['Elder Maren: The dead do not rest. A bell tolls under Thornwood every night.',
      'Find Brother Tobin at the cemetery, east through the gate. Take this.', `Quest: The Restless Crypt. You got a ${DRAUGHT}.`]); }
    else if (s === 5) { Bag.drop(BELL); Bag.add(CHARM); Quest.set(6); say(["Elder Maren: The Gravecaller's bell! Then it is over. Thank you.",
      `Quest complete! You gain 60 XP and the ${CHARM}.`, ...Rules.grantXp(60)]); }
    else say([s < 5 ? 'Elder Maren: Brother Tobin keeps the cemetery in Thornwood. Go east.' : 'Elder Maren: The nights are quiet again. Rest well.']); } },
  { ...SPOT.helper, f: () => 98, talk() { give('hale', ['Hale: Beasts hide in the tall grass of Thornwood.', 'Take this. Press START in a fight to drink it.']) ||
    say(['Hale: Keep to the path and you keep your boots.']); } },
  { ...SPOT.keeper, f: () => 86, talk() { const s = G.quest.stage;
    if (s === 1) { Quest.set(2); say(['Tobin: Maren sent you? A hooded man, the Gravecaller, went into the crypt.',
      'I locked the gate behind him and hid the key in the chest in the north glade.', 'Go north at the fork and pull the red cord. Then open the gate.']); }
    else say([s < 1 ? 'Tobin: Mind the graves. The elder in town may have work for you.' : s < 4 ? 'Tobin: The chest is in the north glade. The crypt is behind me.'
      : s < 5 ? 'Tobin: He is down there. Strike true.' : 'Tobin: Quiet at last. Bless you.']); } } ];
World.at = (x, y) => ACTORS.find(a => a.map === G.map && a.x === x && a.y === y && a.f() >= 0);
World.draw = sc => { sc.actors = ACTORS.filter(a => a.map === G.map).map(a => [a, sc.add.sprite(a.x * 16 + 8, a.y * 16 + 8, 'dun', 0).setDepth(3)]);
  World.refresh(); };
World.refresh = () => { for (const [a, s] of (G.scene && G.scene.actors) || []) { const f = a.f(); s.setVisible(f >= 0); if (f >= 0) s.setFrame(f); } };
const R2 = { blocked:Ctl.blocked, pressA:Ctl.pressA };
Ctl.blocked = (x, y) => R2.blocked(x, y) || !!World.at(x, y);
Ctl.pressA = () => { const d = DIRS[G.facing], a = !G.dialogueOpen && !inBattle() && !G.menuOpen && G.scene && !G.busy && World.at(G.px + d[0], G.py + d[1]);
  if (a) a.talk(); else R2.pressA(); };
```

- [x] **6. Things.** Write `js/things.js`; add its tag. Done when: clean selftest (it opens the chest and the gate).

```js
// js/things.js - the chest, the crypt gate, the boss, a vial
ACTORS.push(
  { ...SPOT.chest, f: () => G.quest.stage > 2 ? 91 : 89, talk() { const s = G.quest.stage;
    if (s === 2) { Bag.add(KEY); Quest.set(3); say([`You pull the red cord and the chest opens. You got the ${KEY}!`]); }
    else say([s < 2 ? 'A chest tied shut with a knotted red cord. It will not open.' : 'The chest is empty.']); } },
  { ...SPOT.crypt, f: () => G.quest.stage > 3 ? -1 : 77, talk() {
    if (Bag.drop(KEY)) { Quest.set(4); say(['The key turns and the gate swings open. The old key crumbles to rust.']); }
    else say(['An iron gate bars the crypt. It is locked.']); } },
  { ...SPOT.boss, f: () => G.quest.stage > 4 ? -1 : 111, talk() { Battle.start(BOSS); } },
  { ...SPOT.vial, f: () => G.quest.flags.includes('vial') ? -1 : 115, talk() { give('vial', ['A red vial stands among the bones.']); } } );
```

- [x] **7. Foes and the boss.** Write `js/foes.js`; add its tag. Done when: clean selftest (it plays the whole quest).

```js
// js/foes.js - Thornwood and crypt foes, the boss, a potion in battle
const FOES = { forest:[ { name:'Moss Rat', frame:123, hp:5, ac:10, atk:2, die:4, xp:10 }, { name:'Bramble Imp', frame:110, hp:8, ac:12, atk:3, die:6, xp:18 } ],
  crypt:[ { name:'Grave Rat', frame:124, hp:7, ac:11, atk:3, die:4, xp:14 }, { name:'Pale Wisp', frame:121, hp:12, ac:12, atk:3, die:6, xp:22 } ] };
const BOSS = { name:'Gravecaller', frame:111, hp:26, ac:13, atk:4, die:8, xp:60, boss:1 };
const B2 = { start:Battle.start, strike:Battle.strike, attack:Battle.attack, end:Battle.end, grass:Rules.isGrass, pressStart:Ctl.pressStart };
Rules.isGrass = (x, y) => !G.calm && B2.grass(x, y);
Battle.start = foe => { B2.start(); const z = FOES[G.map], m = foe || (z && z[roll(z.length) - 1]); if (!m) return;
  Object.assign(G.battle, { enemy:{ ...m, maxHp:m.hp }, log:[m.boss ? 'The Gravecaller attacks!' : `A ${m.name} creeps out!`] });
  Battle.onChange(); };
Battle.strike = (who, bonus, ac, die, dmgMod) => who !== 'You' ? B2.strike('Foe', bonus, ac, die, dmgMod)
  : B2.strike(who, Math.max(bonus, 0) + 2, ac, die, Math.max(dmgMod, 0));   // +2 = proficiency
Battle.attack = () => { B2.attack(); const r = G.battle.lastRoll; r.mod = r.total - r.value; };
Battle.end = result => { const boss = G.battle.enemy.boss && G.quest.stage === 4; B2.end(result);
  if (result !== 'win') { if (G.map !== 'town') say([result === 'lose' ? 'You fall... and wake where you stood. HP restored.' : 'You get away.']); }
  else if (boss) { Bag.add(BELL); Quest.set(5); say([...uiScene().pages, `The bell falls silent. You got the ${BELL}.`]); } };
Ctl.pressStart = () => { if (inBattle()) Bag.use(DRAUGHT); else B2.pressStart(); };
```

- [x] **8. Menu pages, HP line.** Write `js/pack.js`; add its tag. Done when: clean selftest; the screenshot shows an `HP` line above `ITEMS`.

```js
// js/pack.js - Start menu: Quest page, bag on the Items page (A drinks a draught); HP line
MENU_OPTS.splice(2, 0, 'Quest');
const menuText = Menu.text, menuSelect = Menu.select;
Menu.text = () => { const o = MENU_OPTS[Menu.i], s = G.quest.stage;
  if (o === 'Quest') return `QUEST\nThe Restless Crypt\n${s < 6 ? `Step ${s + 1} of 6` : 'Complete'}\n\n${GOALS[s]}`;
  if (o !== 'Items') return menuText();
  return menuText() + '\nBAG\n' + ([...new Set(G.bag)].map(n => n + (count(n) > 1 ? ' x' + count(n) : '')).join('\n') || '(empty)') +
    (count(DRAUGHT) ? '\nA: drink draught' : ''); };
Menu.move = dir => { const now = Date.now(), dy = DIRS[dir][1], n = MENU_OPTS.length; if (!dy || now - Menu.last < 170) return;
  Menu.last = now; Menu.i = (Menu.i + dy + n) % n; Menu.draw(); };
Menu.select = () => { const o = MENU_OPTS[Menu.i];
  if (o === 'Items') { if (!Bag.use(DRAUGHT)) say([count(DRAUGHT) ? 'HP is already full.' : `No ${DRAUGHT} in the bag.`]); Menu.draw(); }
  else if (o !== 'Party' && o !== 'Quest') menuSelect(); };
UI_BUILD.push(ui => { panel(Menu.box.list[0], 172, 4, 80, 98); const hp = txt(ui, 128, 154, '', '#f8f8e8').setOrigin(0.5);
  ui.events.on('update', () => { const h = G.hero; hp.setText(inBattle() ? `START: Heal x${count(DRAUGHT)}` : `HP ${h.hp}/${h.maxHp}`); }); });
```

- [x] **9. Clean up.** Delete `js/smoke.js` and remove its tag from `index.html`. Done when: clean selftest and `ls js` shows no smoke.js. Tick every box and stop.

## If something fails

- `X is not defined`: that file's tag is missing or out of order, or a name was changed. Names used from rounds 1-2: `G Ctl MAPS DIRS FONT TOWN_LEGEND BootScene MapScene UIScene uiScene Rules Battle Menu MENU_OPTS Save UI_BUILD hook txt panel roll mod inBattle`. If your build names one differently, adapt the NEW file.
- `no path to X`: a row in `js/world.js` differs from this plan. `quest stopped at stage N`: compare the newest file with this plan.
- The player does not move: a dialogue, the menu or a battle stayed open, or an exception left `G.busy` true.
