// harness.mjs - serves a game folder, opens it in headless Chromium (driver.mjs: Chrome DevTools Protocol, no dependencies) and
// gives every test a `t`: real keys, the hook, what is drawn. Node built-ins only.
//
// How a test may touch the game (README.md, "The rules of a test"):
//   keys      t.A() t.B() t.START() t.arrow(dir)      real key events through the browser, as a player's fingers
//   the hook  t.ev('window.__game. ...')             to READ state, and to SET UP a state (travel, addItem, addGold, grantXp, save)
//   the view  t.texts() / T.lines() / T.sees()       the texts Phaser draws right now, with their boxes
//   adapter   TA.* (lib/adapter.mjs)                 the few internals, for set-ups only
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as D from './driver.mjs';
import { ADAPTER, BOOTED } from './adapter.mjs';

/** the keys of the game (README of the game: arrows move, Space or Z is A, Escape or X is B, Enter is START) */
export const KEY = { A: 'Space', B: 'Escape', START: 'Enter', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
export const VIEW = { w: 256, h: 192, map: 144, box: 140 };   // the canvas; the map view is its top 144 rows, the status strip the rest
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png',
  '.md': 'text/plain', '.txt': 'text/plain', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.css': 'text/css', '.svg': 'image/svg+xml' };

/** Serve a folder on a free local port. Returns { url, port, close() }. */
export async function serve(dir) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    const f = path.join(root, decodeURIComponent(req.url.split(/[?#]/)[0]));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  return { port, url: `http://127.0.0.1:${port}/index.html`, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }) };
}

// ---------------------------------------------------------------------------------------------------------------------------
// In-page helpers: window.T. Reading uses the hook and the drawn texts; set-ups use hook actions; TA is the adapter.
const HELPERS = `window.T = {
  sleep: ms => new Promise(r => setTimeout(r, ms)),
  async until(test, ms = 3000) { const t0 = performance.now(); while (performance.now() - t0 < ms) { let v = false; try { v = test(); } catch (e) {} if (v) return v; await T.sleep(10); } return false; },
  squash: s => String(s).toLowerCase().replace(/[^a-z0-9]/g, ''),

  // ---- what is drawn (Phaser only; never reads the hook) ----
  scenes() { return window.game.scene.getScenes(true); },
  texts() { const out = [], walk = (o, key, depth) => { if (!o.visible || o.alpha === 0) return;
      if (o.type === 'Container') { for (const c of o.list) walk(c, key, o.depth); return; }
      if (o.type === 'Text' && o.text.trim()) { const b = o.getBounds(); out.push({ scene: key, text: o.text, depth: depth ?? o.depth, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }); } };
    for (const s of T.scenes()) for (const o of s.children.list) walk(o, s.sys.settings.key);
    return out; },
  lines() { return T.texts().flatMap(t => t.text.split('\\n')).map(s => s.trimEnd()).filter(s => s.trim()); },
  seen() { return T.texts().map(t => t.text).join('\\n'); },
  sees(re) { return T.lines().some(l => re.test(l)); },
  marked() { return T.lines().filter(l => /^\\s*>/.test(l)).map(l => l.replace(/^\\s*>\\s*/, '').trim()); },   // the rows a cursor points at
  // two texts of the same layer that lie over each other (a box drawn over an older screen hides it: other layers are not compared)
  overlaps() { const t = T.texts(), bad = [];
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) { const a = t[i], b = t[j];
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (a.depth === b.depth && w > 2 && h > 2) bad.push(JSON.stringify(a.text.slice(0, 24)) + ' over ' + JSON.stringify(b.text.slice(0, 24))); }
    return bad; },
  offscreen() { const W = window.game.scale.width, H = window.game.scale.height;
    return T.texts().filter(a => a.scene === 'UI' && (a.x < 0 || a.y < 0 || a.x + a.w > W || a.y + a.h > H)).map(a => JSON.stringify(a.text.slice(0, 24)) + ' at ' + a.x + ',' + a.y + ' size ' + a.w + 'x' + a.h); },
  // texts of the view that run below the text area: every box of the view (dialogue, menu, shop, battle log) ends at y ${VIEW.box}
  spills() { return T.texts().filter(a => a.scene === 'UI' && a.y < ${VIEW.map} && a.y + a.h > ${VIEW.box} + 1).map(a => JSON.stringify(a.text.slice(0, 24)) + ' ends at y ' + (a.y + a.h) + ', below its box'); },
  // the pictures drawn right now: [{ scene, key, frame, x, y, w, h, scale, depth }] (x, y = the top left corner on the canvas of its scene)
  sprites() { const out = [], walk = (o, key, depth) => { if (!o.visible || o.alpha === 0) return;
      if (o.type === 'Container') { for (const c of o.list) walk(c, key, o.depth); return; }
      if (o.type === 'Sprite' || o.type === 'Image') { const b = o.getBounds(); out.push({ scene: key, key: o.texture.key, frame: o.frame.name, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), cx: o.x, cy: o.y, scale: o.scaleX, depth: depth ?? o.depth }); } };
    for (const s of T.scenes()) for (const o of s.children.list) walk(o, s.sys.settings.key);
    return out; },
  // the title is up when a drawn line is exactly one of its entries (the game need not expose anything)
  onTitle() { return T.lines().some(l => /^(press start|continue|new game)$/.test(l.replace(/^\\s*>\\s*/, '').replace(/\\s+/g, ' ').trim().toLowerCase())) ||
    T.texts().some(t => /^press\\s+start$/i.test(t.text.trim())); },

  // ---- the hook, read ----
  g: () => window.__game,
  hero: () => window.__game.party[0],
  state() { const g = window.__game, h = g.party[0], b = g.battle, q = g.player;
    return { map: q.map, x: q.x, y: q.y, facing: q.facing, dialogue: !!g.dialogueOpen, page: g.lastMessage, menu: !!g.menuOpen, shop: g.shop ? g.shop.npc || true : null,
      battle: !!(b && b.active), result: b ? b.result : null, foe: b && b.enemy ? { id: b.enemy.id, name: b.enemy.name, hp: b.enemy.hp, maxHp: b.enemy.maxHp } : null,
      log: b && b.log ? b.log.length : 0, hp: h.hp, maxHp: h.maxHp, level: h.level, xp: h.xp, ac: h.ac, gold: g.gold, won: !!g.won, idle: TA.idle() }; },
  has(name) { return window.__game.inventory.filter(n => n === name).length; },

  // ---- the hook, set-up (never the thing under test) ----
  async idle(ms = 5000) { return !!(await T.until(() => TA.idle(), ms)); },
  async go(map, x, y) { const r = x == null ? window.__game.actions.travel(map) : window.__game.actions.travel(map, x, y);
    if (r !== true) throw new Error('set-up: travel(' + [map, x, y].filter(v => v != null).join(', ') + ') returned ' + r);
    if (!(await T.until(() => TA.idle() && window.__game.player.map === map, 5000))) throw new Error('set-up: after travel to ' + map + ' the game never became idle there');
    await T.sleep(30); return true; },
  portals(map) { const g = window.__game, out = new Set(), L = g.landmarks || {};
    for (const z of (g.world && g.world.zones) || []) if (z.map === map) for (const e of Object.values(z.exits || {})) if (e) out.add(e.x + ',' + e.y);
    for (const k of ['door', 'exit', 'toForest', 'toTown', 'crypt', 'cryptExit']) if (L[k] && L[k].map === map) out.add(L[k].x + ',' + L[k].y);
    return out; },
  // stand on a free tile beside a thing: { x, y, dir } with dir = the way to face it. Uses travel (a set-up).
  async standBy(at) { const g = window.__game;
    if (!at || at.map == null) throw new Error('set-up: the target has no place (at = ' + JSON.stringify(at) + ')');
    if (g.player.map !== at.map) await T.go(at.map);
    const ports = T.portals(at.map), opts = [['up', 0, 1], ['down', 0, -1], ['left', 1, 0], ['right', -1, 0]];
    for (const pass of [0, 1]) for (const [dir, dx, dy] of opts) { const x = at.x + dx, y = at.y + dy;
      if (g.blocked(x, y) || (pass === 0 && ports.has(x + ',' + y))) continue;
      await T.go(at.map, x, y); return { x, y, dir }; }
    throw new Error('no free tile next to ' + at.map + ' ' + at.x + ',' + at.y); },
  // the tiles that can be walked to from x, y on the current map (hook blocked())
  reach(x, y) { const g = window.__game, m = g.maps.find(m => m.name === g.player.map), seen = new Set([x + ',' + y]), todo = [[x, y]];
    while (todo.length) { const [cx, cy] = todo.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= m.width || ny >= m.height || seen.has(k) || g.blocked(nx, ny)) continue; seen.add(k); todo.push([nx, ny]); } }
    return seen; },
  // close whatever is open, through the hook; a battle is ended with winBattle (set-up only)
  shut() { const g = window.__game, a = g.actions;
    for (let i = 0; i < 400; i++) { if (g.dialogueOpen) a.pressA(); else if (g.shop) a.pressB(); else if (g.battle && g.battle.active) { if (!a.winBattle()) a.pressA(); }
      else if (g.menuOpen) a.pressB(); else return true; } return false; },
  // set-up play through the hook: face a thing, press A, read every page; fights end at once (winBattle) unless fight = false
  async hookPress(at, fight = true) { const g = window.__game, s = await T.standBy(at); await g.actions.move(s.dir, 1); await T.sleep(20);
    g.actions.pressA(); await T.sleep(20); const pages = [];
    for (let i = 0; i < 200; i++) { if (g.dialogueOpen) { pages.push(g.lastMessage); g.actions.pressA(); await T.sleep(5); }
      else if (g.battle && g.battle.active) { if (!fight) break; g.actions.winBattle(); await T.sleep(20); } else if (!TA.idle()) await T.sleep(20); else break; }
    return pages; },
  quest(kind, i) { return window.__game.quests[kind][i]; },
  // set-up: play quest kind/i through the hook from its current stage up to (not including) step upto (default: to the end)
  async hookPlay(kind, i, upto) { const q = () => T.quest(kind, i), end = upto == null ? q().steps.length : upto;
    for (let k = q().stage; k < end; k++) { const st = q().steps[k]; await T.hookPress(st.at); T.shut();
      if (q().stage !== k + 1) throw new Error('set-up: quest ' + q().id + ' step ' + (k + 1) + ' (' + st.type + ') did not advance through the hook (stage ' + q().stage + ')'); }
    return true; },
};`;

function decodePng(buf) {   // 8-bit RGB/RGBA, non-interlaced (Chromium screenshots)
  let q = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (q < buf.length) { const len = buf.readUInt32BE(q), type = buf.toString('ascii', q + 4, q + 8), data = buf.subarray(q + 8, q + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; } else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    q += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), o = y * stride;
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? px[o + x - bpp] : 0, c2 = y ? px[o - stride + x] : 0, c = x >= bpp && y ? px[o - stride + x - bpp] : 0; let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += c2; else if (f === 3) v += (a + c2) >> 1;
      else if (f === 4) { const pa = Math.abs(c2 - c), pb = Math.abs(a - c), pc = Math.abs(a + c2 - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? c2 : c; }
      px[o + x] = v & 255; } }
  return { w, h, bpp, px };
}
/** distance of two colour signatures (t.signature): 0 = the same colours, 1 = no colour shared */
export const sigDist = (a, c) => { let d = 0; for (let i = 0; i < 512; i++) d += Math.abs(a.hist[i] - c.hist[i]); return d / 2; };

const IGNORE = [/favicon/];
const short = (errs) => [...new Set(errs)].slice(0, 4).join(' | ').slice(0, 900);

/** One browser with one page on a served game folder. `await Session.start(dir)`, then s.t is the test context. */
export class Session {
  static async start(dir, { viewport = { width: 1024, height: 768 } } = {}) {
    const s = new Session();
    s.dir = path.resolve(dir);
    if (!fs.existsSync(path.join(s.dir, 'index.html'))) throw new Error(`no index.html in ${s.dir}`);
    s.server = await serve(s.dir);
    s.browser = await D.launch(viewport);
    s.page = null; s.errMark = 0;
    s.t = s.context();
    return s;
  }
  errors() { return this.page ? this.page.errors.filter((e) => !IGNORE.some((re) => re.test(e))) : []; }
  /** console errors since the last call */
  newErrors() { const all = this.errors(), out = all.slice(this.errMark); this.errMark = all.length; return out; }
  async close() { if (this.browser) await D.close(this.browser).catch(() => {}); if (this.server) await this.server.close(); this.browser = this.server = null; }

  context() {
    const s = this;
    const t = {
      D, dir: s.dir, url: s.server.url, notes: [], data: {},
      /** evaluate a JS expression in the page (promises are awaited); returns its value as JSON */
      ev: (expr, timeout = 60000) => D.evaluate(s.page, `(async () => (${expr}))()`, { timeout }),
      must(cond, msg) { if (!cond) throw new Error(msg); },
      eq(got, want, what) { if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${what}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`); },
      note(s2) { t.notes.push(String(s2)); },
      /** (re)load the page and wait until the game runs. clear = empty localStorage first (a new game).
       *  The title stays as the game shows it: nothing here reads window.__game. */
      async open({ clear = true, query = '' } = {}) {
        const url = s.server.url + (query ? '?' + query : '');
        if (!s.page) s.page = await D.openPage(s.browser, url, { timeout: 20000 }); else await D.navigate(s.page, url, 20000);
        if (clear) { await D.tryEval(s.page, 'localStorage.clear()'); await D.navigate(s.page, url, 20000); }
        const ok = await D.waitFor(s.page, BOOTED, 10000);
        if (!ok) throw new Error('the game did not start within 10 s' + (s.errors().length ? '; page errors: ' + short(s.errors()) : '; no page error: is a script tag missing or out of order?'));
        await D.wait(200); await D.evaluate(s.page, ADAPTER); await D.evaluate(s.page, HELPERS); },
      /** a new game, past the title as a player gets past it: START until the title is gone */
      async play(opts) { await t.open(opts); await t.pastTitle(); await t.readAll(); },   // readAll: an intro told in dialogue pages
      async pastTitle() { for (let i = 0; i < 4 && (await t.ev('T.onTitle()')); i++) { await t.START(); await sleep(150); }
        if (await t.ev('T.onTitle()')) throw new Error('START does not leave the title screen');
        await t.ev('T.idle()'); },
      // ---- real keys ----
      async key(name, hold = 45, after = 60) { await D.press(s.page, name, hold); await sleep(after); },
      A: (after) => t.key(KEY.A, 45, after), B: (after) => t.key(KEY.B, 45, after), START: (after) => t.key(KEY.START, 45, after),
      /** one tap of an arrow: one step on the map (or a turn towards a blocked tile), one row in a list. Lists take a move every 170 ms. */
      async arrow(dir, after = 200) {
        const before = await t.ev(`(() => { const q = window.__game.player; return q.x + ',' + q.y + ',' + q.map + ',' + q.facing; })()`);
        await D.keyDown(s.page, KEY[dir]);
        const t0 = Date.now(); let moved = false;
        while (Date.now() - t0 < 110) { await sleep(12); const now = await t.ev(`(() => { const q = window.__game.player; return q.x + ',' + q.y + ',' + q.map + ',' + q.facing; })()`); if (now !== before) { moved = true; break; } }
        await D.keyUp(s.page, KEY[dir]);
        await sleep(after); return moved; },
      /** walk n tiles with the arrow key, waiting for every step to end */
      async walk(dir, n = 1) { for (let i = 0; i < n; i++) { await t.arrow(dir, 60); await t.ev('T.idle(2000)'); } },
      // ---- reading ----
      state: () => t.ev('T.state()'),
      texts: () => t.ev('T.texts()'),
      lines: () => t.ev('T.lines()'),
      sees: (re) => t.ev(`T.sees(${re})`),
      /** move a list cursor (the row that starts with '>') until its row matches `re`; true when it does. dir: the arrow to tap. */
      async cursorTo(re, { max = 60, dir = 'down' } = {}) {
        for (let i = 0; i <= max; i++) { if (await t.ev(`T.marked().some(l => ${re}.test(l))`)) return true; await t.arrow(dir, 200); }
        return false; },
      /** open the Start menu with START and move the cursor to an entry, e.g. 'Items' */
      async menu(entry) { if (!(await t.ev('window.__game.menuOpen'))) { await t.START(150); }
        if (!(await t.ev('window.__game.menuOpen'))) throw new Error('START did not open the menu');
        if (entry && !(await t.cursorTo(new RegExp('^' + entry + '\\b', 'i'), { max: 12 }))) throw new Error(`the menu has no entry "${entry}" under the cursor after 12 moves (marked rows: ${JSON.stringify(await t.ev('T.marked()'))})`); },
      /** press A through whatever dialogue is open; returns the pages read. Stops when no dialogue is open. */
      async readAll(max = 80) { const pages = [];
        for (let i = 0; i < max; i++) { const st = await t.state(); if (!st.dialogue) { if (st.idle || st.battle || st.menu || st.shop) break; await sleep(40); continue; } pages.push(st.page); await t.A(50); }
        return pages; },
      // ---- pictures ----
      shot: (file) => D.screenshot(s.page, file),
      /** one screenshot: at(x, y) = the colour [r, g, b] of canvas pixel x, y (the canvas is 256 x 192) */
      async grab() {
        const r = await D.evaluate(s.page, `(() => { const b = document.querySelector('canvas').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; })()`);
        const img = decodePng(await D.screenshot(s.page)), k = r.w / VIEW.w;
        return { at(x, y) { const sx = Math.min(img.w - 1, Math.floor(r.x + (x + 0.5) * k)), sy = Math.min(img.h - 1, Math.floor(r.y + (y + 0.5) * k)), o = (sy * img.w + sx) * img.bpp; return [img.px[o], img.px[o + 1], img.px[o + 2]]; } }; },
      /** the share of canvas pixels of a box [x, y, w, h] for which test([r, g, b]) holds */
      async share(box, test) { const g = await t.grab(), [x0, y0, w, h] = box; let n = 0, k = 0;
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { k++; if (test(g.at(x, y))) n++; } return k ? n / k : 0; },
      /** the share of pixels of a box that change between two screenshots ms apart */
      async motion(box, ms = 400) { const a = await t.grab(); await sleep(ms); const b = await t.grab(), [x0, y0, w, h] = box; let n = 0, k = 0;
        for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { k++; const p = a.at(x, y), q = b.at(x, y); if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) > 24) n++; } return k ? n / k : 0; },
      /** colour make-up of a part of the canvas (fractions 0..1): hist = 512 shares, flat = the largest, distinct = colours over 0.2 %, sd = spread of brightness */
      async signature(x0 = 0, y0 = 0, x1 = 1, y1 = 1) {
        const r = await D.evaluate(s.page, `(() => { const c = document.querySelector('canvas'); if (!c) return null; const b = c.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; })()`);
        if (!r || r.w < 8) return null;
        const img = decodePng(await D.screenshot(s.page)), hist = new Array(512).fill(0); let k = 0, sum = 0, s2 = 0;
        for (let y = Math.max(0, Math.ceil(r.y + r.h * y0)); y < Math.min(img.h, Math.floor(r.y + r.h * y1)); y += 3) for (let x = Math.max(0, Math.ceil(r.x + r.w * x0)); x < Math.min(img.w, Math.floor(r.x + r.w * x1)); x += 3) {
          const o = (y * img.w + x) * img.bpp, R = img.px[o], G = img.px[o + 1], B = img.px[o + 2], L = 0.299 * R + 0.587 * G + 0.114 * B;
          hist[((R >> 5) << 6) | ((G >> 5) << 3) | (B >> 5)]++; sum += L; s2 += L * L; k++; }
        const n = k || 1; for (let i = 0; i < 512; i++) hist[i] /= n;
        return { hist, flat: Math.max(...hist), bins: hist.filter((v) => v > 0.01).length, distinct: hist.filter((v) => v > 0.002).length, sd: Math.sqrt(Math.max(0, s2 / n - (sum / n) ** 2)) }; },
      page: () => s.page, errors: () => s.errors(),
    };
    return t;
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// The game's data, read from disk: the truth the suite checks the game against.
export function loadData(dir) {
  const j = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const opt = (f) => (fs.existsSync(path.join(dir, f)) ? j(f) : null);
  const world = j('data/world.json'), monsters = j('data/srd/monsters.json').monsters, items = j('data/srd/items.json').items, rules = j('data/srd/rules.json');
  const sprites = opt('data/sprites.json'), defeat = opt('data/defeat.json');
  const attribution = fs.existsSync(path.join(dir, 'data/srd/ATTRIBUTION.md')) ? fs.readFileSync(path.join(dir, 'data/srd/ATTRIBUTION.md'), 'utf8') : '';
  const mon = Object.fromEntries(monsters.map((m) => [m.id, m])), item = Object.fromEntries(items.map((i) => [i.id, i]));
  const thing = { ...Object.fromEntries((world.quest_items || []).map((i) => [i.id, i])), ...item };
  const quests = [...world.quests.main.map((q, i) => ({ ...q, kind: 'main', index: i })), ...world.quests.side.map((q, i) => ({ ...q, kind: 'side', index: i }))];
  const nameOf = (id) => (thing[id] ? thing[id].name : id);
  return { dir, world, monsters, items, rules, sprites, defeat, attribution, mon, item, thing, quests, nameOf };
}
