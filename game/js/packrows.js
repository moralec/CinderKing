// js/packrows.js — Step 83: Pack = what the hero wears and carries, as rows

const Pack = {
  open: false,
  i: 0,

  rows() {
    const rows = [];
    // worn gear first
    for (const slot of Object.keys(G.hero.equipment)) {
      const id = G.hero.equipment[slot];
      if (!id) continue;
      rows.push({ worn: true, slot, id, name: DB.thing[id].name, n: 1 });
    }
    // then the bag, deduplicated
    const seen = {};
    for (const name of [...G.bag, ...G.inventory]) {
      if (seen[name]) { seen[name].n++; continue; }
      const row = { worn: false, slot: null, name, n: 1 };
      if (DB.named[name]) row.id = DB.named[name].id;
      seen[name] = row;
      rows.push(row);
    }
    return rows;
  },

  act(row) {
    if (row.worn) return 'take off';
    if (row.name === DRAUGHT) return 'drink';
    if (row.id && DB.item[row.id] && DB.item[row.id].effect && DB.item[row.id].effect.heal) return 'drink';
    if (row.id) {
      const item = DB.item[row.id];
      if (!item) return '';
      const slot = Hero.slotOf(item);
      if (slot === 'weapon') return 'wield';
      if (slot) return 'wear';
      return '';
    }
    return '';
  },

  with(slot, id) {
    const h = G.hero;
    const old = h.equipment[slot];
    h.equipment[slot] = id;
    Hero.refresh();
    const ac = h.ac;
    const bonus = h.attack.bonus;
    const damage = h.attack.damage;
    h.equipment[slot] = old;
    Hero.refresh();
    return { ac, bonus, damage };
  },

  gain(row) {
    const act = Pack.act(row);
    if (act === 'drink') {
      const item = row.id ? DB.item[row.id] : null;
      const heal = item && item.effect && item.effect.heal ? item.effect.heal : '';
      return 'Heals ' + heal + '.';
    }
    if (act === '') return 'No use here.';
    const h = G.hero;
    const slot = row.worn ? row.slot : Hero.slotOf(DB.item[row.id]);
    const w = Pack.with(slot, row.worn ? null : row.id);
    let word;
    if (slot === 'weapon') {
      const now = h.attack.bonus + mean(h.attack.damage);
      const then = w.bonus + mean(w.damage);
      word = then > now ? 'better' : then < now ? 'worse' : 'same';
      return 'Dmg ' + h.attack.damage + ' > ' + w.damage + ' ' + word;
    }
    const now = h.ac;
    const then = w.ac;
    word = then > now ? 'better' : then < now ? 'worse' : 'same';
    return 'AC ' + now + ' > ' + then + ' ' + word;
  },

  use(row) {
    const act = Pack.act(row);
    const name = row.name;
    if (act === 'take off') {
      hook.actions.unequip(row.slot);
      say(['You take off the ' + name + '.']);
    } else if (act === 'drink') {
      if (!Bag.use(row.name)) {
        say(['Your HP is full.']);
      } else if (row.name === DRAUGHT) {
        say([G.lastMessage]);
      }
    } else if (act === 'wield' || act === 'wear') {
      hook.actions.equip(row.id);
      say(['You ' + act + ' the ' + name + '. AC ' + G.hero.ac + '.']);
    } else {
      say([name + ': no use here.']);
    }
  }
};

function mean(text) {
  const d = parseDice(text);
  if (d.n > 0) return d.n * (d.d + 1) / 2 + d.k;
  return d.k;
}
