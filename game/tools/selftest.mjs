// selftest.mjs <url> <shot.png> <round R1|R2|R3|R4> -- facts about the page, for the agent building it (run through ../selftest.py).
// Loads the page in headless Chromium (./driver.mjs), waits ~3 s, prints: page exceptions / console errors, which window.__game fields
// from BRIEF.md are missing, how much of the canvas is drawn (not one flat colour), the player before/after actions.move('right', 1),
// and a screenshot path. Facts only: it does not test the game's requirements. Round R4 adds: the round 4 contract fields, counts,
// the data files the page fetched, travel() to every zone (exits free and joined, people on blocked tiles) and three zone screenshots.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const D = await import(pathToFileURL(path.join(HERE, 'driver.mjs')).href);
const [url, shotFile, round] = process.argv.slice(2);
const out = [];
const say = (s) => out.push(s);
const LIMIT = round === 'R4' ? 95 : 35;
const hardStop = setTimeout(() => { console.log(out.join('\n') + `\nselftest: gave up after ${LIMIT} s (the page hangs?)`); process.exit(3); }, LIMIT * 1000);

function decodePng(buf) {   // 8-bit RGB/RGBA, non-interlaced (Chromium screenshots)
  let p = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), o = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[o + x - bpp] : 0, b = y ? px[o - stride + x] : 0, c = x >= bpp && y ? px[o - stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[o + x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}

let b, PAGE, EV;
// Round 4: facts about the world contract (BRIEF.md). Nothing here grades a requirement.
async function round4() {
  const p = PAGE, ev = EV;
  const n = await ev(`(() => { const g = window.__game, len = a => Array.isArray(a) ? a.length : 'MISSING', q = g.quests || {};
    return { zones: len(g.world && g.world.zones), maps: len(g.maps), bestiary: len(g.bestiary), catalog: len(g.catalog), npcs: len(g.npcs), main: len(q.main), side: len(q.side),
      gold: g.gold, won: g.won, start: g.player && g.player.map, eq: g.party && g.party[0] && JSON.stringify(g.party[0].equipment), ac: g.party && g.party[0] && g.party[0].ac,
      attack: g.party && g.party[0] && JSON.stringify(g.party[0].attack) }; })()`, {});
  say(`round 4 counts: zones ${n.zones} (want 36), maps ${n.maps}, bestiary ${n.bestiary} (data: 83), catalog ${n.catalog} (data: 87), npcs ${n.npcs} (data: 52), quests main ${n.main} (8) side ${n.side} (12)`);
  say(`hero: equipment ${n.eq}, ac ${n.ac}, attack ${n.attack}, gold ${n.gold}, won ${n.won}; the player starts on map ${n.start}`);
  const want = ['data/world.json', 'data/srd/monsters.json', 'data/srd/items.json', 'data/srd/rules.json'], got = (f) => p.requests.some((r) => r.split(/[?#]/)[0].endsWith('/' + f));
  say('data files fetched by the page: ' + want.map((f) => `${f.replace('data/', '')} ${got(f) ? 'yes' : 'NO'}`).join(', ') + (want.slice(0, 3).every(got) ? '' : '  <- the test serves changed data files and expects the game to follow them'));
  if (!(await ev('!!(window.__game.world && Array.isArray(window.__game.world.zones) && window.__game.actions && typeof window.__game.actions.travel === "function")', false))) { say('zones: world.zones or actions.travel missing, nothing more to look at'); return; }
  const zs = (await ev('window.__game.world.zones.map(z => ({ id: z.id, map: z.map, biome: z.biome }))', [])) || [];
  const pick = new Set([zs[5 % zs.length], zs[16 % zs.length], zs[30 % zs.length]].filter(Boolean).map((z) => z.id)), problems = [], shots = []; let okZones = 0;
  const q0 = await ev('window.__game.quests.main[0] && { status: window.__game.quests.main[0].status, stage: window.__game.quests.main[0].stage, steps: (window.__game.quests.main[0].steps || []).length, at: window.__game.quests.main[0].steps && window.__game.quests.main[0].steps[0] && window.__game.quests.main[0].steps[0].at }');
  say('quests.main[0]: ' + JSON.stringify(q0));
  for (const z of zs) {
    const r = await D.tryEval(p, `Promise.resolve(window.__game.actions.travel(${JSON.stringify(z.map)})).then(v => v, e => 'threw ' + e)`, 'threw', { timeout: 6000 });
    let at = null; for (let i = 0; i < 30; i++) { at = await ev('window.__game.player.map'); if (at === z.map) break; await D.wait(60); }
    if (r === false || at !== z.map) { problems.push(`${z.id}: travel('${z.map}') returned ${r}, the player is on ${at}`); continue; }
    await D.wait(200);
    const s = await ev(`(() => { const g = window.__game, z = g.world.zones.find(z => z.id === ${JSON.stringify(z.id)}), m = g.maps.find(m => m.name === z.map); if (!m) return { bad: ['no map named ' + z.map + ' in maps'] };
      const W = m.width, H = m.height, free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !g.blocked(x, y), q = g.player, bad = [];
      if (W * H < 300) bad.push('map only ' + W + 'x' + H);
      const seen = new Set([q.x + ',' + q.y]), todo = [[q.x, q.y]];
      while (todo.length) { const [x, y] = todo.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (free(x + dx, y + dy) && !seen.has(k)) { seen.add(k); todo.push([x + dx, y + dy]); } } }
      for (const d of ['north', 'east', 'south', 'west']) { const e = (z.exits || {})[d]; if (!e) continue;
        if (!free(e.x, e.y)) bad.push(d + ' exit ' + e.x + ',' + e.y + ' blocked or off the map'); else if (!seen.has(e.x + ',' + e.y)) bad.push(d + ' exit not reachable on foot from where travel() put the player');
        if (e.x === q.x && e.y === q.y) bad.push('travel() put the player on the ' + d + ' exit'); }
      if (!Object.values(z.exits || {}).some(Boolean)) bad.push('no exits');
      for (const n of (g.npcs || []).filter(n => n.zone === z.id)) if (n.map !== z.map || !g.blocked(n.x, n.y)) bad.push(n.id + ' is not on a blocked tile of this map');
      let nb = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.blocked(x, y)) nb++;
      return { bad, size: W + 'x' + H, blocked: Math.round(100 * nb / (W * H)), visited: z.visited }; })()`, { bad: ['could not be read'] });
    if (s.bad.length) problems.push(`${z.id}: ${s.bad.slice(0, 3).join('; ')}`); else okZones++;
    if (pick.has(z.id)) { const f = shotFile.replace(/\.png$/, '') + `-zone-${z.id}.png`; await D.wait(300); try { await D.screenshot(p, f); shots.push(`${z.id} (${z.biome}, ${s.size || '?'}, ${s.blocked ?? '?'} % blocked): ${f}`); } catch { /* no shot */ } }
  }
  say(`zones: travel() to ${zs.length}, ${okZones} without a problem (map size, exits free and reachable on foot, people on blocked tiles)`);
  for (const t of problems.slice(0, 12)) say('  ' + t.slice(0, 220));
  if (problems.length > 12) say(`  ... and ${problems.length - 12} more zones with problems`);
  for (const t of shots) say('zone screenshot: ' + t);
  const errs3 = [...new Set(p.errors.filter((e) => !/favicon\.ico/.test(e)))];
  if (errs3.length) { say(`errors by now (${errs3.length}):`); for (const e of errs3.slice(0, 6)) say('  ' + e.slice(0, 240)); }
}
try {
  b = await D.launch({ width: 1024, height: 768 });
  const p = await D.openPage(b, url, { timeout: 15000 });
  await D.wait(3000);
  const ev = (e, fb = null) => D.tryEval(p, `(() => { try { return (${e}); } catch (err) { return null; } })()`, fb, { timeout: 8000 });
  PAGE = p; EV = ev;

  const errs = [...new Set(p.errors.filter((e) => !/favicon\.ico/.test(e)))];
  say(errs.length ? `ERRORS (${errs.length}):` : 'errors: none');
  for (const e of errs.slice(0, 10)) say('  ' + e.slice(0, 240));
  const ext = p.requests.filter((r) => !/^(https?:\/\/(127\.0\.0\.1|localhost)[:/]|data:|blob:|about:|chrome)/.test(r));
  if (ext.length) say('network requests outside this folder: ' + ext.slice(0, 3).join(' '));

  const need = ['player', 'player.x', 'player.y', 'player.map', 'inventory', 'dialogueOpen', 'lastMessage', 'maps', 'landmarks.door',
    'landmarks.exit', 'landmarks.npc', 'landmarks.water', 'landmarks.items', 'blocked', 'ui.up', 'ui.down', 'ui.left', 'ui.right', 'ui.a',
    'ui.b', 'actions.move', 'actions.pressA', 'actions.pressB'];
  if (round === 'R2' || round === 'R3' || round === 'R4') need.push('party', 'battle', 'menuOpen', 'menuOptions', 'landmarks.grass', 'ui.start', 'actions.pressStart',
    'actions.save', 'actions.load', 'actions.grantXp');
  if (round === 'R3' || round === 'R4') need.push('quest', 'quest.stage', 'quest.done', 'quest.log', 'landmarks.toForest', 'landmarks.toTown', 'landmarks.giver',
    'landmarks.helper', 'landmarks.keeper', 'landmarks.cemetery', 'landmarks.chest', 'landmarks.crypt', 'landmarks.cryptExit', 'landmarks.boss',
    'landmarks.forestGrass', 'actions.useItem', 'actions.startBattle', 'actions.setEncounters');
  if (round === 'R4') need.push('world', 'world.zones', 'bestiary', 'catalog', 'npcs', 'quests', 'quests.main', 'quests.side', 'gold', 'won', 'credits', 'party.0.ac',
    'party.0.attack', 'party.0.equipment', 'actions.travel', 'actions.forceBattle', 'actions.winBattle', 'actions.addItem', 'actions.addGold', 'actions.equip',
    'actions.unequip', 'actions.buy', 'actions.sell');
  const has = await ev('!!window.__game', false);
  if (!has) say('window.__game: MISSING');
  else {
    const miss = await ev(`${JSON.stringify(need)}.filter(k => { let o = window.__game; for (const s of k.split('.')) { if (o == null || !(s in Object(o))) return true; o = o[s]; } return k === 'battle' ? o === undefined : o == null; })`, need);   // battle may be null outside a fight
    say(miss.length ? `window.__game: missing or null ${miss.join(', ')}` : 'window.__game: every field named in BRIEF.md is present');
  }

  if (has && (round === 'R3' || round === 'R4')) say('maps: ' + (await ev((round === 'R4' ? 'window.__game.maps.length + " maps"' : 'window.__game.maps.map(m => m.name + " " + m.width + "x" + m.height).join(", ")'), '?')) +
    '; quest stage ' + (await ev('window.__game.quest.stage', '?')) + '; inventory ' + (await ev('JSON.stringify(window.__game.inventory)', '?')));

  const rect = await ev('(() => { const c = document.querySelector("canvas"); if (!c) return null; const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()');
  const shot = await D.screenshot(p, shotFile);
  if (!rect || rect.w < 1) say('canvas: none on the page');
  else {
    const img = decodePng(shot), counts = new Map();
    const x0 = Math.max(0, Math.floor(rect.x)), y0 = Math.max(0, Math.floor(rect.y)), x1 = Math.min(img.w, Math.floor(rect.x + rect.w)), y1 = Math.min(img.h, Math.floor(rect.y + rect.h));
    let n = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
      const o = y * img.w * img.bpp + x * img.bpp, k = (img.px[o] << 16) | (img.px[o + 1] << 8) | img.px[o + 2];
      counts.set(k, (counts.get(k) || 0) + 1); n++;
    }
    const top = Math.max(...counts.values());
    say(`canvas: ${Math.round(rect.w)}x${Math.round(rect.h)} px on the page; ${(100 * (1 - top / n)).toFixed(1)} % of it differs from its most common colour (${counts.size} colours)` +
      (1 - top / n < 0.05 ? '  <- looks blank' : ''));
  }

  if (has && (await ev('typeof window.__game.actions?.move === "function"', false))) {
    const pos = () => ev('(() => { const q = window.__game.player; return q ? { x: q.x, y: q.y, map: q.map } : null; })()');
    const before = await pos();
    const r = await D.tryEval(p, `Promise.resolve(window.__game.actions.move('right', 1)).then(() => 'ok', e => 'rejected: ' + e)`, 'threw', { timeout: 8000 });
    await D.wait(1000);
    const after = await pos();
    say(`move('right', 1): ${JSON.stringify(before)} -> ${JSON.stringify(after)}${r && r !== 'ok' ? ' (' + r + ')' : ''}`);
    const errs2 = [...new Set(p.errors.filter((e) => !/favicon\.ico/.test(e)))].filter((e) => !errs.includes(e));
    for (const e of errs2.slice(0, 5)) say('  new error after the move: ' + e.slice(0, 240));
  }
  say(`screenshot: ${shotFile}`);
  if (has && round === 'R4') await round4();
} catch (e) {
  say('selftest: could not load the page: ' + String(e.message || e).slice(0, 200));
} finally {
  if (b) await D.close(b).catch(() => {});
  clearTimeout(hardStop);
}
console.log(out.join('\n'));
process.exit(0);
