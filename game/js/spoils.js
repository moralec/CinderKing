// js/spoils.js - won fights pay gold: enemy XP times meta.rules.gold

wrap(Battle, 'end', old => result => {
  let b = G.battle, rate = Battle.rule('gold'), gold = 0;
  if (result === 'win' && rate) { gold = Math.max(1, Math.round(b.enemy.xp * rate)); G.gold += gold; }
  const r = old(result);
  if (gold) {
    const line = 'You find ' + gold + ' gp.';
    b.log.push(line);
    const pages = uiScene().pages.slice();
    pages.splice(1, 0, line);
    say(pages);
  }
  return r;
});
