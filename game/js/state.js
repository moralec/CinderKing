// state.js — G (all game state) + Ctl (blocked, step, pressA, pressB, collect)

const G = {
  map: START.map, px: START.x, py: START.y, facing: START.facing,
  inventory: [], dialogueOpen: false, lastMessage: '',
  busy: true, scene: null, onReady: null, fishCount: 0
};
const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
const uiScene = () => window.game.scene.getScene('UI');

const Ctl = {
  blocked(x, y) {
    const m = MAPS[G.map];
    if (y < 0 || y >= m.rows.length || x < 0 || x >= m.rows[0].length) return true;
    if (m.legend[m.rows[y][x]].solid) return true;
    return m.npcs.some(n => n.x===x && n.y===y) || m.props.some(p => p.x===x && p.y===y);
  },
  itemAt(x, y) {
    return ITEMS.find(i => i.map===G.map && i.x===x && i.y===y && !G.inventory.includes(i.name));
  },
  collect(it) {
    G.inventory.push(it.name);
    if (G.scene && G.scene.itemSprites[it.name]) G.scene.itemSprites[it.name].destroy();
    uiScene().refreshCounter();
  },
  step(dir) {
    if (!G.scene || G.busy || G.dialogueOpen) return Promise.resolve(false);
    G.facing = dir;
    if (G.scene.showFacing) G.scene.showFacing();
    const nx = G.px + DIRS[dir][0], ny = G.py + DIRS[dir][1];
    if (Ctl.blocked(nx, ny)) return Promise.resolve(false);
    G.busy = true; G.px = nx; G.py = ny;
    return new Promise(res => {
      G.scene.tweens.add({
        targets: G.scene.player,
        x: nx*16+8, y: ny*16+8,
        duration: 130,
        onComplete: () => Ctl.arrive(res)
      });
    });
  },
  arrive(res) {
    const it = Ctl.itemAt(G.px, G.py);
    if (it) Ctl.collect(it);
    const w = MAPS[G.map].warps.find(w => w.x===G.px && w.y===G.py);
    if (w) {
      const s = G.scene;
      G.scene = null; G.map = w.to; G.px = w.tx; G.py = w.ty; G.facing = w.facing;
      G.battle = null;
      G.onReady = () => res(true);
      s.scene.start(MAPS[w.to].scene);
      return;
    }
    G.busy = false;
    G.battle = null;
    res(true);
  },
  pressA() {
    if (G.dialogueOpen) { uiScene().advance(); return; }
    if (!G.scene || G.busy) return;
    const fx = G.px + DIRS[G.facing][0], fy = G.py + DIRS[G.facing][1], m = MAPS[G.map];
    const npc = m.npcs.find(n => n.x===fx && n.y===fy);
    if (npc) { uiScene().showDialogue(npc.pages); return; }
    const it = Ctl.itemAt(fx, fy);
    if (it) { Ctl.collect(it); return; }
    const row = m.rows[fy]; const cell = row && m.legend[row[fx]];
    if (cell && cell.water) uiScene().showDialogue([FISH[G.fishCount++ % FISH.length]]);
  },
  pressB() {
    if (G.dialogueOpen) uiScene().closeDialogue();
  }
};
