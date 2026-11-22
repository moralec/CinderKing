// js/nobuttons.js — hide drawn buttons in the status strip; keep touch zones

const Hud = { pad: [], start: null };

UI_BUILD.push(ui => {
  for (const c of ui.children.list) {
    const drawn =
      ((c.type === 'Rectangle' || c.type === 'Arc') && c.fillColor === 0x587058 && c.fillAlpha > 0)
      || (c.type === 'Text' && c.y > 144 && ['A', 'B', 'START'].includes(c.text))
      || (c.type === 'Graphics' && c.depth === 0);
    if (drawn) { c.setVisible(false); Hud.pad.push(c); }
  }
  const { x, y } = BTN.start;
  Hud.start = ui.add.rectangle(x, y, 46, 14, 0x000000, 0).setInteractive()
    .on('pointerdown', () => Ctl.pressStart());
});
