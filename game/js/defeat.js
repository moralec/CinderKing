// js/defeat.js — a lost battle, the facts: outcome, place, finder, loot

const Defeat = { data: null, force: null };

(function () {
  wrap(BootScene.prototype, 'preload', old => function () {
    old.call(this);
    this.load.json('defeat', 'data/defeat.json');
    this.load.once('filecomplete-json-defeat', (key, type, data) => {
      Defeat.data = data;
    });
  });
})();

Defeat.pick = function () {
  if (Defeat.force !== null) return Defeat.force;
  return Defeat.data.outcomes[roll(Defeat.data.outcomes.length) - 1];
};

Defeat.place = function (map) {
  var z = zoneOf(map);
  if (!z) {
    // Inside a site: same map, at its spawn
    var site = DB.world.sites.find(function (s) { return s.id === map; });
    return {
      map: map,
      x: MAPS[map].spawn.x,
      y: MAPS[map].spawn.y,
      name: Defeat.data.door.replace('{site}', site.name)
    };
  }
  // Find the nearest settlement
  var W = DB.world;
  var best = null, far = 999;
  for (var i = 0; i < W.zones.length; i++) {
    var q = W.zones[i];
    if (!q.settlement) continue;
    var k = Math.abs(q.x - z.x) + Math.abs(q.y - z.y);
    if (k < far) { far = k; best = q; }
  }
  var mname = mapOf(best.id);
  return {
    map: mname,
    x: MAPS[mname].spawn.x,
    y: MAPS[mname].spawn.y,
    name: best.name
  };
};

Defeat.finder = function (map) {
  var d = Defeat.data;
  var here = zoneIdOf(map);
  var place = Defeat.place(map);
  var there = zoneIdOf(place.map);
  var ok = function (n) { return d.finders.includes(n.role); };
  var W = DB.world;
  var a = W.npcs.find(function (n) { return ok(n) && n.zone === here; });
  if (a) return a.name;
  var b = W.npcs.find(function (n) { return ok(n) && n.zone === there; });
  if (b) return b.name;
  return d.stranger;
};

Defeat.loot = function () {
  var result = [];
  for (var i = 0; i < G.bag.length; i++) {
    var name = G.bag[i];
    var t = DB.named[name];
    var it = t && DB.item[t.id];
    if (it && it.kind !== 'potion') {
      result.push(name);
    }
  }
  return result;
};
