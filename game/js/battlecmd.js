// js/battlecmd.js - the command menu of a battle: Attack, Item, Run with cursor

Battle.cmds = [
  () => Battle.attack(),
  () => { G.battle.log.push('The bag stays shut.'); Battle.onChange(); },
  () => Battle.flee()
];

Modes.add({ name: 'battle', z: 60,
  on: () => inBattle(),
  dir(d) {
    const dy = DIRS[d][1];
    if (!dy) return;
    const b = G.battle;
    b.cmd = ((b.cmd || 0) + dy + 3) % 3;
    Battle.onChange();
  },
  a() {
    const b = G.battle;
    const k = b.cmd || 0;
    b.cmd = 0;
    Battle.cmds[k]();
  }
});
