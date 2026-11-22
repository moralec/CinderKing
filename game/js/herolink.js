// js/herolink.js - the old rules follow the new numbers (armour class, SRD levels)

SETUP.push(function herolink() {
  Rules.ac = who => who.ac;
  Rules.xpNext = who => DB.rules.level_xp[who.level] ?? Infinity;
  wrap(Rules, 'grantXp', old => n => {
    const out = old(n);
    Hero.refresh();
    return out;
  });
});
