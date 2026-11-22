// js/exits.js — chunk 17: zone edges → on foot from zone to zone

SETUP.push(function exits() {
  var GO = { north: ['south', 'up'], south: ['north', 'down'], west: ['east', 'left'], east: ['west', 'right'] };
  for (var i = 0; i < DB.world.zones.length; i++) {
    var z = DB.world.zones[i];
    var m = MAPS[mapOf(z.id)];
    var sides = ['north', 'east', 'south', 'west'];
    for (var j = 0; j < sides.length; j++) {
      var side = sides[j];
      var e = m.exits[side];
      if (!e) continue;
      if (m.warps.find(function(w) { return w.x === e.x && w.y === e.y; })) continue;
      var nbId = z.neighbours[side];
      var to = mapOf(nbId);
      var opp = GO[side][0];
      var facing = GO[side][1];
      var t = MAPS[to].exits[opp];
      var d = DIRS[facing];
      m.warps.push({ x: e.x, y: e.y, to: to, tx: t.x + d[0], ty: t.y + d[1], facing: facing });
    }
  }
});
