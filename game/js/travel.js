// js/travel.js - chunk 14: actions.travel(map, x, y) and blockedOn(map, x, y)

const blockedOn = (map, x, y) => {
  const prev = G.map;
  G.map = map;
  const result = Ctl.blocked(x, y);
  G.map = prev;
  return result;
};

hook.actions.travel = (map, x, y) => {
  const m = MAPS[map];
  const scene = G.scene;
  if (!m || !scene) return false;

  if (x == null) { x = m.spawn.x; y = m.spawn.y; }

  if (blockedOn(map, x, y)) return false;

  // Close anything open — never refuse for that
  uiScene().closeDialogue();
  Menu.close();
  G.shop = null;
  G.battle = null;
  Battle.onChange();

  if (map === G.map) {
    // Same map: just move the player, no scene change
    G.px = x;
    G.py = y;
    scene.player.setPosition(x * 16 + 8, y * 16 + 8);
    return true;
  }

  // Different map: switch scenes
  Object.assign(G, { map, px: x, py: y, busy: true, scene: null });
  scene.scene.start(m.scene);
  return true;
};
