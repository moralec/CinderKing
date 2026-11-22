// js/potion.js - potions of the data heal and are used up

wrap(Bag, 'use', old => name => {
  const entry = DB.named[name];
  if (!entry || !entry.effect || !entry.effect.heal) return old(name);
  const h = G.hero;
  if (h.hp >= h.maxHp) return false;
  if (!Bag.drop(name)) return false;
  const r = rollDice(entry.effect.heal);
  h.hp = Math.min(h.maxHp, h.hp + r);
  const line = name + ': ' + entry.effect.heal + ' = ' + r + '. HP ' + h.hp + '/' + h.maxHp + '.';
  if (inBattle()) {
    G.battle.log.push(line);
    Battle.onChange();
  } else {
    say([line]);
  }
  return true;
});
