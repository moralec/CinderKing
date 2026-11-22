// scenes.js — BootScene, MapScene, TownScene, HouseScene

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.load.spritesheet('town', 'assets/town.png',    { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('dun',  'assets/dungeon.png', { frameWidth: 16, frameHeight: 16 });
  }
  create() {
    this.scene.launch('UI');
    this.scene.start(MAPS[G.map].scene);
  }
}

class MapScene extends Phaser.Scene {
  constructor(key, mapName) { super(key); this.mapName = mapName; }

  create() {
    const m = MAPS[this.mapName];
    const ground = m.rows.map(r => [...r].map(c => m.legend[c].g));
    const objs   = m.rows.map(r => [...r].map(c => m.legend[c].o ?? -1));

    const map1 = this.make.tilemap({ data: ground, tileWidth: 16, tileHeight: 16 });
    this.ground = map1.createLayer(0, map1.addTilesetImage('town', 'town', 16, 16, 0, 0), 0, 0).setDepth(0);

    const map2 = this.make.tilemap({ data: objs, tileWidth: 16, tileHeight: 16 });
    map2.createLayer(0, map2.addTilesetImage('town', 'town', 16, 16, 0, 0), 0, 0).setDepth(1);

    // Props
    this.props = [];
    for (const p of m.props) {
      const sp = this.add.sprite(p.x*16+8, p.y*16+8, p.key, p.frame).setDepth(2);
      this.props.push(sp);
    }
    // Extra house furniture for a cozier interior
    if (this.mapName === 'house') {
      const extra = [
        { x:1, y:1, key:'dun', frame:63 }, { x:14, y:1, key:'dun', frame:63 },
        { x:1, y:3, key:'dun', frame:63 }, { x:2, y:3, key:'dun', frame:63 }
      ];
      for (const p of extra) {
        const sp = this.add.sprite(p.x*16+8, p.y*16+8, p.key, p.frame).setDepth(2);
        this.props.push(sp);
      }
    }

    // Item sprites
    this.itemSprites = {};
    for (const it of ITEMS) {
      if (it.map === m.name && !G.inventory.includes(it.name)) {
        const sp = this.add.sprite(it.x*16+8, it.y*16+8, it.key, it.frame).setDepth(2);
        this.itemSprites[it.name] = sp;
      }
    }

    // NPC sprites
    for (const npc of m.npcs) {
      this.add.sprite(npc.x*16+8, npc.y*16+8, npc.key, npc.frame).setDepth(3);
    }

    // Player
    this.player = this.add.sprite(G.px*16+8, G.py*16+8, 'dun', 88).setDepth(4);

    // Water shimmer (only when map contains water)
    const hasWater = m.rows.some(row => [...row].some(c => m.legend[c].water));
    if (hasWater) {
      this.time.addEvent({ delay: 600, loop: true, callback: () => {
        this.ground.swapByIndex(132, 133);
      }});
    }

    // Camera
    const cam = this.cameras.main;
    cam.setViewport(0, 0, 256, 144);
    cam.setBounds(0, 0, m.rows[0].length * 16, m.rows.length * 16);
    cam.startFollow(this.player, true);
    cam.setRoundPixels(true);

    // End of create
    this.showFacing();
    this.scene.bringToTop('UI');
    G.scene = this;
    G.busy = false;
    if (G.onReady) { const f = G.onReady; G.onReady = null; f(); }
  }

  showFacing() {
    if (G.facing==='left') this.player.setFlipX(true);
    else if (G.facing==='right') this.player.setFlipX(false);
  }
}

class TownScene extends MapScene {
  constructor() { super('Town', 'town'); }
}

class HouseScene extends MapScene {
  constructor() { super('House', 'house'); }
}
