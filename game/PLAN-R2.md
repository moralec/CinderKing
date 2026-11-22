# PLAN: Brindlemere, round 2 (the D&D layer)

Follow this literally, top to bottom. Do not redesign. Round 2 is ADDED to your round 1 game in new small files.

- **Never edit `js/ui.js`, `js/state.js`, `js/scenes.js`, `js/main.js`** (no need to read them): the D-pad, A/B, movement and dialogue stay untouched. You only create files in `js/`, add script tags to `index.html` and make three exact edits in `js/data.js` (step 4).
- Every file is small: **write it in one go, exactly as given** (copy, do not improve).
- Tags: `<script src="js/NAME.js"></script>`. Final order: main, rules, menu, battle, save, battleview, smoke.
- **Clean selftest** = `timeout 120 python3 selftest.py` prints `errors: none`, `every field named in BRIEF.md is present`, and `move('right', 1)` goes from (9,8) to (10,8). Run it after every step, fix every error (`SMOKE` = the newest file is broken), tick the box, go on.

- [x] **1. Rules and hook.** Write `js/rules.js`; tag after `js/main.js`. Done when: clean selftest.

```js
// js/rules.js - dice, hero, foes, XP, input routing, hook fields
const roll = n => 1 + Math.floor(Math.random() * n);
const mod = s => Math.floor((s - 10) / 2);
const MONSTERS = [ { name:'Bog Slime', frame:108, hp:6, ac:9, atk:1, die:4, xp:10 },
  { name:'Dusk Flitter', frame:120, hp:4, ac:12, atk:2, die:4, xp:12 },
  { name:'Reed Skitter', frame:122, hp:7, ac:11, atk:2, die:6, xp:15 } ];
const MENU_OPTS = ['Party', 'Items', 'Save', 'Load', 'Close'];
BTN.start = { x:128, y:183 };
Object.assign(G, { menuOpen:false, battle:null, hero:{ name:'Rowan', cls:'Ranger', level:1, hp:12, maxHp:12, xp:0,
  stats:{ str:12, dex:16, con:14, int:10, wis:13, cha:8 } } });
const inBattle = () => !!(G.battle && G.battle.active);
const Rules = {
  ac: h => 11 + mod(h.stats.dex),
  xpNext: h => 15 * h.level * (h.level + 1),
  isGrass(x, y) { const m = MAPS[G.map], r = m.rows[y], c = r && m.legend[r[x]]; return !!(c && c.grass); },
  grantXp(n) { const h = G.hero, out = []; h.xp += n;
    while (h.xp >= Rules.xpNext(h)) { h.level++; h.maxHp += 8; h.hp = h.maxHp;
      out.push(`Level up! ${h.name} is now level ${h.level}. Max HP ${h.maxHp}.`); }
    return out; } };
// battle and menu take the buttons first; R1 = round 1 behaviour
const R1 = { step:Ctl.step, arrive:Ctl.arrive, pressA:Ctl.pressA, pressB:Ctl.pressB };
Ctl.step = dir => { if (inBattle()) return Promise.resolve(false);
  if (G.menuOpen) { Menu.move(dir); return Promise.resolve(false); }
  return R1.step(dir); };
Ctl.arrive = res => { R1.arrive(res);
  if (G.scene && !G.busy && Rules.isGrass(G.px, G.py) && Math.random() < 0.2) Battle.start(); };
Ctl.pressA = () => { if (G.dialogueOpen) R1.pressA(); else if (inBattle()) Battle.attack();
  else if (G.menuOpen) Menu.select(); else R1.pressA(); };
Ctl.pressB = () => { if (G.dialogueOpen) R1.pressB(); else if (inBattle()) Battle.flee();
  else if (G.menuOpen) Menu.close(); else R1.pressB(); };
Ctl.pressStart = () => { if (G.dialogueOpen || inBattle() || G.busy) return; if (G.menuOpen) Menu.close(); else Menu.open(); };
const UI_BUILD = [], uiCreate = UIScene.prototype.create;
UIScene.prototype.create = function () { uiCreate.call(this); UI_BUILD.forEach(f => f(this)); };
const txt = (ui, x, y, s, color = '#203020') => ui.add.text(x, y, s, { ...FONT, color, lineSpacing:4 });
const panel = (g, x, y, w, h) => g.fillStyle(0xf8f8e8).fillRoundedRect(x, y, w, h, 3).lineStyle(2, 0x203020).strokeRoundedRect(x, y, w, h, 3);
const hook = window.__game;
Object.defineProperties(hook, {
  party: { get: () => [G.hero] },
  battle: { get: () => G.battle },
  menuOpen: { get: () => G.menuOpen },
  ui: { get: () => { const o = {}; for (const k in BTN) o[k] = page(BTN[k]); return o; } } });
hook.menuOptions = MENU_OPTS;
hook.landmarks.grass = { map:'town', x:15, y:2 };
Object.assign(hook.actions, { pressStart: () => Ctl.pressStart(), save: () => Save.save(), load: () => Save.load(),
  grantXp: n => { const m = Rules.grantXp(n); if (m.length) uiScene().showDialogue(m); } });
```

- [x] **2. Self-check.** Write `js/smoke.js`; tag last. It exercises what exists at each selftest. **Later tags go just before the smoke tag.** Done when: clean selftest.

```js
// js/smoke.js - temporary self-check, deleted in step 8
setTimeout(() => { const g = window.__game, a = g.actions;
  try {
    if (typeof Menu !== 'undefined') { a.pressStart(); Menu.move('down'); a.pressB(); }
    if (typeof Save !== 'undefined') { a.save(); a.load(); }
    if (typeof Battle !== 'undefined') { if (!Rules.isGrass(15, 2)) throw new Error('no grass at 15,2');
      Battle.start(); for (let i = 0; i < 60 && g.battle.active; i++) a.pressA(); }
    a.grantXp(200); for (let i = 0; i < 9 && g.dialogueOpen; i++) a.pressA();
    if (g.menuOpen || g.dialogueOpen || inBattle() || g.party[0].level < 2) throw new Error('menu, battle or box stuck');
  } catch (e) { console.error('SMOKE ' + e.stack); } }, 1200);
```

- [x] **3. Start menu.** Write `js/menu.js`; add its tag. Done when: clean selftest (it opens the menu).

```js
// js/menu.js - START button, Enter key, Start menu
const Menu = { i:0, last:0,
  build(ui) { const { x, y } = BTN.start, g = ui.add.graphics();
    ui.add.rectangle(x, y, 46, 11, 0x587058).setStrokeStyle(1, 0xf8f8e8).setInteractive().on('pointerdown', () => Ctl.pressStart());
    txt(ui, x, y, 'START', '#f8f8e8').setOrigin(0.5);
    ui.input.keyboard.on('keydown-ENTER', e => { if (!e.repeat) Ctl.pressStart(); });
    panel(g, 4, 4, 164, 136); panel(g, 172, 4, 80, 80);
    Menu.body = txt(ui, 12, 12, ''); Menu.opts = txt(ui, 180, 12, '').setLineSpacing(6);
    Menu.face = ui.add.sprite(140, 28, 'dun', 88).setScale(2);
    Menu.box = ui.add.container(0, 0, [g, Menu.body, Menu.opts, Menu.face]).setDepth(8).setVisible(false); },
  text() { const h = G.hero, s = h.stats, o = MENU_OPTS[Menu.i], inv = G.inventory;
    if (o === 'Party') return `${h.name}\n${h.cls} Lv ${h.level}\nHP ${h.hp}/${h.maxHp}\nAC ${Rules.ac(h)}  XP ${h.xp}/${Rules.xpNext(h)}\n\n` +
      `STR ${s.str}  INT ${s.int}\nDEX ${s.dex}  WIS ${s.wis}\nCON ${s.con}  CHA ${s.cha}`;
    if (o === 'Items') return `ITEMS ${inv.length}/${ITEMS.length}\n\n` + (inv.join('\n') || '(nothing yet)');
    return o === 'Close' ? 'Back to\nBrindlemere.' : o + ' your\nadventure.'; },
  draw() { Menu.box.setVisible(G.menuOpen); if (!G.menuOpen) return;
    Menu.opts.setText(MENU_OPTS.map((o, k) => (k === Menu.i ? '>' : ' ') + o).join('\n'));
    Menu.body.setText(Menu.text()); Menu.face.setVisible(Menu.i === 0); },
  open() { G.menuOpen = true; Menu.i = 0; Menu.draw(); },
  close() { G.menuOpen = false; Menu.draw(); },
  move(dir) { const now = Date.now(), dy = DIRS[dir][1]; if (!dy || now - Menu.last < 170) return;
    Menu.last = now; Menu.i = (Menu.i + dy + 5) % 5; Menu.draw(); },
  select() { const o = MENU_OPTS[Menu.i]; if (Menu.i < 2) return;
    Menu.close();
    if (o === 'Save') uiScene().showDialogue([Save.save() ? 'Game saved.' : 'Save failed.']);
    if (o === 'Load') uiScene().showDialogue([Save.load() ? 'Game loaded.' : 'No save found.']); } };
UI_BUILD.push(ui => Menu.build(ui));
```

- [x] **4. Tall grass.** Three exact edits in `js/data.js`, nothing else. Done when: clean selftest (`bad row` / `bad symbol` = a typo here).
  - in `TOWN_LEGEND`, after `'p':{g:25},` add `'G':{g:134,grass:1},`
  - row y=1: `'T..,....Y...,.....fT'` becomes `'T..,....Y...GGGGGG.T'`
  - row y=2: `'T..[==].....f.,..f.T'` becomes `'T..[==].....GGGGGG.T'`

- [x] **5. Battle rules.** Write `js/battle.js`; add its tag. Done when: clean selftest (it fights a battle).

```js
// js/battle.js - battle rules (screen: js/battleview.js)
const Battle = {
  onChange() {},   // battleview.js replaces this
  start() { const m = MONSTERS[roll(MONSTERS.length) - 1];
    G.battle = { active:true, enemy:{ ...m, maxHp:m.hp }, log:[`A wild ${m.name} appears!`], lastRoll:null, lastDmg:null, result:null };
    Battle.onChange(); },
  strike(who, bonus, ac, die, dmgMod) { const v = roll(20), total = v + bonus, hit = v === 20 || (v > 1 && total >= ac);
    let line = `${who} d20 ${v}+${bonus}=${total} ${hit ? 'HIT' : 'MISS'}`, dmg = 0, r = 0;
    if (hit) { r = roll(die); dmg = r + dmgMod; line += ` d${die} ${r}+${dmgMod}=${dmg}`; }
    G.battle.log.push(line);
    return { value:v, total, hit, dmg, r }; },
  attack() { const b = G.battle, h = G.hero, e = b.enemy, m = mod(h.stats.dex);
    const p = Battle.strike('You', m, e.ac, 8, m);
    b.lastRoll = { die:20, value:p.value, mod:m, total:p.total }; b.lastDmg = p.hit ? p.r : null;
    e.hp = Math.max(0, e.hp - p.dmg);
    if (e.hp <= 0) return Battle.end('win');
    h.hp = Math.max(0, h.hp - Battle.strike('Foe', e.atk, Rules.ac(h), e.die, 0).dmg);
    if (h.hp <= 0) return Battle.end('lose');
    Battle.onChange(); },
  flee() { Battle.end('fled'); },
  end(result) { const b = G.battle, h = G.hero, e = b.enemy; let msgs;
    if (result === 'win') msgs = [`${e.name} is defeated! You gain ${e.xp} XP.`, ...Rules.grantXp(e.xp)];
    else if (result === 'lose') { h.hp = h.maxHp; msgs = ['You fall... Orwyn carries you out of the grass. HP restored.']; }
    else msgs = ['You slip away through the tall grass.'];
    b.log.push(...msgs); b.result = result; b.active = false;
    Battle.onChange(); uiScene().showDialogue(msgs); } };
```

- [x] **6. Save and load.** Write `js/save.js`; add its tag. Done when: clean selftest.

```js
// js/save.js - localStorage; a save is applied when the page opens
const Save = {
  save() { localStorage.setItem('brindlemere', JSON.stringify({ map:G.map, px:G.px, py:G.py, facing:G.facing,
      inventory:G.inventory, hero:G.hero, fishCount:G.fishCount })); return true; },
  read() { const s = JSON.parse(localStorage.getItem('brindlemere') || 'null'); return s && MAPS[s.map] && s.hero ? s : null; },
  load() { const s = Save.read(); if (!s || !G.scene || G.busy) return false;
    if (G.dialogueOpen) uiScene().closeDialogue();
    Object.assign(G, s); G.battle = null; Battle.onChange();
    const sc = G.scene; G.busy = true; G.scene = null; sc.scene.start(MAPS[G.map].scene);
    uiScene().refreshCounter(); return true; } };
{ const s = Save.read(); if (s) Object.assign(G, s); }
```

- [x] **7. Battle screen.** Write `js/battleview.js`; add its tag. Done when: clean selftest.

```js
// js/battleview.js - battle screen in the 256x144 view
const BattleView = {
  build(ui) { const V = BattleView, g = ui.add.graphics(), C = (x, y, s) => txt(ui, x, y, s).setOrigin(0.5);
    g.fillStyle(0xb8d890).fillRect(0, 0, 256, 144).fillStyle(0x587058).fillEllipse(204, 46, 60, 8).fillEllipse(28, 80, 40, 8);
    panel(g, 4, 4, 124, 38); panel(g, 128, 50, 124, 36); panel(g, 4, 88, 248, 52); panel(g, 60, 44, 22, 22); panel(g, 92, 44, 22, 22);
    V.bars = ui.add.graphics();
    V.foe = ui.add.sprite(204, 26, 'dun', 108).setScale(3); V.me = ui.add.sprite(28, 62, 'dun', 88).setScale(2);
    V.foeTxt = txt(ui, 10, 9, ''); V.meTxt = txt(ui, 134, 54, ''); V.log = txt(ui, 10, 93, '');
    V.d20 = C(71, 56, '?'); V.dmg = C(103, 56, '-');
    const hint = txt(ui, 246, 129, 'A Attack  B Run', '#587058').setOrigin(1, 0);
    V.box = ui.add.container(0, 0, [g, V.bars, V.foe, V.me, V.foeTxt, V.meTxt, V.log, V.d20, V.dmg, C(71, 74, 'd20'), C(103, 74, 'd8'), hint])
      .setDepth(7).setVisible(false); },
  refresh() { const V = BattleView, b = G.battle, on = inBattle(); V.box.setVisible(on); if (!on) return;
    const e = b.enemy, h = G.hero;
    V.foe.setFrame(e.frame);
    V.foeTxt.setText(`${e.name}\nHP ${e.hp}/${e.maxHp} AC ${e.ac}`);
    V.meTxt.setText(`${h.name} Lv ${h.level}\nHP ${h.hp}/${h.maxHp} AC ${Rules.ac(h)}`);
    V.d20.setText(b.lastRoll ? b.lastRoll.value : '?'); V.dmg.setText(b.lastDmg || '-');
    V.log.setText(b.log.slice(-3).join('\n'));
    V.bars.clear().fillStyle(0x203020).fillRect(10, 34, 112, 4).fillRect(134, 79, 112, 4)
      .fillStyle(0x58a048).fillRect(10, 34, 112 * e.hp / e.maxHp, 4).fillRect(134, 79, 112 * h.hp / h.maxHp, 4); } };
UI_BUILD.push(ui => BattleView.build(ui));
Battle.onChange = () => BattleView.refresh();
```

- [x] **8. Clean up.** Delete `js/smoke.js` and remove its tag from `index.html`. Done when: clean selftest and `ls js` shows no smoke.js. Tick every box and stop.

## If something fails

- `X is not defined`: that file's tag is missing or out of order, or a name was changed. Round 1 names used: `G Ctl MAPS ITEMS BTN FONT DIRS UIScene uiScene page`.
- The player does not move: `dialogueOpen`, `menuOpen` or `battle.active` stayed true, or an exception left `G.busy` true.
- `battle` must stay an object after a fight (`active:false`, `result` set); grass steps and pickups open no message box.
