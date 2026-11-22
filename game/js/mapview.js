// js/mapview.js - the Map page: a grid of zones

function tintToNum(tint) {
  if (!tint) return 0x58a048;
  if (typeof tint === 'number') return tint;
  // Convert hex string like "#dcecff" to number 0xdcecff
  return parseInt(tint.replace('#', ''), 16);
}

UI_BUILD.push(function(ui) {
  const g = Menu.grid = ui.add.graphics().setDepth(9);

  wrap(Menu, 'draw', old => () => {
    old();
    g.clear();
    if (!G.menuOpen || MENU_OPTS[Menu.i] !== 'Map') return;

    const currentId = zoneIdOf(G.map);

    for (const z of DB.world.zones) {
      const x = 14 + z.x * 24;
      const y = 28 + z.y * 12;
      const visited = G.visited.includes(z.id);

      let colour;
      if (visited) {
        colour = tintToNum(z.tint || (DB.world.biomes[z.biome] ? DB.world.biomes[z.biome].tint : null));
      } else {
        colour = 0x203020;
      }

      g.fillStyle(colour).fillRect(x, y, 22, 10);

      if (z.id === currentId) {
        g.lineStyle(2, 0xd03020).strokeRect(x, y, 22, 10);
      }
    }
  });
});
