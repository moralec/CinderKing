// js/visited.js — mark zones as visited when their maps are drawn

const zoneIdOf = function(mapName) {
  const z = zoneOf(mapName);
  if (z) return z.id;
  const site = DB.world.sites && DB.world.sites.find(function(s) { return s.id === mapName; });
  if (site) return site.zone;
  return null;
};

DRAWN.push(function visited(scene, m) {
  const id = zoneIdOf(m.name);
  if (id && !G.visited.includes(id)) {
    G.visited.push(id);
  }
});
