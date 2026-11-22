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
  use(name) { const h = G.hero; if (name !== DRAUGHT) return false;
    if (h.hp >= h.maxHp) { if (inBattle()) G.battle.log.push('HP is full.'); return false; }
    if (!Bag.drop(name)) return false;
    const r = roll(4) + roll(4) + 2; h.hp = Math.min(h.maxHp, h.hp + r);
    if (inBattle()) { G.battle.log.push(`Draught 2d4+2=${r} HP ${h.hp}/${h.maxHp}`); Battle.onChange(); }
    else { G.lastMessage = `You drink a ${DRAUGHT}: 2d4+2 = ${r}. HP ${h.hp}/${h.maxHp}.`; }
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
