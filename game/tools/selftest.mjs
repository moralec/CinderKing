// selftest.mjs <url> <shot.png> <round R1|R2|R3> -- facts about the page, for the agent building it (run through ../selftest.py).
// Loads the page in headless Chromium (./driver.mjs), waits ~3 s, prints: page exceptions / console errors, which window.__game fields
// from BRIEF.md are missing, how much of the canvas is drawn (not one flat colour), the player before/after actions.move('right', 1),
// and a screenshot path. Facts only: it does not test the game's requirements.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const D = await import(pathToFileURL(path.join(HERE, 'driver.mjs')).href);
const [url, shotFile, round] = process.argv.slice(2);
const out = [];
const say = (s) => out.push(s);
const hardStop = setTimeout(() => { console.log(out.join('\n') + '\nselftest: gave up after 35 s (the page hangs?)'); process.exit(3); }, 35000);

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

let b;
try {
  b = await D.launch({ width: 1024, height: 768 });
  const p = await D.openPage(b, url, { timeout: 15000 });
  await D.wait(3000);
  const ev = (e, fb = null) => D.tryEval(p, `(() => { try { return (${e}); } catch (err) { return null; } })()`, fb, { timeout: 8000 });

  const errs = [...new Set(p.errors.filter((e) => !/favicon\.ico/.test(e)))];
  say(errs.length ? `ERRORS (${errs.length}):` : 'errors: none');
  for (const e of errs.slice(0, 10)) say('  ' + e.slice(0, 240));
  const ext = p.requests.filter((r) => !/^(https?:\/\/(127\.0\.0\.1|localhost)[:/]|data:|blob:|about:|chrome)/.test(r));
  if (ext.length) say('network requests outside this folder: ' + ext.slice(0, 3).join(' '));

  const need = ['player', 'player.x', 'player.y', 'player.map', 'inventory', 'dialogueOpen', 'lastMessage', 'maps', 'landmarks.door',
    'landmarks.exit', 'landmarks.npc', 'landmarks.water', 'landmarks.items', 'blocked', 'ui.up', 'ui.down', 'ui.left', 'ui.right', 'ui.a',
    'ui.b', 'actions.move', 'actions.pressA', 'actions.pressB'];
  if (round === 'R2' || round === 'R3') need.push('party', 'battle', 'menuOpen', 'menuOptions', 'landmarks.grass', 'ui.start', 'actions.pressStart',
    'actions.save', 'actions.load', 'actions.grantXp');
  if (round === 'R3') need.push('quest', 'quest.stage', 'quest.done', 'quest.log', 'landmarks.toForest', 'landmarks.toTown', 'landmarks.giver',
    'landmarks.helper', 'landmarks.keeper', 'landmarks.cemetery', 'landmarks.chest', 'landmarks.crypt', 'landmarks.cryptExit', 'landmarks.boss',
    'landmarks.forestGrass', 'actions.useItem', 'actions.startBattle', 'actions.setEncounters');
  const has = await ev('!!window.__game', false);
  if (!has) say('window.__game: MISSING');
  else {
    const miss = await ev(`${JSON.stringify(need)}.filter(k => { let o = window.__game; for (const s of k.split('.')) { if (o == null || !(s in Object(o))) return true; o = o[s]; } return k === 'battle' ? o === undefined : o == null; })`, need);   // battle may be null outside a fight
    say(miss.length ? `window.__game: missing or null ${miss.join(', ')}` : 'window.__game: every field named in BRIEF.md is present');
  }

  if (has && round === 'R3') say('maps: ' + (await ev('window.__game.maps.map(m => m.name + " " + m.width + "x" + m.height).join(", ")', '?')) +
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
} catch (e) {
  say('selftest: could not load the page: ' + String(e.message || e).slice(0, 200));
} finally {
  if (b) await D.close(b).catch(() => {});
  clearTimeout(hardStop);
}
console.log(out.join('\n'));
process.exit(0);
