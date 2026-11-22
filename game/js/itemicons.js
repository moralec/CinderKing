// js/itemicons.js — Items page: a picture beside every thing you carry

(function () {
  // Menu.picture(name) = { key, frame } or null
  Menu.picture = function (name) {
    const e = DB.named[name];
    const it = e && DB.item[e.id];
    if (it) {
      const s = Sprites.item(it.id);
      if (s) return s;
      return { key: it.sprite.sheet === 'town' ? 'town' : 'dun', frame: it.sprite.frame };
    }
    // round-1 treasure
    const treasure = ITEMS.find(i => i.name === name);
    if (treasure) return { key: treasure.key, frame: treasure.frame };
    return null;
  };

  // Menu.rows() = [{ name, n }] first 5 distinct things from bag+inventory
  Menu.rows = function () {
    const seen = {};
    const out = [];
    for (const name of [...G.bag, ...G.inventory]) {
      if (!seen[name]) { seen[name] = 0; out.push({ name, n: 0 }); }
      seen[name]++;
      const idx = out.findIndex(r => r.name === name);
      out[idx].n = seen[name];
      if (out.length >= 5) break;
    }
    return out;
  };
})();

(function () {
  // Menu.text for the Items page
  wrap(Menu, 'text', old => () => {
    if (MENU_OPTS[Menu.i] !== 'Items') return old();
    const rows = Menu.rows();
    if (rows.length === 0) return '(nothing yet)';
    const lines = [];
    for (const r of rows) {
      lines.push(r.name.slice(0, 17));
      let countLine = ' ';
      if (r.n > 1) countLine += 'x' + r.n;
      countLine += ' A: ' + r.name;
      lines.push(countLine);
    }
    return lines.join('\n').trimEnd();
  });
})();

(function () {
  // Menu.draw: show/hide pictures for Items page
  wrap(Menu, 'draw', old => () => {
    old();
    const rows = Menu.rows();
    const itemsPage = MENU_OPTS[Menu.i] === 'Items';
    for (let i = 0; i < 5; i++) {
      const icon = Menu.icons[i];
      if (itemsPage && rows[i]) {
        const pic = Menu.picture(rows[i].name);
        if (pic) {
          icon.setTexture(pic.key, pic.frame);
          icon.setVisible(true);
        } else {
          icon.setVisible(false);
        }
      } else {
        icon.setVisible(false);
      }
    }
  });
})();

(function () {
  // UI_BUILD: create the 5 icon sprites
  UI_BUILD.push(function (ui) {
    Menu.icons = [];
    for (let i = 0; i < 5; i++) {
      const s = ui.add.sprite(156, 22 + 24 * i, 'dun', 0);
      s.setVisible(false);
      Menu.icons.push(s);
    }
    Menu.box.add(Menu.icons);
  });
})();
