// js/lists.js — expose bestiary, catalog, credits on the hook (SETUP)

(function () {
  SETUP.push(function lists() {
    // bestiary: one entry per monster, attack = attacks[0]
    hook.bestiary = DB.monsters.map(function (m) {
      return {
        id: m.id,
        name: m.name,
        cr: m.cr,
        xp: m.xp,
        ac: m.ac,
        hp: m.hp,
        attack: { bonus: m.attacks[0].bonus, damage: m.attacks[0].damage }
      };
    });

    // catalog: one entry per item
    var base = function (it) { return DB.item[it.base] || {}; };
    hook.catalog = DB.items.map(function (it) {
      var b = base(it);
      var dmg = it.damage != null ? it.damage : (b.damage != null ? b.damage : undefined);
      var ac;
      if (it.ac != null) {
        ac = it.ac.base;
      } else if (b.ac != null) {
        ac = b.ac.base;
      } else {
        ac = undefined;
      }
      return {
        id: it.id,
        name: it.name,
        kind: it.kind,
        cost: it.cost_gp,
        damage: dmg,
        ac: ac
      };
    });

    // credits: title, story sentences, full attribution text
    hook.credits = DB.world.meta.title + '\n' +
      DB.world.meta.story.join('\n') + '\n' +
      DB.credit;
  });
})();
