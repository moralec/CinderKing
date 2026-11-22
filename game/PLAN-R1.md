# PLAN: Brindlemere (round 1, the town)

Follow this literally, top to bottom. Do not add features. After every step: **run `timeout 120 python3 selftest.py`; fix every error before the next step**, then tick the box.

Setting (original): the village of **Brindlemere**, hero = young adventurer, NPC = **Orwyn**, warden of the pond.

## 1. Files, scenes, communication

```
index.html
js/data.js    MAPS, legends, entities, texts, button positions (plain data, no Phaser)
js/state.js   G (all game state) + Ctl (blocked, step, pressA, pressB, collect)
js/scenes.js  BootScene, MapScene, TownScene, HouseScene
js/ui.js      UIScene
js/main.js    new Phaser.Game + window.__game
```
Plain `<script>` tags in that order after `lib/phaser.min.js` (no modules, no rexUI: the dialogue box is graphics + text). Top-level `const`/`class` are shared between the scripts.

Canvas **256x192**: the top 256x144 (16x9 tiles) is the game view, the bottom 48 px strip holds the controls and the item counter. Nothing ever overlaps.

| Scene key | Owns |
|---|---|
| `Boot` | `preload()` of both sheets; `create()`: `this.scene.launch('UI'); this.scene.start(MAPS[G.map].scene);` (in that order) |
| `Town` / `House` | Both are `MapScene` subclasses: tile layers, props, item sprites, NPC sprite, player sprite, camera. Rebuilt from `G` in every `create()` |
| `UI` | Control strip, buttons, keyboard, item counter, dialogue box. Launched once, never stopped |

Config: `scene: [BootScene, TownScene, HouseScene, UIScene]` (UI last = drawn on top).

Communication (never `this.scene.sendEvent`, it does not exist):
- All state lives in the global `G`. Scenes read it, only `Ctl` and `UIScene` dialogue methods write it.
- Map scene -> UI: `this.scene.get('UI').refreshCounter()`. From `Ctl` (not a scene): `window.game.scene.getScene('UI')`.
- UI -> world: UI calls `Ctl.step(dir)`, `Ctl.pressA()`, `Ctl.pressB()`; `Ctl` uses `G.scene` (the current map scene, set in `MapScene.create`).
- Map switch: `scene.scene.start('House')` / `'Town'` (stops the old map scene; UI keeps running).

## 2. index.html, preload, keys

`index.html`: the CHEATSHEET page skeleton (font-face + `<div id="game">`), plus CSS `#game{width:100vw;height:100vh}`, then the six scripts.

`BootScene.preload()`:
```js
this.load.spritesheet('town', 'assets/town.png',    { frameWidth: 16, frameHeight: 16 });
this.load.spritesheet('dun',  'assets/dungeon.png', { frameWidth: 16, frameHeight: 16 });
```
Keys used everywhere: `'town'`, `'dun'`. Font everywhere: `const FONT = { fontFamily: '"Press Start 2P"', fontSize: '8px' }`.

`main.js`:
```js
document.fonts.load('8px "Press Start 2P"').finally(() => {
  window.game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 256, height: 192, pixelArt: true,
    backgroundColor: '#000000', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, TownScene, HouseScene, UIScene] });
});
```
`window.__game` (section 7) is defined at the top of `main.js`, outside the promise.

## 3. Maps (js/data.js)

Rows are strings; `rows[y][x]`. Legend entry: `g` = ground tile, `o` = object tile drawn above it (absent = none), `solid`, `water`.

```js
const TOWN_LEGEND = {
  '.':{g:0}, ',':{g:1}, 'f':{g:2}, 'p':{g:25},                        // grass, tufts, flowers, dirt path
  'T':{g:0,o:16,solid:1}, 'Y':{g:0,o:4,solid:1}, 't':{g:0,o:28,solid:1}, 'o':{g:0,o:5,solid:1}, // trees, bush
  'W':{g:132,solid:1,water:1},                                         // pond
  '[':{g:0,o:52,solid:1}, '=':{g:0,o:53,solid:1}, ']':{g:0,o:54,solid:1},   // red roof top
  '{':{g:0,o:64,solid:1}, '-':{g:0,o:65,solid:1}, '}':{g:0,o:66,solid:1},   // red roof lower
  'L':{g:0,o:72,solid:1}, 'D':{g:25,o:85}, 'w':{g:0,o:84,solid:1}, 'R':{g:0,o:75,solid:1}, // wall, DOOR, window, wall
  '<':{g:0,o:80,solid:1}, '_':{g:0,o:81,solid:1}, '>':{g:0,o:82,solid:1} }; // fence
const HOUSE_LEGEND = { '#':{g:126,solid:1}, '%':{g:125,solid:1}, '_':{g:109}, 'E':{g:103} }; // wall, window wall, floor, EXIT

const MAPS = {
  town: { name:'town', scene:'Town', legend:TOWN_LEGEND, rows:[
    'TTTTTTTTTTTTTTTTTTTT',   // y=0
    'T..,....Y...,.....fT',   // 1
    'T..[==].....f.,..f.T',   // 2
    'T.,{--}..o...f.....T',   // 3
    'T..LDwR........f...T',   // 4  door at x=4
    'T.,.p........,.....T',   // 5
    'T...p.,.....<____>.T',   // 6
    'Tf..p...,........,.T',   // 7
    'T.pppppppppppppp...T',   // 8  start at x=9
    'T..,.....t....p..,.T',   // 9
    'T.....f......WWWW..T',   // 10
    'T............WWWW..T',   // 11
    'T...o..,.....WWWW..T',   // 12
    'T.,......f.......,.T',   // 13
    'TTTTTTTTTTTTTTTTTTTT' ], // 14
    props: [],
    npcs:  [{ x:10, y:4, key:'dun', frame:84, pages:NPC_PAGES }],
    warps: [{ x:4, y:4, to:'house', tx:7, ty:7, facing:'up' }] },
  house: { name:'house', scene:'House', legend:HOUSE_LEGEND, rows:[
    '####%####%######',   // y=0
    '#______________#',
    '#______________#',
    '#______________#',
    '#______________#',
    '#______________#',
    '#______________#',
    '#______________#',   // 7  arrive at x=7
    '#######E########' ], // 8  exit at x=7
    props: [ {x:2,y:1,key:'dun',frame:63}, {x:3,y:1,key:'dun',frame:63}, {x:13,y:1,key:'dun',frame:89},
             {x:11,y:3,key:'dun',frame:72}, {x:10,y:3,key:'dun',frame:73}, {x:12,y:3,key:'dun',frame:73} ], // all solid
    npcs:  [],
    warps: [{ x:7, y:8, to:'town', tx:4, ty:5, facing:'down' }] } };

const ITEMS = [ { map:'town', x:16, y:3,  name:'Moonpetal Potion', key:'dun',  frame:115 },
                { map:'town', x:2,  y:11, name:'Brass Key',        key:'town', frame:117 },
                { map:'town', x:17, y:11, name:'Oak Shield',       key:'dun',  frame:101 } ];
const START = { map:'town', x:9, y:8, facing:'down' };
```
Define `NPC_PAGES` and `FISH` **above** `MAPS`. Every town row is exactly 20 characters, every house row 16. At the end of data.js add a check: for each map, `rows.forEach((r,y)=>{ if (r.length!==rows[0].length) console.error('bad row', name, y); for (const c of r) if (!legend[c]) console.error('bad symbol', c); })`.

Guaranteed walkable routes (do not edit the rows): start (9,8) -> west on the path to (4,8) -> north (4,7),(4,6),(4,5) -> door (4,4). NPC front tile (10,5): from (9,8) north to (9,5), east. Water edge (14,9): path east to (14,8), south. Items: (16,3) via the gap at x=18 or x=7..11 in the fence row; (2,11) and (17,11) through open grass. (10,8), right of the start, is free (selftest moves right).

**Building a map** (`MapScene.create`, `m = MAPS[this.mapName]`):
```js
const ground = m.rows.map(r => [...r].map(c => m.legend[c].g));
const objs   = m.rows.map(r => [...r].map(c => m.legend[c].o ?? -1));
const map1 = this.make.tilemap({ data: ground, tileWidth: 16, tileHeight: 16 });
this.ground = map1.createLayer(0, map1.addTilesetImage('town', 'town', 16, 16, 0, 0), 0, 0).setDepth(0);
const map2 = this.make.tilemap({ data: objs, tileWidth: 16, tileHeight: 16 });
map2.createLayer(0, map2.addTilesetImage('town', 'town', 16, 16, 0, 0), 0, 0).setDepth(1);
```
Then sprites at `x*16+8, y*16+8`: props (depth 2), each `ITEMS` entry with `it.map===m.name` and not in `G.inventory` (depth 2, stored in `this.itemSprites[it.name]`), npcs (depth 3), `this.player = this.add.sprite(G.px*16+8, G.py*16+8, 'dun', 88).setDepth(4)`. Water shimmer: `this.time.addEvent({ delay: 600, loop: true, callback: () => this.ground.swapByIndex(132, 133) })`.

Camera, **in every create** (so the follow is re-created on the new player after each switch):
```js
const cam = this.cameras.main;
cam.setViewport(0, 0, 256, 144);
cam.setBounds(0, 0, m.rows[0].length * 16, m.rows.length * 16);
cam.startFollow(this.player, true); cam.setRoundPixels(true);
```
End of create: `this.showFacing(); this.scene.bringToTop('UI'); G.scene = this; G.busy = false; if (G.onReady) { const f = G.onReady; G.onReady = null; f(); }`.
`showFacing()`: `if (G.facing==='left') this.player.setFlipX(true); if (G.facing==='right') this.player.setFlipX(false);`

Classes: `class MapScene extends Phaser.Scene { constructor(key, mapName){ super(key); this.mapName = mapName; } create(){...} }`, `class TownScene extends MapScene { constructor(){ super('Town','town'); } }`, `class HouseScene extends MapScene { constructor(){ super('House','house'); } }`. Put nothing else in constructors.

**Entering/leaving**: handled by `warps` in `Ctl.arrive` (section 4). Door (4,4) and exit (7,8) are walkable trigger tiles. Entering puts the player at house (7,7) facing up; leaving puts them at town (4,5), just outside the door, facing down. The house is exactly 16x9 tiles so it fills the view.

## 4. State and movement (js/state.js)

```js
const G = { map:START.map, px:START.x, py:START.y, facing:START.facing, inventory:[], dialogueOpen:false,
            lastMessage:'', busy:true, scene:null, onReady:null, fishCount:0 };
const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
const uiScene = () => window.game.scene.getScene('UI');
const Ctl = {
  blocked(x, y) {
    const m = MAPS[G.map];
    if (y < 0 || y >= m.rows.length || x < 0 || x >= m.rows[0].length) return true;
    if (m.legend[m.rows[y][x]].solid) return true;
    return m.npcs.some(n => n.x===x && n.y===y) || m.props.some(p => p.x===x && p.y===y);
  },
  itemAt(x, y) { return ITEMS.find(i => i.map===G.map && i.x===x && i.y===y && !G.inventory.includes(i.name)); },
  collect(it) { G.inventory.push(it.name); G.scene.itemSprites[it.name].destroy(); uiScene().refreshCounter(); },
  step(dir) {                                   // one tile; resolves true if the player moved
    if (!G.scene || G.busy || G.dialogueOpen) return Promise.resolve(false);
    G.facing = dir; G.scene.showFacing();       // facing changes on EVERY attempt, also when blocked
    const nx = G.px + DIRS[dir][0], ny = G.py + DIRS[dir][1];
    if (Ctl.blocked(nx, ny)) return Promise.resolve(false);
    G.busy = true; G.px = nx; G.py = ny;
    return new Promise(res => G.scene.tweens.add({ targets: G.scene.player, x: nx*16+8, y: ny*16+8,
      duration: 130, onComplete: () => Ctl.arrive(res) }));
  },
  arrive(res) {
    const it = Ctl.itemAt(G.px, G.py); if (it) Ctl.collect(it);          // stepping onto an item
    const w = MAPS[G.map].warps.find(w => w.x===G.px && w.y===G.py);
    if (w) { const s = G.scene; G.scene = null; G.map = w.to; G.px = w.tx; G.py = w.ty; G.facing = w.facing;
             G.onReady = () => res(true); s.scene.start(MAPS[w.to].scene); return; }   // busy stays true until create ends
    G.busy = false; res(true);
  },
  pressA() { /* section 6 */ }, pressB() { /* section 5 */ } };
```
Picking up an item **never** opens a message box (it would block the test's walking).

**Input (all in `UIScene`)**
- Keys: `this.cursors = this.input.keyboard.createCursorKeys(); this.wasd = this.input.keyboard.addKeys('W,A,S,D');` In `update()`: pick the held direction (arrow or WASD, else `this.padHeld`) and call `Ctl.step(dir)` (it ignores calls while busy).
- `this.input.keyboard.on('keydown-Z', e => { if (!e.repeat) Ctl.pressA(); })`; same for `keydown-SPACE` (A), `keydown-X` and `keydown-ESC` (B).
- On-screen buttons, game coordinates in data.js:
  `const BTN = { up:{x:28,y:153}, down:{x:28,y:183}, left:{x:13,y:168}, right:{x:43,y:168}, a:{x:236,y:160}, b:{x:212,y:176} };`
  Strip: `this.add.rectangle(128, 168, 256, 48, 0x203020)`. D-pad: four `this.add.rectangle(x, y, 14, 14, 0x587058).setStrokeStyle(1, 0xf8f8e8).setInteractive()` plus a non-interactive one at (28,168); on each draw a small cream triangle pointing its way with one `this.add.graphics()` (`fillStyle(0xf8f8e8)`, `fillTriangle`). A and B: `this.add.circle(x, y, 9, 0x587058).setStrokeStyle(1, 0xf8f8e8).setInteractive()` with a centred text label (`setOrigin(0.5)`, colour `#f8f8e8`).
  D-pad events: `pointerdown` -> `this.padHeld = dir; Ctl.step(dir);`; `pointerup` and `pointerout` -> `this.padHeld = null`. A/B: `pointerdown` -> `Ctl.pressA()` / `Ctl.pressB()`. `this.input.addPointer(2)`. `pointerdown` fires for mouse and touch.

## 5. Dialogue (UIScene)

Box inside the game view, above the strip, so buttons never cover it:
```js
this.box = this.add.graphics().setDepth(10);
this.box.fillStyle(0xf8f8e8).fillRoundedRect(4, 96, 248, 44, 4).lineStyle(2, 0x203020).strokeRoundedRect(4, 96, 248, 44, 4);
this.msg = this.add.text(12, 102, '', { ...FONT, color: '#203020', wordWrap: { width: 232 }, lineSpacing: 4 }).setDepth(11);
this.box.setVisible(false); this.msg.setVisible(false);
```
Three lines of 28 characters fit. Use these texts unchanged (all checked to wrap in 3 lines or fewer):
```js
const NPC_PAGES = [ 'Welcome to Brindlemere! I am Orwyn, warden of the pond.',
                    "The fish bite best at the water's edge. Face the pond and press A.",
                    'Three lost treasures lie about town. Bring a keen eye!' ];
const FISH = [ 'You cast your line... A silver minnow! You let it go.',
               'You cast your line... Nothing bit this time.',
               'You cast your line... A grumpy pond toad! It hops away.' ];
```
Methods (no typing effect: the whole page appears at once):
- `showDialogue(pages)`: `this.pages = pages; this.page = 0; G.dialogueOpen = true; this.showPage();` + make box and text visible.
- `showPage()`: `this.msg.setText(this.pages[this.page]); G.lastMessage = this.pages[this.page];` (lastMessage = the current page's full text).
- `advance()`: `this.page++`; if `this.page >= this.pages.length` call `closeDialogue()`, else `showPage()`.
- `closeDialogue()`: hide box and text, `G.dialogueOpen = false` (keep `G.lastMessage`).

`Ctl.pressB()`: `if (G.dialogueOpen) uiScene().closeDialogue();`. `Ctl.step` already refuses to move while a box is open.

## 6. A button, fishing, items, counter

```js
pressA() {
  if (G.dialogueOpen) { uiScene().advance(); return; }
  if (!G.scene || G.busy) return;
  const fx = G.px + DIRS[G.facing][0], fy = G.py + DIRS[G.facing][1], m = MAPS[G.map];
  const npc = m.npcs.find(n => n.x===fx && n.y===fy);
  if (npc) { uiScene().showDialogue(npc.pages); return; }
  const it = Ctl.itemAt(fx, fy); if (it) { Ctl.collect(it); return; }
  const row = m.rows[fy]; const cell = row && m.legend[row[fx]];
  if (cell && cell.water) uiScene().showDialogue([FISH[G.fishCount++ % FISH.length]]);
}
```
Counter in the strip: `this.counter = this.add.text(128, 168, '', { ...FONT, color: '#f8f8e8' }).setOrigin(0.5)`; `refreshCounter()` sets `'ITEMS ' + G.inventory.length + '/' + ITEMS.length`; call it once in `UIScene.create`.

## 7. window.__game (top of js/main.js)

Everything is a getter over `G`, so it is accurate at all times.
```js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = b => { const c = window.game && window.game.canvas; if (!c) return { x: 0, y: 0 };
  const r = c.getBoundingClientRect(); return { x: r.left + b.x * r.width / 256, y: r.top + b.y * r.height / 192 }; };
window.__game = {
  get player() { return { x: G.px, y: G.py, map: G.map, facing: G.facing }; },
  get inventory() { return G.inventory.slice(); },
  get dialogueOpen() { return G.dialogueOpen; },
  get lastMessage() { return G.lastMessage; },
  maps: Object.values(MAPS).map(m => ({ name: m.name, width: m.rows[0].length, height: m.rows.length })), // town first
  landmarks: { door: { map:'town', x:4, y:4 }, exit: { map:'house', x:7, y:8 }, npc: { map:'town', x:10, y:4 },
               water: { map:'town', x:14, y:10 },                       // walkable neighbour: (14,9)
               items: ITEMS.map(i => ({ map: i.map, x: i.x, y: i.y, name: i.name })) },   // start positions, never change
  blocked: (x, y) => Ctl.blocked(x, y),                                  // CURRENT map; door, exit, items are not blocked
  get ui() { return { up: page(BTN.up), down: page(BTN.down), left: page(BTN.left), right: page(BTN.right),
                      a: page(BTN.a), b: page(BTN.b) }; },
  actions: {
    async move(dir, steps = 1) {
      for (let i = 0; i < steps; i++) {
        while (G.busy && !G.dialogueOpen) await sleep(16);               // let a running step or map switch finish
        const before = G.map; const moved = await Ctl.step(dir);
        if (!moved || G.map !== before) break;                           // blocked (only turned) or changed map
      }
    },
    pressA: () => Ctl.pressA(), pressB: () => Ctl.pressB() } };
```
When values change: `player` at the start of each step (and on a warp), `inventory` on pickup, `dialogueOpen`/`lastMessage` in the UIScene dialogue methods.

## 8. Checklist

- [x] 1. `index.html`, `js/data.js` (all of section 3 data, texts, `BTN`), `js/state.js` (`G`, `DIRS`, `Ctl.blocked` only; other methods empty), `js/main.js` (game + full `__game`), `BootScene` with preload, empty `UIScene`, `MapScene`/`TownScene`/`HouseScene` with an empty `create`. Selftest: no errors, every `__game` field present (canvas blank is fine). *(hook)*
- [x] 2. `MapScene.create`: two tile layers + props + water shimmer. Open the screenshot: house, pond, path, trees, fence visible. *(req 1)*
- [x] 3. Player sprite, camera viewport/bounds/follow, end-of-create lines. *(req 1)*
- [x] 4. `Ctl.step` + `Ctl.arrive` without warps/items. Selftest: `move('right', 1)` goes (9,8) -> (10,8). *(req 2, 3)*
- [x] 5. UIScene: strip, D-pad, A/B buttons, keyboard, `update()` held direction. Screenshot: buttons inside the strip, not cut off. *(req 2)*
- [x] 6. NPC sprite; dialogue box and its four methods; `pressA` NPC branch; `pressB`. *(req 5)*
- [x] 7. Check the box look: temporarily add `this.showDialogue(NPC_PAGES)` at the end of `UIScene.create`, run selftest, open the screenshot (text inside the box, pixel font), then **remove that line**. *(req 5, polish)*
- [x] 8. Fishing branch of `pressA`. *(req 6)*
- [x] 9. Item sprites, `itemAt`, `collect`, pickup in `arrive` and in `pressA`, counter text. *(req 7)*
- [x] 10. Warps in `arrive` (door and exit). *(req 4)*
- [x] 11. Check the interior: temporarily set `START = { map:'house', x:7, y:7, facing:'up' }`, run selftest, open the screenshot (room fills the view, furniture visible, no errors), then **restore** `START`. *(req 4, polish)*
- [x] 12. Read section 9 again and compare with the code. Final selftest: no errors, canvas drawn, the player moves. Tick everything and stop.

## 9. Pitfalls and fixes

- **Row/column order**: always `rows[y][x]`; width = `rows[0].length`, height = `rows.length`. Never edit the row strings; the data.js check prints an error if a row has the wrong length.
- **Tilemap from an array**: the data must be numbers with `-1` for empty; one `make.tilemap` per layer; `addTilesetImage('town','town',16,16,0,0)` uses the spritesheet key. Tree, fence, roof and item tiles are transparent: they go in the object layer over grass, never in the ground layer.
- **Depth**: ground 0, objects 1, props/items 2, NPC 3, player 4. Everything in UIScene is above the map because the scene is last in the list; inside it the box is depth 10 and the text 11.
- **Camera**: `setViewport(0,0,256,144)` or the map shows under the strip; `setBounds` to the map size; `startFollow` again in each `create()`.
- **Scene restart**: `scene.start` runs `create()` again on the same object; build everything in `create()`, keep state only in `G`.
- **Stuck `G.busy`**: it starts `true` and is cleared at the end of `MapScene.create`; an exception in `create` leaves the game frozen, so read the selftest errors first.
- **Launch order in Boot**: `launch('UI')` before `start(...)`.
- **Font**: family string with inner quotes `'"Press Start 2P"'`, size `'8px'`, game created only after `document.fonts.load`.
- **Buttons**: listen to `pointerdown` on Phaser objects (works for mouse clicks); text labels are not interactive so clicks pass through. `ui` is computed from `canvas.getBoundingClientRect()` on every read because FIT scaling changes with the window.
- **Keys**: ignore `e.repeat` for A/B; `createCursorKeys()` stops arrows and Space from scrolling the page.
- **No typing effect, no box on pickup, no `this.scene.sendEvent`.**
