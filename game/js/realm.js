// js/realm.js — chunk 12: 36 zone maps in MAPS; window.__game.world and .maps

(function () {

  function openTile(map, x, y) {
    var rows = map.rows;
    var r = rows[y];
    rows[y] = r.slice(0, x) + 'p' + r.slice(x + 1);
  }

  function setExits(map, zone) {
    var exits = {};
    var sides = ['north', 'east', 'south', 'west'];
    for (var i = 0; i < sides.length; i++) {
      var side = sides[i];
      var nx = zone.neighbours[side];
      if (nx == null) {
        exits[side] = null;
      } else {
        exits[side] = map.exits[side];
      }
    }
    map.exits = exits;
  }

  SETUP.push(function realm() {
    var zones = DB.world.zones;
    var biomes = DB.world.biomes;

    for (var i = 0; i < zones.length; i++) {
      var zone = zones[i];
      var name = mapOf(zone.id);

      if (name === 'town') {
        var tw = MAPS.town;
        tw.exits = {
          north: { x: 5, y: 0 },
          east: { x: 29, y: 8 },
          south: { x: 5, y: 14 },
          west: { x: 0, y: 8 }
        };
        // Open tiles for exits (some already 'p')
        openTile(tw, 5, 0);  // north exit
        openTile(tw, 5, 1);  // path from (5,2) to north exit
        openTile(tw, 0, 8);  // west exit
        openTile(tw, 5, 14); // south exit
        // (29,8) is already 'p'
        tw.spawn = { x: 9, y: 8 };
        tw.slots = [
          { x: 9, y: 6 },
          { x: 7, y: 11 },
          { x: 25, y: 12 },
          { x: 19, y: 2 }
        ];
      } else if (name === 'forest') {
        var fo = MAPS.forest;
        fo.exits = {
          north: { x: 8, y: 0 },
          east: { x: 31, y: 3 },
          south: { x: 5, y: 19 },
          west: { x: 0, y: 9 }
        };
        // Open tiles for exits
        openTile(fo, 8, 0);  // north exit
        openTile(fo, 8, 1);  // also open
        openTile(fo, 8, 2);  // path from (8,3) to north exit
        openTile(fo, 30, 3); // also open
        openTile(fo, 31, 3); // east exit
        openTile(fo, 5, 17); // path from (5,16) to south exit
        openTile(fo, 5, 18); // also open
        openTile(fo, 5, 19); // south exit
        // (0,9) is already 'p'
        fo.spawn = { x: 1, y: 9 };
        fo.slots = [
          { x: 9, y: 12 },
          { x: 7, y: 16 }
        ];
      } else {
        MAPS[name] = makeZone(zone, biomes[zone.biome]);
        setExits(MAPS[name], zone);
      }
    }

    // Hand-made interior spawns
    MAPS.house.spawn = { x: 7, y: 7 };
    MAPS.crypt.spawn = { x: 8, y: 10 };

    // Visited list
    if (!G.visited) {
      G.visited = [];
    }
  });

  expose('maps', function () {
    var result = [];
    var order = ['town', 'forest', 'house', 'crypt'];
    var seen = {};
    // Town first
    for (var i = 0; i < order.length; i++) {
      var n = order[i];
      if (MAPS[n]) {
        result.push({ name: n, width: MAPS[n].rows[0].length, height: MAPS[n].rows.length });
        seen[n] = true;
      }
    }
    // Then all generated maps
    var zones = DB.world.zones;
    for (var j = 0; j < zones.length; j++) {
      var mname = mapOf(zones[j].id);
      if (!seen[mname] && MAPS[mname]) {
        result.push({ name: mname, width: MAPS[mname].rows[0].length, height: MAPS[mname].rows.length });
        seen[mname] = true;
      }
    }
    return result;
  });

  expose('world', function () {
    if (!DB.world) return null;
    var zones = DB.world.zones;
    var grid = DB.world.meta.grid;
    var result = {
      width: grid.width,
      height: grid.height,
      zones: []
    };
    for (var k = 0; k < zones.length; k++) {
      var z = zones[k];
      var mname = mapOf(z.id);
      var m = MAPS[mname];
      result.zones.push({
        id: z.id,
        name: z.name,
        biome: z.biome,
        x: z.x,
        y: z.y,
        map: mname,
        encounters: z.encounters.slice(),
        exits: m ? m.exits : null,
        visited: (G.visited || []).includes(z.id)
      });
    }
    return result;
  });

})();
