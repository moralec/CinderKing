// js/title.js — chunk 53: title screen with cover and "Press START"

const Title = {
  on: false,
  box: null,
  cover: null,
  press: null,
  show() {
    this.on = true;
    if (this.box) this.box.setVisible(true);
  },
  hide() {
    if (!this.on) return;
    this.on = false;
    if (this.box) this.box.setVisible(false);
  }
};

// Load cover in Boot scene
wrap(BootScene.prototype, 'preload', old => function () {
  old.call(this);
  this.load.image('cover', 'assets/cover.png');
});

// Build title box in UI_BUILD
UI_BUILD.push(ui => {
  // Dark panel
  const g = ui.add.graphics();
  g.fillStyle(0x101018).fillRect(0, 0, 256, 144);

  // Cover image (160x238, show 144px window via crop)
  const cover = ui.add.image(0, 0, 'cover').setOrigin(0);
  cover.setCrop(0, 0, 160, 144);

  // Small text: "A tale\nof\n<land>"
  const tale = txt(ui, 208, 40, 'A tale\nof\n' + DB.world.meta.land, '#c8c8b8');
  tale.setOrigin(0.5).setAlign('center');

  // Press START text
  const press = txt(ui, 208, 104, 'Press\nSTART', '#f8f8e8');
  press.setOrigin(0.5).setAlign('center');

  // Container at depth 20
  Title.box = ui.add.container(0, 0, [g, cover, tale, press]).setDepth(20).setVisible(false);
  Title.cover = cover;
  Title.press = press;
  Title.show();
});

// START closes the title (used up)
wrap(Ctl, 'pressStart', old => () => {
  if (Title.on) { Title.hide(); return; }
  return old();
});

// Direction key closes the title and still steps
wrap(Ctl, 'step', old => dir => {
  if (Title.on) { Title.hide(); return old(dir); }
  return old(dir);
});

// A key closes the title and still presses
wrap(Ctl, 'pressA', old => () => {
  if (Title.on) { Title.hide(); return old(); }
  return old();
});

// B key closes the title and still presses
wrap(Ctl, 'pressB', old => () => {
  if (Title.on) { Title.hide(); return old(); }
  return old();
});

// Reading window.__game closes the title
const real = window.__game;
Object.defineProperty(window, '__game', {
  configurable: true,
  get() { Title.hide(); return real; }
});
