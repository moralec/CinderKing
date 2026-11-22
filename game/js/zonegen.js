// zonegen.js — chunk 11: makeZone: a map object like MAPS.town

const _SYMBOLS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function floor(tile) {
  if (tile.startsWith('t:')) return { g: +tile.slice(2) };
  if (tile.startsWith('d:')) return { g: 0, d: +tile.slice(2) };
  return {};
}

function makeZone(zone, biome) {
  const plan = zonePlan(zone, biome);
  const rnd = rng(hashText(zone.id) + 7);

  const legend = {};
  const roleTileSymbol = {};
  let symIdx = 0;

  function pickTile(role) {
    if (role === 'danger') return biome.danger;
    const list = biome[role];
    return list[Math.floor(rnd() * list.length)];
  }

  function getSymbol(role, tile) {
    const key = role + ':' + tile;
    if (!roleTileSymbol[key]) {
      const sym = _SYMBOLS[symIdx++];
      roleTileSymbol[key] = sym;

      const base = floor(tile);
      let entry;
      if (role === 'danger') {
        entry = { ...base, grass: 1 };
      } else if (role === 'solid') {
        if (tile === 't:132') {
          entry = { g: 132, solid: 1, water: 1 };
        } else {
          entry = { ...floor(biome.ground[0]), solid: 1, top: tile };
        }
      } else if (role === 'scatter') {
        entry = { ...floor(biome.ground[0]), top: tile };
      } else {
        // ground or path
        entry = { ...base };
      }
      legend[sym] = entry;
    }
    return roleTileSymbol[key];
  }

  // Build rows
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let row = '';
    for (let x = 0; x < 24; x++) {
      const role = plan.roles[y][x];
      const tile = pickTile(role);
      row += getSymbol(role, tile);
    }
    rows.push(row);
  }

  // Determine dun
  let dun = 0;
  for (const sym of Object.keys(legend)) {
    if (legend[sym].d != null) { dun = 1; break; }
  }

  return {
    name: zone.id,
    scene: 'Zone',
    legend,
    rows,
    dun,
    props: [],
    npcs: [],
    warps: [],
    exits: plan.exits,
    spawn: plan.spawn,
    slots: plan.slots
  };
}
