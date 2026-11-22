// zonescene.js — chunk 13: one scene class draws every generated zone

class ZoneScene extends MapScene {
  constructor() { super('Zone', null); }
  init() { this.mapName = G.map; }
}

wrap(BootScene.prototype, 'create', old => function () {
  this.scene.add('Zone', ZoneScene);
  old.call(this);
});

DRAWN.push(function tops(scene, m) {
  m.rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      const t = m.legend[c].top;
      if (t) {
        const key = t.startsWith('d:') ? 'dun' : 'town';
        const n = +t.slice(2);
        scene.add.sprite(x * 16 + 8, y * 16 + 8, key, n).setDepth(2);
      }
    });
  });
});
