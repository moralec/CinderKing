// js/rules.js - dice, hero, foes, XP, input routing, hook fields
const roll = n => 1 + Math.floor(Math.random() * n);
const mod = s => Math.floor((s - 10) / 2);
const rollStat = () => { let s = 0, lo = 7; for (let i = 0; i < 4; i++) { const v = roll(6); s += v; if (v < lo) lo = v; } return s - lo; };
const CLASS_HD = { Fighter:8, Ranger:8, Cleric:8, Wizard:6 };
const MONSTERS = [ { name:'Bog Slime', frame:108, hp:6, ac:9, atk:1, die:4, xp:10 },
  { name:'Dusk Flitter', frame:120, hp:4, ac:12, atk:2, die:4, xp:12 },
  { name:'Reed Skitter', frame:122, hp:7, ac:11, atk:2, die:6, xp:15 } ];
const MENU_OPTS = ['Party', 'Items', 'Save', 'Load', 'Close'];
BTN.start = { x:128, y:183 };
function makeHero() {
  const s = { str:rollStat(), dex:rollStat(), con:rollStat(), int:rollStat(), wis:rollStat(), cha:rollStat() };
  const hd = CLASS_HD['Ranger'] || 8;
  return { name:'Rowan', cls:'Ranger', level:1, hp:hd + mod(s.con), maxHp:hd + mod(s.con), xp:0, stats:s };
}
Object.assign(G, { menuOpen:false, battle:null, hero: makeHero() });
const inBattle = () => !!(G.battle && G.battle.active);
const Rules = {
  ac: h => 11 + mod(h.stats.dex),
  xpNext: h => 15 * h.level * (h.level + 1),
  isGrass(x, y) { const m = MAPS[G.map], r = m.rows[y], c = r && m.legend[r[x]]; return !!(c && c.grass); },
  grantXp(n) { const h = G.hero, out = []; h.xp += n;
    const hd = CLASS_HD[h.cls] || 8;
    while (h.xp >= Rules.xpNext(h)) { h.level++; const gain = hd + mod(h.stats.con); h.maxHp += Math.max(1, gain); h.hp = h.maxHp;
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
Object.assign(hook.actions, { pressStart: () => Ctl.pressStart(), save: () => Save.doSave(), load: () => Save.doLoad(),
  grantXp: n => { const m = Rules.grantXp(n); if (m.length) uiScene().showDialogue(m); } });
