// js/tints.js - chunk 33: tint people, quest things, and foes
(function() {
  const colour = text => parseInt(text.slice(1), 16);
  // Build a map from (map,x,y) to quest step sprite string for quest things
  const _questSprite = {};
  function buildQuestSpriteMap() {
    try {
      const quests = DB && DB.world && DB.world.quests;
      const atMap = Tales && Tales.at;
      if (!quests || !atMap) return;
      for (const kind of ['main', 'side']) {
        for (const q of quests[kind]) {
          const stepAts = atMap[q.id];
          if (!stepAts) continue;
          for (let k = 0; k < q.steps.length; k++) {
            const s = q.steps[k];
            const at = stepAts[k];
            if (at && s.sprite) {
              const key = at.map + ',' + at.x + ',' + at.y;
              if (!_questSprite[key]) _questSprite[key] = s.sprite;
            }
          }
        }
      }
    } catch(e) {}
  }
  wrap(World, 'refresh', old => () => {
    old();
    buildQuestSpriteMap();
    for (const [a, sprite] of (G.scene && G.scene.actors) || []) {
      if (a.sheet === 'town' && a.f() >= 0) {
        sprite.setTexture('town', a.f());
      }
      if (a.tint) {
        sprite.setTint(colour(a.tint));
      }
      // Quest things with a sprite need correct frame from sprite def
      if (a.sheet && a.f() >= 0) {
        const key = a.map + ',' + a.x + ',' + a.y;
        const sp = _questSprite[key];
        if (sp && sp[0] === 't') {
          sprite.setTexture('town', +sp.slice(2));
        } else if (sp && sp[0] === 'd') {
          sprite.setTexture('dun', +sp.slice(2));
        }
      }
    }
  });
  wrap(Battle, 'onChange', old => () => {
    old();
    if (BattleView.foe) {
      const tint = G.battle && G.battle.enemy && G.battle.enemy.tint;
      if (tint) {
        BattleView.foe.setTint(colour(tint));
      } else {
        BattleView.foe.clearTint();
      }
    }
  });
})();
