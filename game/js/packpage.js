// js/packpage.js — Step 84: the Items page — worn gear and the bag as one list with a cursor; A drinks, wears, takes off

// Pack.lines() -> [{ text, row }]: for each row k of Pack.rows(), insert WORN/BAG headings,
// prefix with '>' when that row is the cursor
Pack.lines = function () {
  const rows = Pack.rows();
  const out = [];
  let group = '';
  for (let k = 0; k < rows.length; k++) {
    const g = rows[k].worn ? 'WORN' : 'BAG';
    if (g !== group) {
      group = g;
      out.push({ text: group });
    }
    const more = rows[k].n > 1 ? ' x' + rows[k].n : '';
    const mark = Pack.open && k === Pack.i ? '>' : ' ';
    const cut = rows[k].name.slice(0, 17 - more.length);
    out.push({ text: mark + cut + more, row: k });
  }
  if (group === 'BAG' && out.length <= 1) {
    out.push({ text: ' (empty)' });
  }
  return out;
};

// Pages.Items
Pages.Items = {
  text() {
    const lines = Pack.lines();
    const rows = Pack.rows();
    const at = lines.findIndex(l => l.row === Pack.i);
    const first = (Pack.open && at >= 7) ? at - 6 : 0;
    const out = lines.slice(first, first + 7).map(l => l.text);
    if (!Pack.open) return out.join('\n') + '\nA: open the list';
    while (out.length < 7) out.push('');
    const row = rows[Pack.i];
    const act = Pack.act(row) || 'no use';
    out.push('A: ' + act);
    out.push(Pack.gain(row));
    return out.join('\n');
  },
  a() {
    Pack.open = true;
    const rows = Pack.rows();
    const idx = rows.findIndex(r => !r.worn);
    Pack.i = idx >= 0 ? idx : 0;
    Menu.draw();
  }
};

// Menu.rows = [] so item icons stay hidden
Menu.rows = () => [];

// Wrap Menu.close to also close the list
wrap(Menu, 'close', old => () => { Pack.open = false; old(); });

// Items mode
Modes.add({
  name: 'items',
  z: 50,
  on: () => G.menuOpen && Pack.open,
  dir(d) {
    const n = Pack.rows().length;
    if (n === 0) return;
    Pack.i = (Pack.i + DIRS[d][1] + n) % n;
    Menu.draw();
  },
  a() {
    const rows = Pack.rows();
    if (rows.length > 0) {
      Pack.use(rows[Pack.i]);
      // clamp Pack.i to new row count
      if (Pack.i >= Pack.rows().length) Pack.i = Pack.rows().length - 1;
      Menu.draw();
    }
  },
  b() { Pack.open = false; Menu.draw(); },
  start() { Menu.close(); }
});
