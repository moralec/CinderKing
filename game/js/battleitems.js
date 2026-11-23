// js/battleitems.js - battle: the list of drinks in a fight

const BattleItems = {
  open: false,
  i: 0,
  rows() {
    const result = [];
    for (const name of G.bag) {
      if (name === DRAUGHT || (DB.named[name] && DB.named[name].effect && DB.named[name].effect.heal)) {
        const existing = result.find(r => r.name === name);
        if (existing) existing.n++;
        else result.push({ name, n: 1 });
      }
    }
    return result;
  },
  drink(name) {
    return Bag.use(name);
  },
  close() {
    BattleItems.open = false;
    Battle.onChange();
  }
};

// Item command
Battle.cmds[1] = () => {
  if (BattleItems.rows().length === 0) {
    G.battle.log.push('Nothing to drink in the bag.');
    Battle.onChange();
    return;
  }
  BattleItems.open = true;
  BattleItems.i = 0;
  Battle.onChange();
};

// Wrap BattleView.rows to show the list when open
wrap(BattleView, 'rows', old => () => {
  if (!BattleItems.open) return old();
  const rows = BattleItems.rows();
  const i = BattleItems.i;
  const first = Math.max(0, Math.min(i - 1, rows.length - 4));
  return rows.slice(first, first + 4).map((row, k) => (k === i - first ? '>' : ' ') + row.name.slice(0, 22) + ' x' + row.n);
});

// Wrap BattleView.refresh to hide command list when open
wrap(BattleView, 'refresh', old => () => {
  old();
  if (G.battle) BattleView.cmd.setVisible(!BattleItems.open);
});

// Add the battle-items mode
Modes.add({
  name: 'battle-items',
  z: 61,
  on: () => inBattle() && BattleItems.open,
  dir(d) {
    const rows = BattleItems.rows();
    if (rows.length === 0) return;
    if (d < 0) BattleItems.i = (BattleItems.i - 1 + rows.length) % rows.length;
    else BattleItems.i = (BattleItems.i + 1) % rows.length;
    Battle.onChange();
  },
  a() {
    const rows = BattleItems.rows();
    BattleItems.open = false;
    const row = rows[BattleItems.i];
    if (row && !BattleItems.drink(row.name)) G.battle.log.push('Your HP is full.');
    if (inBattle()) Battle.onChange();
  },
  b() {
    BattleItems.close();
  }
});

// Wrap Battle.start to close the list when a new battle starts
wrap(Battle, 'start', old => (who, more) => {
  BattleItems.open = false;
  return old(who, more);
});
