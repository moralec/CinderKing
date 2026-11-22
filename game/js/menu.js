// js/menu.js - START button, Enter key, Start menu
const Menu = { i:0, last:0, focus:-1,
  build(ui) { const { x, y } = BTN.start, g = ui.add.graphics();
    ui.add.rectangle(x, y, 46, 11, 0x587058).setStrokeStyle(1, 0xf8f8e8).setInteractive().on('pointerdown', () => Ctl.pressStart());
    txt(ui, x, y, 'START', '#f8f8e8').setOrigin(0.5);
    ui.input.keyboard.on('keydown-ENTER', e => { if (!e.repeat) Ctl.pressStart(); });
    panel(g, 4, 4, 164, 136); panel(g, 172, 4, 80, 80);
    Menu.body = txt(ui, 12, 12, ''); Menu.opts = txt(ui, 180, 12, '').setLineSpacing(6);
    Menu.face = ui.add.sprite(140, 28, 'dun', 88).setScale(2);
    Menu.box = ui.add.container(0, 0, [g, Menu.body, Menu.opts, Menu.face]).setDepth(8).setVisible(false); },
  text() { const h = G.hero, s = h.stats, o = MENU_OPTS[Menu.i], inv = G.inventory;
    if (o === 'Party') return `${h.name}\n${h.cls} Lv ${h.level}\nHP ${h.hp}/${h.maxHp}\nAC ${Rules.ac(h)}  XP ${h.xp}/${Rules.xpNext(h)}\n\n` +
      `STR ${s.str}  INT ${s.int}\nDEX ${s.dex}  WIS ${s.wis}\nCON ${s.con}  CHA ${s.cha}`;
    if (o === 'Items') return `ITEMS ${inv.length}/${ITEMS.length}\n\n` + (inv.join('\n') || '(nothing yet)');
    return o === 'Close' ? 'Back to\nBrindlemere.' : o + ' your\nadventure.'; },
  draw() { Menu.box.setVisible(G.menuOpen); if (!G.menuOpen) return;
    const highlight = Menu.focus >= 0 ? Menu.focus : Menu.i;
    Menu.opts.setText(MENU_OPTS.map((o, k) => (k === highlight ? '>' : ' ') + o).join('\n'));
    Menu.body.setText(Menu.text()); Menu.face.setVisible(Menu.focus < 0 && Menu.i === 0); },
  open() { G.menuOpen = true; Menu.i = 0; Menu.focus = -1; Menu.draw(); },
  close() { G.menuOpen = false; Menu.focus = -1; Menu.draw(); },
  move(dir) { const now = Date.now(), dy = DIRS[dir][1]; if (!dy || now - Menu.last < 170) return;
    Menu.last = now;
    if (Menu.focus >= 0) { Menu.focus = (Menu.focus + dy + 5) % 5; } else {
      Menu.i = (Menu.i + dy + 5) % 5; }
    Menu.draw(); },
  select() { const o = MENU_OPTS[Menu.i];
    if (Menu.focus < 0) {
      if (o === 'Party' || o === 'Items') { Menu.focus = Menu.i; Menu.draw(); return; }
      Menu.close();
      if (o === 'Save') Save.doSave();
      if (o === 'Load') Save.doLoad();
    } else {
      Menu.focus = -1; Menu.draw(); } } };
UI_BUILD.push(ui => Menu.build(ui));
