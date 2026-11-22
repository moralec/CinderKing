// js/folk.js — chunk 18: the 52 people stand in their zones

const Folk = {
  place: {},
  OLD: {
    'elder-maren': 'giver',
    'brother-tobin': 'keeper',
    hale: 'helper',
    orwyn: 'npc'
  },
  takeSlot(map) {
    const m = MAPS[map];
    if (!m || !m.slots || m.slots.length === 0) {
      console.error('No slots for map ' + map);
      return null;
    }
    const slot = m.slots.shift();
    return { map: map, x: slot.x, y: slot.y };
  },
  talk(npc) {}
};

let _npcs = [];

SETUP.push(function folk() {
  const landmarks = hook.landmarks;
  for (const npc of DB.world.npcs) {
    const oldKey = Folk.OLD[npc.id];
    let at;
    if (oldKey) {
      at = { map: landmarks[oldKey].map, x: landmarks[oldKey].x, y: landmarks[oldKey].y };
    } else {
      const mapName = mapOf(npc.zone);
      at = Folk.takeSlot(mapName);
    }
    Folk.place[npc.id] = at;
    if (at) {
      _npcs.push({ id: npc.id, name: npc.name, role: npc.role, zone: npc.zone, map: at.map, x: at.x, y: at.y });
      if (!oldKey) {
        ACTORS.push({
          map: at.map,
          x: at.x,
          y: at.y,
          tint: npc.sprite.tint,
          f: () => npc.sprite.frame,
          talk: () => Folk.talk(npc)
        });
      }
    }
  }
});

expose('npcs', () => _npcs);
