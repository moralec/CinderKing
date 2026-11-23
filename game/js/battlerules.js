// js/battlerules.js - battle: what a turn costs

Battle.rule = key => (DB.world.meta.rules || {})[key];
Battle.lines.boss_flee = ['There is no running from this fight!'];
Battle.lines.flee_fail = ['{hero} cannot get away!'];

wrap(Battle, 'flee', old => () => {
  const b = G.battle, e = b.enemy, chance = Battle.rule('flee');
  if (e.boss && Battle.rule('boss_flee') === false) { b.log.push(Battle.tell('boss_flee')); return Battle.foeTurn(); }
  if (chance != null && Math.random() >= chance) { b.log.push(Battle.tell('flee_fail')); return Battle.foeTurn(); }
  return old();
});

wrap(BattleItems, 'drink', old => name => {
  const ok = old(name);
  if (ok && inBattle() && Battle.rule('drink_turn')) Battle.foeTurn();
  return ok;
});
