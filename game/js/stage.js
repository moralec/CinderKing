// js/stage.js - scenes for the new maps, dungeon tiles, things drawn on top
class ForestScene extends MapScene { constructor() { super('Forest', 'forest'); } }
class CryptScene extends MapScene { constructor() { super('Crypt', 'crypt'); } }
const World = { draw() {}, refresh() {}, at: () => null };   // actors.js fills these
const bootCreate = BootScene.prototype.create, mapCreate = MapScene.prototype.create;
BootScene.prototype.create = function () { this.scene.add('Forest', ForestScene); this.scene.add('Crypt', CryptScene); bootCreate.call(this); };
MapScene.prototype.create = function () { mapCreate.call(this);
  const m = MAPS[this.mapName], cells = m.rows.map(r => [...r].map(c => m.legend[c]));
  if (m.dun) { const t = this.make.tilemap({ data:cells.map(r => r.map(c => c.d ?? -1)), tileWidth:16, tileHeight:16 });
    t.createLayer(0, t.addTilesetImage('dun', 'dun', 16, 16, 0, 0), 0, 0).setDepth(1.5); }
  cells.forEach((r, y) => r.forEach((c, x) => { if (c.p) this.add.sprite(x * 16 + 8, y * 16 + 8, 'dun', c.p).setDepth(2); }));
  World.draw(this); };

