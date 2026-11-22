// js/fightaids.js — test aids: forceBattle, winBattle, onWin hook

wrap(Battle, 'end', old => result => {
  const e = G.battle && G.battle.enemy;
  const ret = old(result);
  if (result === 'win' && e && e.onWin) e.onWin();
  return ret;
});

Object.assign(hook.actions, {
  forceBattle(id) {
    if (G.dialogueOpen || inBattle() || G.menuOpen || (G.shop && G.shop.open)) return false;
    return Battle.start(id) === true;
  },
  winBattle() {
    if (!G.battle || !G.battle.active) return false;
    G.battle.enemy.hp = 0;
    Battle.end('win');
    return true;
  }
});
