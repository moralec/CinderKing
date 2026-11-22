// js/look.js — biome tint overlay on zone maps
(function () {
  const look = function look(scene, m) {
    const z = zoneOf(m.name);
    const tint = z && (z.tint || DB.world.biomes[z.biome].tint);
    if (tint) {
      const w = m.rows[0].length * 16;
      const h = m.rows.length * 16;
      scene.add.rectangle(0, 0, w, h, parseInt(tint.slice(1), 16))
        .setOrigin(0)
        .setDepth(2.5)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    }
  };
  DRAWN.push(look);
})();
