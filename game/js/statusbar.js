// js/statusbar.js — the strip is a status bar: zone, HP bar, level/gold, hint

Hud.box = [136, 166, 112, 8];
Hud.on = () => !BattleView.box.visible;
Hud.place = () => {
  const z = zoneOf(G.map);
  const site = DB.world.sites.find(s => s.id === G.map);
  return z ? z.name : site ? site.name : '';
};

UI_BUILD.push(ui => {
  Hud.zone = txt(ui, 8, 152, '', '#f8f8e8');
  ui.hpLine.setOrigin(0, 0).setPosition(8, 166);
  ui.counter.setOrigin(0, 0).setPosition(8, 180);
  Hud.hint = txt(ui, 248, 180, 'START: menu', '#a8c0a0').setOrigin(1, 0);
  Hud.bar = ui.add.graphics();
  let drawn = '';
  let fading = false;

  ui.events.on('update', () => {
    const h = G.hero;
    const [x, y, w, hh] = Hud.box;
    const key = h.hp + '/' + h.maxHp;
    Hud.zone.setText(Hud.place());
    if (key !== drawn) {
      drawn = key;
      const part = Math.max(0, Math.min(1, h.hp / h.maxHp));
      Hud.bar.clear()
        .fillStyle(0x587058).fillRect(0, 144, 256, 1)
        .fillStyle(0xf8f8e8).fillRect(x, y, w, hh)
        .fillStyle(0x101810).fillRect(x + 1, y + 1, w - 2, hh - 2)
        .fillStyle(part <= 0.3 ? 0xc84830 : 0x58a048).fillRect(x + 1, y + 1, Math.round((w - 2) * part), hh - 2);
    }
    if (G.menuOpen && !fading) {
      fading = true;
      ui.tweens.add({ targets: Hud.hint, alpha: 0, duration: 400 });
    }
    const on = Hud.on();
    for (const o of [Hud.zone, Hud.bar, Hud.hint, ui.hpLine, ui.counter]) o.setVisible(on);
  });
});
