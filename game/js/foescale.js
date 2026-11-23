// js/foescale.js — a quest foe may have numbers of its own: the `foe` field of its defeat step
wrap(Battle, 'start', old => (who, more) => {
  const ok = old(who, more);
  if (ok !== true) return ok;
  const e = G.battle.enemy;
  let step = null;
  for (const q of DB.world.quests.main) {
    for (const s of q.steps) {
      if (s.type === 'defeat' && s.monster === e.id && s.as === e.name) { step = s; break; }
    }
    if (step) break;
  }
  if (!step) { for (const q of DB.world.quests.side) { for (const s of q.steps) { if (s.type === 'defeat' && s.monster === e.id && s.as === e.name) { step = s; break; } } if (step) break; } }
  if (!step) return ok;
  let f = step.foe || {};
  if (f.if_weapon && G.hero.equipment.weapon !== f.if_weapon) { f = {}; }
  if (f.hp != null)     { e.hp = f.hp; e.maxHp = f.hp; }
  if (f.ac != null)     { e.ac = f.ac; }
  if (f.bonus != null)  { e.attack.bonus = f.bonus; }
  if (f.damage != null) { e.attack.damage = f.damage; }
  if (f.xp != null)     { e.xp = f.xp; }
  if (step.short)       { e.short = step.short; }
  Battle.onChange();
  return ok;
});
