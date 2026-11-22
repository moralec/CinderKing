// js/shopview.js — chunk 28: shop panel, cursor, A buys
(function() {
  const s = Shop;
  s.last = 0;
  s.box = null;
  s.icon = null;
  s.draw = function() {
    if (!s.box) return;
    const npc = s._npc();
    if (npc && s.icon) {
      const id = npc.stock[s.i];
      const it = DB.item[id];
      const sp = Sprites.item(id);
      s.icon.setTexture(sp ? sp.key : (it.sprite.sheet === 'town' ? 'town' : 'dun'), sp ? sp.frame : it.sprite.frame);
    }
    const lines = [];
    if (npc) {
      const goldPart = '  ' + G.gold + ' gp';
      const maxName = 28 - goldPart.length;
      lines.push((npc.name || '').slice(0, maxName) + goldPart);
      const stock = npc.stock;
      const lo = Math.max(0, s.i - 2);
      const hi = Math.min(stock.length - 1, s.i + 2);
      for (let j = lo; j <= hi; j++) {
        const item = DB.item[stock[j]];
        const mark = j === s.i ? '>' : ' ';
        const price = String(item.cost_gp);
        const pricePart = ' ' + price + ' gp';
        const maxName = 28 - (mark + ' ').length - pricePart.length;
        const name = (item.name || '').slice(0, Math.max(0, maxName));
        lines.push(mark + ' ' + name + ' '.repeat(28 - (mark + ' ' + name + pricePart).length) + pricePart);
      }
      while (lines.length < 6) lines.push('');
      lines.push(' A buy   B leave');
    }
    s.box.list[1].setText(lines.slice(0, 7).join('\n'));
    s.box.setVisible(!!G.shop);
  };
  s._npc = function() {
    if (!G.shop) return null;
    return DB.world.npcs.find(n => n.id === G.shop);
  };
  s.move = function(dir) {
    const now = Date.now();
    if (now - s.last < 170) return;
    s.last = now;
    const npc = s._npc();
    if (!npc) return;
    const dy = dir === 'down' ? 1 : -1;
    s.i = (s.i + dy + npc.stock.length) % npc.stock.length;
    s.draw();
  };
  s.buy = function() {
    const npc = s._npc();
    if (!npc) return false;
    const id = npc.stock[s.i];
    const item = DB.item[id];
    if (!item || G.gold < item.cost_gp) {
      return false;
    }
    G.gold -= item.cost_gp;
    Bag.add(item.name);
    s.draw();
    return true;
  };

  UI_BUILD.push(ui => {
    const g = ui.add.graphics();
    panel(g, 4, 4, 248, 88);
    const text = txt(ui, 12, 11, '', '#203020').setLineSpacing(2);
    s.icon = ui.add.sprite(236, 80, 'dun', 0);
    s.box = ui.add.container(0, 0, [g, text, s.icon]).setDepth(9).setVisible(false);
    s.draw();
    ui.events.on('update', () => {
      if (!G.shop && s.box.visible) s.draw();
    });
  });

  wrap(Ctl, 'step', old => dir => {
    if (G.shop && !G.dialogueOpen) {
      s.move(dir);
      return Promise.resolve(false);
    }
    return old(dir);
  });

  wrap(Ctl, 'pressA', old => () => {
    if (G.shop && !G.dialogueOpen) {
      if (!s.buy()) {
        say(['Not enough gold.']);
      }
      return;
    }
    return old();
  });
})();
