// main.js — new Phaser.Game + window.__game

const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = b => {
  const c = window.game && window.game.canvas;
  if (!c) return { x: 0, y: 0 };
  const r = c.getBoundingClientRect();
  return { x: r.left + b.x * r.width / 256, y: r.top + b.y * r.height / 192 };
};

window.__game = {
  get player() { return { x: G.px, y: G.py, map: G.map, facing: G.facing }; },
  get inventory() { return G.inventory.slice(); },
  get dialogueOpen() { return G.dialogueOpen; },
  get lastMessage() { return G.lastMessage; },
  maps: Object.values(MAPS).map(m => ({ name: m.name, width: m.rows[0].length, height: m.rows.length })),
  landmarks: {
    door:  { map:'town', x:4, y:4 },
    exit:  { map:'house', x:7, y:8 },
    npc:   { map:'town', x:10, y:4 },
    water: { map:'town', x:14, y:10 },
    items: ITEMS.map(i => ({ map: i.map, x: i.x, y: i.y, name: i.name }))
  },
  blocked: (x, y) => Ctl.blocked(x, y),
  get ui() {
    return {
      up: page(BTN.up), down: page(BTN.down),
      left: page(BTN.left), right: page(BTN.right),
      a: page(BTN.a), b: page(BTN.b),
      start: page(BTN.start)
    };
  },
  actions: {
    async move(dir, steps = 1) {
      for (let i = 0; i < steps; i++) {
        while (G.busy && !G.dialogueOpen) await sleep(16);
        const before = G.map;
        const moved = await Ctl.step(dir);
        if (!moved || G.map !== before) break;
      }
    },
    pressA: () => Ctl.pressA(),
    pressB: () => Ctl.pressB()
  }
};

document.fonts.load('8px "Press Start 2P"').finally(() => {
  window.game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', width: 256, height: 192, pixelArt: true,
    backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, TownScene, HouseScene, UIScene]
  });
});
