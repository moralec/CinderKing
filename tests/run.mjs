#!/usr/bin/env node
// run.mjs - The Cinder King's own test suite: is this build a game a player can finish?
//
//   node tests/run.mjs [game dir] [--only story,ui,...] [--skip id,id] [--must id,id] [--strict] [--fast]
//                      [--fights N] [--json FILE] [--shots DIR] [--checker DIR] [--calibrate] [--list]
//
//   game dir    the folder with index.html (default: ../game beside this folder). It is served here, on a free local port,
//               and opened in headless Chromium (/usr/bin/chromium, or the env Q1_CHROMIUM). Nothing stays running.
//   --only      parts (data, credits, ui, story, balance, engine) or id prefixes (ui.items, balance.boss.2)
//   --skip      ids or prefixes left out
//   --must      ids or prefixes that must PASS even if expected-failures.json lists them (the gate of the step that builds them)
//   --strict    every test must pass: expected failures count as failures (the gate of a finished round)
//   --fast      leaves out the slow tests (the R4 engine check, about 10 minutes) and stops a simulation early
//   --fights N  fights per boss in the balance simulation (default 400)
//   --json      write every result, with the balance table, to FILE
//   --shots     save a screenshot to DIR when a test fails
//   --checker   the folder of the R4 checker (check_game.mjs + task-r4/data); default: found beside this repo, else the test is skipped
//   --calibrate also run the simulation with the v0.5 review's levels and gear (README, "Calibration")
//
// Lines: PASS / FAIL / XFAIL (fails, and expected-failures.json says why) / XPASS (listed there, but passes: remove it) / SKIP.
// Exit 0 = no FAIL (with --strict: no XFAIL either). The last line is `SUMMARY {json}`.
// Node 22+ built-ins only; the browser driver is lib/driver.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Session, loadData } from './lib/harness.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PARTS = ['data', 'credits', 'ui', 'story', 'balance', 'engine'];
const argv = process.argv.slice(2);
const VAL = new Set(['--only', '--skip', '--must', '--fights', '--json', '--shots', '--checker']);
const opt = {}, rest = [];
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (VAL.has(a)) opt[a.slice(2)] = argv[++i]; else if (a.startsWith('--')) opt[a.slice(2)] = true; else rest.push(a); }
const csv = (s) => (typeof s === 'string' ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
const hits = (id, pats) => pats.some((p) => id === p || id.startsWith(p + '.') || id.split('.')[0] === p);
const GAME = path.resolve(rest[0] || path.join(HERE, '..', 'game'));
const ONLY = csv(opt.only), SKIP = csv(opt.skip), MUST = csv(opt.must);
if (opt.help || opt.h) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n')); process.exit(0); }
if (!fs.existsSync(path.join(GAME, 'index.html'))) { console.error(`no index.html in ${GAME}\nusage: node tests/run.mjs <game dir> [--only story,ui,...]`); process.exit(2); }

const EXPECTED = JSON.parse(fs.readFileSync(path.join(HERE, 'expected-failures.json'), 'utf8')).expected || {};
class Skip extends Error {}
const tests = [];
let part = null;
const suite = {
  /** register a test. fn(t, ctx) may return a note. opts: { needs: id that must have passed, timeout: ms, slow: true } */
  test(id, what, fn, opts = {}) { if (!id.startsWith(part + '.')) throw new Error(`test id ${id} must start with ${part}.`); tests.push({ id, part, what, fn, opts }); },
  skip(why) { throw new Skip(why); },
};
const ctx = { dir: GAME, data: loadData(GAME), args: opt, here: HERE, shared: {}, skip: suite.skip, fights: Math.max(20, parseInt(opt.fights || '400', 10)) };
for (const p of PARTS) { part = p; (await import(`./${p}.mjs`)).default(suite, ctx); }

const chosen = tests.filter((x) => (!ONLY.length || hits(x.id, ONLY)) && !hits(x.id, SKIP) && !(opt.fast && x.opts.slow));
if (opt.list) { for (const x of tests) console.log(`${x.id.padEnd(28)} ${EXPECTED[x.id] ? 'XFAIL ' : '      '}${x.what}`); process.exit(0); }
// the tests a chosen test builds on run too (a chapter needs the chapters before it)
for (let grew = true; grew;) { grew = false; for (const x of [...chosen]) if (x.opts.needs && !chosen.some((c) => c.id === x.opts.needs)) { const d = tests.find((c) => c.id === x.opts.needs); if (d) { chosen.push(d); grew = true; } } }
chosen.sort((a, b) => tests.indexOf(a) - tests.indexOf(b));

const results = [], status = {};
let session = null;
const lazy = { // a browser only when a test opens the page; a new one after a test that hung
  async get() { if (!session) session = await Session.start(GAME); return session; },
  async drop() { if (session) { const s = session; session = null; await s.close().catch(() => {}); } },
};
const PLAIN = { page: null, newErrors: () => [], t: { notes: [], data: {}, must(c, m) { if (!c) throw new Error(m); }, note(s) { this.notes.push(String(s)); } } };   // for tests that read files only
const first = (e) => String((e && e.message) || e).split('\n').slice(0, 3).join(' ').slice(0, 700);
const t0 = Date.now();
console.log(`The Cinder King test suite: ${GAME}\n${chosen.length} of ${tests.length} tests${opt.fast ? ' (fast)' : ''}${opt.strict ? ' (strict)' : ''}`);

for (const x of chosen) {
  const started = Date.now(), r = { id: x.id, part: x.part, what: x.what, status: null, note: '', error: '' };
  const exp = EXPECTED[x.id] && !hits(x.id, MUST) && !opt.strict ? EXPECTED[x.id] : null;
  if (EXPECTED[x.id]) r.expected = EXPECTED[x.id];
  if (x.opts.needs && status[x.opts.needs] !== 'PASS') { r.status = 'SKIP'; r.note = `needs ${x.opts.needs} (${status[x.opts.needs] || 'not run'})`; }
  else {
    const s = x.opts.browser === false ? PLAIN : await lazy.get().catch((e) => { r.status = 'FAIL'; r.error = 'browser: ' + first(e); return null; });
    if (s) {
      const t = s.t; t.notes = []; t.data = {}; s.newErrors();
      let timer;
      try {
        const limit = x.opts.timeout || 120000;
        const note = await Promise.race([x.fn(t, ctx), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`the test did not finish in ${limit / 1000} s`)), limit); })]);
        const errs = s.newErrors();
        if (errs.length) throw new Error('console errors on the page: ' + [...new Set(errs)].slice(0, 3).join(' | ').slice(0, 500));
        r.status = 'PASS'; r.note = [note, ...t.notes].filter(Boolean).join('; ');
      } catch (e) {
        if (e instanceof Skip) { r.status = 'SKIP'; r.note = first(e); }
        else { r.status = 'FAIL'; r.error = first(e); r.note = t.notes.join('; ');
          if (opt.shots && s.page) { try { fs.mkdirSync(opt.shots, { recursive: true }); await t.shot(path.join(opt.shots, x.id + '.png')); } catch { /* no picture */ } }
          if (/did not finish in|evaluate timeout|CDP connection closed/.test(r.error)) await lazy.drop(); }
      } finally { clearTimeout(timer); }
      if (Object.keys(t.data).length) r.data = t.data;
    }
  }
  if (r.status === 'FAIL' && exp) r.status = 'XFAIL'; else if (r.status === 'PASS' && exp) r.status = 'XPASS';
  r.ms = Date.now() - started; status[x.id] = r.status === 'XPASS' ? 'PASS' : r.status; results.push(r);
  const tag = r.expected ? ` [${[r.expected.ref, r.expected.fix].filter(Boolean).join(', ')}]` : '';
  const tail = r.status === 'PASS' ? (r.note ? `  (${r.note})` : '') : r.status === 'XPASS' ? `  passes now: remove it from expected-failures.json${tag}` :
    r.status === 'SKIP' ? `  ${r.note}` : `${tag}\n      ${r.error}${r.note ? `\n      (${r.note})` : ''}`;
  console.log(`${r.status.padEnd(5)} ${x.id.padEnd(26)} ${x.what}${tail}`);
}
await lazy.drop();

const count = (s) => results.filter((r) => r.status === s).length, ids = (s) => results.filter((r) => r.status === s).map((r) => r.id);
const summary = { game: GAME, date: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), tests: results.length,
  pass: count('PASS'), fail: count('FAIL'), xfail: count('XFAIL'), xpass: count('XPASS'), skip: count('SKIP'),
  failed: ids('FAIL'), expected_failures: ids('XFAIL'), unexpected_passes: ids('XPASS'), skipped: ids('SKIP') };
const ok = summary.fail === 0 && !(opt.strict && summary.xfail > 0);
summary.ok = ok;
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ ...summary, results }, null, 1));
console.log(`\n${ok ? 'OK' : 'NOT OK'}: ${summary.pass} pass, ${summary.fail} fail, ${summary.xfail} expected failures, ${summary.xpass} unexpected passes, ${summary.skip} skipped, in ${summary.seconds} s`);
if (summary.xfail) console.log(`to do (expected failures): ${summary.expected_failures.join(' ')}`);
console.log('SUMMARY ' + JSON.stringify(summary));
process.exit(ok ? 0 : 1);
