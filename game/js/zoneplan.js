// zoneplan.js — chunk 10: the layout of a generated zone: roles, exits, slots
// Pure function: no Phaser, no state, no Math.random.

const ZW = 24;
const ZH = 16;

// Seeded PRNG from CHEATSHEET-R4.md
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a hash
function hashText(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h = Math.imul(h ^ code, 16777619);
  }
  return h >>> 0;
}

// Smooth field: a coarse grid of random values, blended between
// the four grid points around each tile; then every tile gets its rank.
function zoneField(rnd, cw, ch) {
  const gw = Math.ceil(ZW / cw) + 2;
  const gh = Math.ceil(ZH / ch) + 2;
  const g = [];
  for (let i = 0; i < gw * gh; i++) {
    g.push(rnd());
  }
  const ease = t => t * t * (3 - 2 * t);
  const all = [];
  for (let y = 0; y < ZH; y++) {
    for (let x = 0; x < ZW; x++) {
      const fx = x / cw;
      const fy = y / ch;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = ease(fx - ix);
      const ty = ease(fy - iy);
      const a = g[iy * gw + ix];
      const b = g[iy * gw + ix + 1];
      const c = g[(iy + 1) * gw + ix];
      const d = g[(iy + 1) * gw + ix + 1];
      all.push({ x, y, v: (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty });
    }
  }
  all.sort((p, q) => p.v - q.v || p.y - q.y || p.x - q.x);
  const out = [];
  for (let y = 0; y < ZH; y++) {
    out.push(new Array(ZW).fill(0));
  }
  all.forEach((p, i) => { out[p.y][p.x] = i / all.length; });
  return out;
}

// Main layout function
function zonePlan(zone, biome) {
  const rnd = rng(hashText(zone.id + '/' + zone.biome));

  // Step 1: three fields; solid in clumps, scatter at their edges, the rest ground
  const lump = zoneField(rnd, 4, 3), kind = zoneField(rnd, 7, 5), lay = zoneField(rnd, 6, 2);
  const share = 0.3 + 0.02 * biome.solid.length;
  const roles = [];
  for (let y = 0; y < ZH; y++) {
    const row = [];
    for (let x = 0; x < ZW; x++) {
      const v = lump[y][x], coin = rnd();
      if (y === 0 || y === ZH - 1 || x === 0 || x === ZW - 1) {
        row.push('solid');
      } else if (v >= 1 - share) {
        row.push('solid');
      } else if (v >= 1 - share - 0.14 && coin < 0.6) {
        row.push('scatter');
      } else if (coin < 0.02) {
        row.push('scatter');
      } else {
        row.push('ground');
      }
    }
    roles.push(row);
  }

  // Step 2: if zone has encounters, 3 danger patches of 4x3
  if (zone.encounters.length > 0) {
    for (let p = 0; p < 3; p++) {
      const px = 2 + Math.floor(rnd() * 17);
      const py = 2 + Math.floor(rnd() * 10);
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx >= 0 && nx < ZW && ny >= 0 && ny < ZH) {
            roles[ny][nx] = 'danger';
          }
        }
      }
    }
  }

  // Step 3: way(x, y, role) — path from (x,y) to centre (12,8)
  function way(x, y, role) {
    // Visit (x,y), then step along row to column 12, then along column 12 to row 8
    const tiles = [];
    // Along row y from x to 12
    const sx = x < 12 ? x : 12;
    const ex = x < 12 ? 12 : x;
    for (let cx = sx; cx <= ex; cx++) {
      tiles.push([cx, y]);
    }
    // Along column 12 from y to 8
    const sy = y < 8 ? y : 8;
    const ey = y < 8 ? 8 : y;
    for (let cy = sy; cy <= ey; cy++) {
      tiles.push([12, cy]);
    }
    // Apply role
    for (const [tx, ty] of tiles) {
      if (tx >= 0 && tx < ZW && ty >= 0 && ty < ZH) {
        if (role === 'path') {
          roles[ty][tx] = 'path';
        } else {
          if (roles[ty][tx] === 'solid') {
            roles[ty][tx] = 'ground';
          }
        }
      }
    }
  }

  // Step 4: each existing exit — way to centre with 'path'
  const exitPositions = {
    north: { x: 12, y: 0 },
    east: { x: 23, y: 8 },
    south: { x: 12, y: 15 },
    west: { x: 0, y: 8 }
  };
  for (const dir of ['north', 'east', 'south', 'west']) {
    if (zone.neighbours[dir]) {
      const ep = exitPositions[dir];
      way(ep.x, ep.y, 'path');
    }
  }

  // Step 5: 5x3 tiles around spawn (x 10..14, y 7..9) — solid -> ground
  for (let y = 7; y <= 9; y++) {
    for (let x = 10; x <= 14; x++) {
      if (roles[y][x] === 'solid') {
        roles[y][x] = 'ground';
      }
    }
  }

  // Step 6: each slot — clear 3x3 area and run way with 'ground'
  const slots = [
    { x: 6, y: 4 },
    { x: 18, y: 4 },
    { x: 6, y: 12 },
    { x: 18, y: 12 },
    { x: 9, y: 11 },
    { x: 15, y: 5 }
  ];
  for (const s of slots) {
    // Clear 3x3 area
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = s.x + dx, ny = s.y + dy;
        if (nx >= 0 && nx < ZW && ny >= 0 && ny < ZH) {
          roles[ny][nx] = 'ground';
        }
      }
    }
    way(s.x, s.y, 'ground');
  }

  // Build exits object
  const exits = {};
  for (const dir of ['north', 'east', 'south', 'west']) {
    if (zone.neighbours[dir]) {
      exits[dir] = exitPositions[dir];
    } else {
      exits[dir] = null;
    }
  }

  return {
    roles, kind, lay, exits,
    slots: slots.map(s => ({ x: s.x, y: s.y })),
    spawn: { x: 12, y: 8 }
  };
}
