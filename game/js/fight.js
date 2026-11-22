// js/fight.js — every battle fields a monster of the data

const Fight = {
  list() {
    const z = zoneOf(G.map);
    if (z) return z.encounters;
    const site = DB.world.sites.find(s => s.id === G.map);
    if (site) return site.encounters;
    return [];
  },
  enemy(monster, more) {
    return {
      id: monster.id,
      name: monster.name,
      type: monster.type,
      hp: monster.hp,
      maxHp: monster.hp,
      ac: monster.ac,
      xp: monster.xp,
      frame: monster.sprite.frame,
      tint: monster.sprite.tint,
      attack: { bonus: monster.attacks[0].bonus, damage: monster.attacks[0].damage },
      ...more
    };
  }
};

wrap(Battle, 'start', old => (who, more) => {
  const boss = who && (who.boss || who === true);
  const step = boss ? DB.world.quests.main[0].steps.find(s => s.type === 'defeat') : null;
  const list = Fight.list();

  let monsterId;
  if (boss) {
    monsterId = step.monster;
  } else if (who && typeof who === 'string') {
    monsterId = who;
  } else {
    monsterId = list[roll(list.length) - 1];
  }

  const monster = DB.mon[monsterId];
  if (!monster) return false;

  old(boss ? who : undefined);

  const enemy = Fight.enemy(monster, boss ? { name: step.as, boss: 1 } : more);
  Object.assign(G.battle, { enemy, enemyRoll: null, lastRoll: null, log: [enemy.name + ' attacks!'] });
  Battle.onChange();
  return true;
});

__game.actions.startBattle = (boss) => Battle.start(boss);
