# Cheat sheet: Phaser 3.90 + rexUI + assets (offline; do not open lib/)

**Run `python3 selftest.py` after every change; fix every error it prints before you finish** (page errors, missing
`window.__game` fields, a blank canvas, a move that does nothing).

## Page skeleton
```html
<style>@font-face{font-family:"Press Start 2P";src:url(fonts/PressStart2P-Regular.woff2) format("woff2"),url(fonts/PressStart2P-Regular.ttf)}
html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none}</style>
<div id="game"></div>
<script src="lib/phaser.min.js"></script><script src="lib/rexuiplugin.min.js"></script><script src="js/main.js"></script>
```
```js
document.fonts.load('8px "Press Start 2P"').finally(() => new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: 240, height: 160, pixelArt: true,   // GBA-like 15x10 tiles; 160x144 also fine
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade' },                                                 // only if you use arcade physics
  plugins: { scene: [{ key: 'rexUI', plugin: window.rexuiplugin, mapping: 'rexUI' }] },
  scene: [TownScene, UIScene] }));
```

## Scenes
```js
class TownScene extends Phaser.Scene {
  constructor() { super('town'); }
  preload() { this.load.spritesheet('town', 'assets/town.png', { frameWidth: 16, frameHeight: 16 });
              this.load.spritesheet('dun', 'assets/dungeon.png', { frameWidth: 16, frameHeight: 16 }); }
  create() { /* build map, sprites, input */ }
  update(time, delta) { }
}
this.scene.start('house', { from: 'town' });   // switch; read data in init(data)
this.scene.launch('ui'); this.scene.bringToTop('ui');   // run a HUD/controls scene on top (no camera zoom there)
```

## Tilemap from a 2D array (tile numbers below)
```js
const map = this.make.tilemap({ data: grid /* rows of tile indices, -1 = empty */, tileWidth: 16, tileHeight: 16 });
const tiles = map.addTilesetImage('town');               // the spritesheet key
const ground = map.createLayer(0, tiles, 0, 0);
ground.setCollision([4, 5, 16, 132, 133]);               // only needed for arcade physics
const t = ground.getTileAt(x, y); t && t.index;          // read a tile; ground.putTileAt(index, x, y) to change one
// a second layer (decorations over the ground): a second make.tilemap({data: grid2,...}) + createLayer, .setDepth(1)
```
Grid movement (recommended over physics): keep `player.tx, player.ty`, check your own `blocked(x, y)` (solid tile set, NPCs,
bounds), then tween:
```js
this.tweens.add({ targets: sprite, x: tx * 16 + 8, y: ty * 16 + 8, duration: 120, onComplete: () => { moving = false; } });
```

## Sprites, animation, depth
```js
const hero = this.add.sprite(x * 16 + 8, y * 16 + 8, 'dun', 88).setDepth(5);   // frame = tile number
hero.setFlipX(true); hero.setFrame(85); hero.setTint(0xffaaaa); hero.setVisible(false); hero.destroy();
this.anims.create({ key: 'water', frames: this.anims.generateFrameNumbers('town', { frames: [132, 133] }), frameRate: 2, repeat: -1 });
this.add.sprite(px, py, 'town', 132).play('water');
this.time.addEvent({ delay: 500, loop: true, callback: () => {} });   // timers; this.time.delayedCall(ms, fn)
```

## Arcade physics (optional)
```js
const p = this.physics.add.sprite(x, y, 'dun', 88); p.body.setSize(12, 12);
this.physics.add.collider(p, ground);  p.setVelocity(60, 0);  this.physics.add.overlap(p, itemGroup, (p, it) => it.destroy());
```

## Camera
```js
const cam = this.cameras.main;
cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels); cam.startFollow(hero, true); cam.setRoundPixels(true);
obj.setScrollFactor(0);   // HUD objects that stay on screen (or put HUD in a separate UI scene)
cam.fadeOut(200); cam.once('camerafadeoutcomplete', () => {});
```

## Input
```js
const keys = this.input.keyboard.createCursorKeys();     // keys.left.isDown in update()
this.input.keyboard.on('keydown-Z', () => pressA());     // keydown-SPACE, keydown-X, keydown-ESC, keydown-ENTER
this.input.keyboard.on('keydown', e => e.key);           // any key
btn.setInteractive().on('pointerdown', () => {}).on('pointerup', () => {}).on('pointerout', () => {});
this.input.addPointer(2);                                // multi-touch
```
On-screen buttons can also be HTML elements over the canvas (`position:absolute`) with `pointerdown`/`pointerup` listeners;
their page coordinates: `el.getBoundingClientRect()`. For a Phaser object in game coordinates (gx, gy):
```js
const r = game.canvas.getBoundingClientRect();
const page = { x: r.left + gx * r.width / game.scale.width, y: r.top + gy * r.height / game.scale.height };
```

## Text in the pixel font
```js
this.add.text(4, 4, 'Items 0/3', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#203020',
  backgroundColor: '#f8f8e8', padding: { x: 3, y: 3 }, wordWrap: { width: 220 }, lineSpacing: 4 }).setScrollFactor(0);
```
Use font sizes that are multiples of 8 (8px, 16px) for crisp pixels.

## rexUI dialogue box (typing effect, A advances)
```js
const box = this.rexUI.add.textBox({
  x: 120, y: 156, width: 228,
  background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 3, 0xf8f8e8).setStrokeStyle(2, 0x203020),
  text: this.add.text(0, 0, '', { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#203020', wordWrap: { width: 212 }, lineSpacing: 4 }),
  space: { left: 6, right: 6, top: 6, bottom: 6 },
}).setOrigin(0.5, 1).setScrollFactor(0).setDepth(10).layout();
box.start('Hello, traveller!', 20);   // text, ms per character
box.isTyping;  box.stop(true);         // true = show the whole text now
box.setVisible(false);  box.on('complete', () => {});
```
Pages: keep an array of strings, show one per A press (`box.start(pages[i], 20)`); if `box.isTyping`, A first calls `box.stop(true)`.

## rexUI menu (vertical buttons)
```js
const menu = this.rexUI.add.buttons({ x: 200, y: 50, orientation: 'y', space: { item: 4 },
  background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 3, 0xf8f8e8).setStrokeStyle(2, 0x203020),
  buttons: ['Party', 'Items', 'Save', 'Close'].map(s => this.add.text(0, 0, s, { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#203020' })),
}).layout().setScrollFactor(0).setDepth(20);
menu.on('button.click', (button, index) => {});   // or move a cursor with the D-pad and select with A
```
Simpler alternative: a `this.add.rectangle(...)` panel + `this.add.text(...)` lines + your own cursor.

## Saving
```js
localStorage.setItem('save', JSON.stringify(state)); const s = JSON.parse(localStorage.getItem('save') || 'null');
```

## Assets (16x16 tiles, 12 per row; tile number = row * 12 + column; CC0, Kenney + extras)
**assets/town.png** (Tiny Town + extras) - ground & nature: 0 grass, 1 grass tufts, 2 grass flowers; 12-14 / 24-26 / 36-38
dirt-path patch with grass edges (12 top-left, 13 top, 14 top-right, 24 left, 25 centre, 26 right, 36-38 bottom row); 39-42 plain
dirt; 43 stepping stones; trees (single tile, solid) 4 and 16 green, 28 small green, 3/15/27 autumn, 5 round bush; 29 mushrooms.
Extras: **132, 133 water (two animation frames, solid)**, **134 tall grass**, 135 shore (water edge on top of dirt).
Houses (build roof rows above a wall row): grey roof 48-50 (top) / 60-62 (lower), 63 grey gable; red roof 52-54 / 64-66,
67 red gable; 51 and 55 roof chimneys. Walls: wood 72, 73, 75; 74 wood wall with open doorway; stone 76, 77, 79; 78 stone
doorway. 84 wood window, 85 wood door, 86-87 wood double door; 88 stone window, 89 stone door, 90-91 stone double door.
Fences 44-47, 56, 58-59, 68-71, 80-82; 83 signpost; 94 beehive; 95 target; 104 well; 106 log; 107/130 barrels; 131 bucket.
Interior/stone: 96-98 / 108-110 / 120-122 light stone floor patch (109 plain centre); 126 stone brick wall; 125 wall with
window; 99-101 battlement; 103 dark doorway; 111-114 / 123-124 stone arch. Tools/items: 115 pickaxe, 116 pitchfork, 117 key,
118 bow, 119 spear, 127 axe, 128 hammer, 129 hoe.
**assets/dungeon.png** (Tiny Dungeon) - people: 84 wizard (purple), 85 villager, 86 bald man, 87 horned warrior, 88 young hero,
96 knight (helmet), 97 knight (visor), 98 adventurer, 99 lady (purple dress), 100 old woman. Creatures: 108 green slime,
109 ogre, 110 red crab-demon, 111 hooded cultist, 112 orc, 120 bat, 121 ghost, 122 spider, 123-124 rats. Items: 101 round
shield, 102 shield, 103 dagger, 104 sword, 105 cleaver, 106 broadsword, 107 wooden sword, 113-116 potions (grey, green, red,
blue), 117 hammer, 118 double axe, 119 axe, 125-128 vials, 129-130 staffs, 131 spear; 89-91 chests, 92 mimic. Floors 48-53
(sand), 0-3 / 12-13 / 24-25 (dark floor); walls 40, 57-59 (brick), 36-39; doors 45-47; 63/75 bookshelves; 65 gravestone;
72 table; 73 stool.
