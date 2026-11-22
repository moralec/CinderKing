// gate.mjs - the helpers of the build kit's gate (walk by the hook's blocked(), settle, face, portals), taken as they are from the
// kit that built the game (archetypes/game-phaser/testkit/gate.mjs), so the rounds 1-3 replay (replay-rpg.mjs) runs here unchanged.
// `t` is the test context of harness.mjs (t.ev). Used by engine.mjs only.

/** "not drawn": one colour covers 97 % of the playfield, or fewer than 3 colours, or the brightness hardly varies */
export const BLANK = { flat: 0.97, distinct: 3, sd: 4 };
export const blankWhy = (s) => (!s ? 'no canvas' : s.flat >= BLANK.flat ? `${Math.round(100 * s.flat)} % of it is one colour` : (s.distinct ?? s.bins) < BLANK.distinct ? `only ${s.distinct ?? s.bins} colour(s)` : s.sd < BLANK.sd ? `flat brightness (spread ${s.sd.toFixed(1)})` : null);
export const AREA = [0.06, 0.1, 0.94, 0.66];   // the playfield, inside any frame or title (fractions of the canvas)
export const LOOK = [0, 0, 1, 0.7];            // the zone comparison area: the top 70 % of the canvas (the R4 checker's measure)
export const SIG_MIN = 0.2, PAIRS_MIN = 0.9;   // two zones look different from a colour distance of 0.2; 90 % of the pairs must

export function helpers(t) {
  const H = {};
  let PORTALS = ['door', 'exit'];
  H.DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  H.OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  H.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  H.fail = (m) => { throw new Error(m); };
  H.must = (c, m) => { if (!c) throw new Error(m); };
  H.ev = async (e, fb = null) => { try { const v = await t.ev(`(() => { try { return (${e}); } catch (err) { return null; } })()`); return v == null ? fb : v; } catch (err) { return fb; } };
  H.until = async (e, ms = 3000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await H.ev(e, false)) return true; await H.sleep(60); } return false; };
  H.portals = (list) => { PORTALS = list; };
  H.pos = () => H.ev('(() => { const q = window.__game.player; return { x: q.x, y: q.y, map: q.map }; })()', {});
  H.lm = (k) => H.ev(`window.__game.landmarks && window.__game.landmarks.${k}`);
  H.A = async (ms = 300) => { await H.ev('window.__game.actions.pressA()'); await H.sleep(ms); };
  const same = (a, c) => a && c && a.x === c.x && a.y === c.y && a.map === c.map;
  H.settle = async (prev, ms = 2000) => { const t0 = Date.now(); let last = await H.pos(), stable = 0;
    while (Date.now() - t0 < ms) { await H.sleep(60); const now = await H.pos();
      if (same(now, last)) { stable += 60; if (stable >= 240 && !same(now, prev)) break; if (stable >= 600) break; } else stable = 0; last = now; }
    return last; };
  H.step = async (d) => { const b = await H.pos(); await H.ev(`Promise.resolve(window.__game.actions.move('${d}', 1)).then(() => true)`); return H.settle(b); };
  const isPortal = (map, x, y) => H.ev(`(() => { const L = window.__game.landmarks || {}; return ${JSON.stringify(PORTALS)}.some(k => L[k] && L[k].map === ${JSON.stringify(map)} && L[k].x === ${x} && L[k].y === ${y}); })()`, false);
  H.free = async (x, y) => { const q = await H.pos(); return !(await isPortal(q.map, x, y)) && !(await H.ev(`window.__game.blocked(${x}, ${y})`, true)); };
  H.openDir = async () => { const q = await H.pos(); for (const [d, [dx, dy]] of Object.entries(H.DV)) if (await H.free(q.x + dx, q.y + dy)) return d; return null; };
  H.busyClear = async () => { for (let i = 0; i < 60; i++) {
    const s = await H.ev('({ d: !!window.__game.dialogueOpen, m: !!window.__game.menuOpen, b: !!(window.__game.battle && window.__game.battle.active), s: !!window.__game.shop })', {});
    if (s.s && !s.d) { await H.ev('window.__game.actions.pressB()'); await H.sleep(200); continue; }
    if (s.b || s.d) { await H.A(200); continue; }
    if (s.m) { await H.ev('window.__game.actions.pressB()'); await H.sleep(200); continue; }
    return true; } return false; };
  const route = (tx, ty, adjacent) => H.ev(`(() => { const g = window.__game, q = g.player, m = g.maps.find(m => m.name === q.map) || { width: 200, height: 200 };
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, key = (x, y) => x + ',' + y, L = g.landmarks || {};
    const portal = (x, y) => ${JSON.stringify(PORTALS)}.some(k => L[k] && L[k].map === q.map && L[k].x === x && L[k].y === y);
    const goal = (x, y) => ${adjacent} ? Math.abs(x - ${tx}) + Math.abs(y - ${ty}) === 1 : x === ${tx} && y === ${ty};
    const prev = new Map([[key(q.x, q.y), null]]), Q = [[q.x, q.y]];
    while (Q.length) { const [x, y] = Q.shift();
      if (goal(x, y)) { const out = []; let k = key(x, y); while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; } return out; }
      for (const [d, [dx, dy]] of Object.entries(D)) { const nx = x + dx, ny = y + dy, k = key(nx, ny), isT = nx === ${tx} && ny === ${ty};
        if (nx < 0 || ny < 0 || nx >= m.width || ny >= m.height || prev.has(k)) continue;
        if (g.blocked(nx, ny) && !(isT && !${adjacent})) continue;
        if (!isT && portal(nx, ny)) continue;
        prev.set(k, [key(x, y), d]); Q.push([nx, ny]); } }
    return null; })()`);
  H.walkTo = async (tx, ty, adjacent = false) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      await H.busyClear();
      const r = await route(tx, ty, adjacent); if (!r) return { ok: false, why: `no path to ${tx},${ty}${adjacent ? ' (adjacent)' : ''} by blocked()` };
      let stuck = false;
      for (const d of r) { const b = await H.pos(), a = await H.step(d); if (same(a, b)) { stuck = true; break; } if (a.map !== b.map) return { ok: true, mapChanged: true }; }
      if (!stuck) return { ok: true };
    }
    return { ok: false, why: 'kept getting stuck on the path blocked() allows (blocked() disagrees with movement?)' };
  };
  H.face = async (tx, ty) => { const q = await H.pos(); const d = Object.entries(H.DV).find(([, [dx, dy]]) => q.x + dx === tx && q.y + dy === ty); if (!d) return null;
    if (await H.ev(`window.__game.blocked(${tx}, ${ty})`, true)) { await H.step(d[0]); return d[0]; }
    const bx = q.x - H.DV[d[0]][0], by = q.y - H.DV[d[0]][1];
    if (await H.free(bx, by)) { const a = await H.step(H.OPP[d[0]]); if (!same(a, q)) await H.step(d[0]); }
    return d[0]; };
  H.through = async (k) => { const tg = await H.lm(k), q = await H.pos(); if (!tg || tg.map !== q.map) return false;
    await H.busyClear(); await H.walkTo(tg.x, tg.y); await H.sleep(600); return (await H.settle(await H.pos())).map !== q.map; };
  return H;
}
