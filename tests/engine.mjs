// engine.mjs - the engine still does what the earlier rounds built. Two checks, neither of which measures the game's content:
//
//   engine.replay.*   rounds 1-3 again on the build as it is: the build kit's replay (lib/replay-rpg.mjs: the hook, move(dir, 2),
//   engine.drawn      the house door, the villager's pages, the menu, a battle by dice, levels, save and load, the forest edge,
//   engine.zones      the quest giver), the start screen is drawn, and one zone of every biome is drawn and looks its own.
//
//   engine.r4         the R4 checker (check_game.mjs, 25 requirements) run on a COPY of the build whose data/world.json and
//                     data/srd/ are replaced by the kit's (task-r4/data): can the engine still run another world from data?
//                     Target: at least 24 of 25. This is "engine compatibility", not the game's score: the game's own world is
//                     checked by the other parts. It needs the checker (not part of this repo): --checker DIR, the env
//                     CINDER_CHECKER, or bench/coding-semi beside this repo; without it the test is skipped. About 10 minutes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { serve, sigDist } from './lib/harness.mjs';
import { helpers, blankWhy, AREA, LOOK, SIG_MIN, PAIRS_MIN } from './lib/gate.mjs';
import { REPLAY } from './lib/replay-rpg.mjs';

export const R4_TARGET = 24;

export default function (suite, ctx) {
  const calm = (t) => t.ev('window.__game.actions.setEncounters && window.__game.actions.setEncounters(false)');

  for (const r of REPLAY) suite.test(`engine.replay.${r.id}`, `rounds 1-3 again: ${r.what}`, async (t) => {
    await t.play(); await calm(t);
    return (await r.run(t, helpers(t))) || '';
  }, { timeout: 150000 });

  suite.test('engine.drawn', 'the start screen is drawn: the map is not blank', async (t) => {
    await t.play(); await calm(t); await new Promise((r) => setTimeout(r, 500));
    const s = await t.signature(...AREA), why = blankWhy(s);
    t.must(!why, `the map is not drawn on the start screen: ${why} in the playfield`);
    return `${s.bins} colours, spread ${s.sd.toFixed(0)}`;
  });

  suite.test('engine.zones', 'one zone of every biome is drawn, and zones of different biomes look different (90 % of the pairs)', async (t) => {
    await t.play(); await calm(t);
    const H = helpers(t), zones = await t.ev('window.__game.world.zones.map(z => ({ id: z.id, biome: z.biome, map: z.map }))'), pick = new Map(), bad = [], sig = [];
    for (const z of zones) if (!pick.has(z.biome)) pick.set(z.biome, z);
    t.must(pick.size >= 2, `window.__game.world.zones lists ${zones.length} zones of ${pick.size} biomes`);
    for (const z of pick.values()) {
      const ok = await t.ev(`window.__game.actions.travel(${JSON.stringify(z.map)})`);
      if (ok === false || !(await H.until(`window.__game.player.map === ${JSON.stringify(z.map)}`, 5000))) { bad.push(`travel to ${z.id} failed`); continue; }
      await H.sleep(500);
      const w = blankWhy(await t.signature(...AREA)); if (w) { bad.push(`zone ${z.id} (${z.biome}) is not drawn: ${w}`); continue; }
      sig.push([z, await t.signature(...LOOK)]);
    }
    let pairs = 0, differ = 0; const alike = [];
    for (let i = 0; i < sig.length; i++) for (let j = i + 1; j < sig.length; j++) { pairs++; const d = sigDist(sig[i][1], sig[j][1]); if (d >= SIG_MIN) differ++; else alike.push(`${sig[i][0].biome} ~ ${sig[j][0].biome} ${d.toFixed(2)}`); }
    if (pairs && differ / pairs < PAIRS_MIN) bad.push(`zones of different biomes look alike (${differ} of ${pairs} pairs differ; ${alike.slice(0, 4).join(', ')})`);
    t.must(!bad.length, bad.join(' | '));
    return `${sig.length} biomes, ${differ}/${pairs} pairs differ`;
  }, { timeout: 180000 });

  suite.test('engine.r4', `engine compatibility: the R4 checker on a copy of the build with the kit's data passes at least ${R4_TARGET} of 25`, async (t) => {
    const dir = [ctx.args.checker, process.env.CINDER_CHECKER, path.resolve(ctx.here, '..', '..', '..', 'bench', 'coding-semi')].filter(Boolean)
      .find((d) => fs.existsSync(path.join(d, 'check_game.mjs')) && fs.existsSync(path.join(d, 'task-r4', 'data', 'world.json')));
    if (!dir) ctx.skip('the R4 checker is not here (give --checker DIR or set CINDER_CHECKER to the folder with check_game.mjs and task-r4/data)');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cinder-engine-')), copy = path.join(tmp, 'game'), out = path.join(tmp, 'out');
    let server, child;
    try {
      fs.cpSync(ctx.dir, copy, { recursive: true, filter: (f) => !/(^|\/)(\.git|node_modules|plans)(\/|$)/.test(path.relative(ctx.dir, f)) });
      const kit = path.join(dir, 'task-r4', 'data');
      fs.cpSync(kit, path.join(copy, 'data'), { recursive: true, force: true });      // world.json and srd/ are the kit's; the build's other data files stay
      server = await serve(copy);
      const res = await new Promise((resolve, reject) => {
        child = spawn(process.execPath, [path.join(dir, 'check_game.mjs'), server.url, 'R4', out], { stdio: ['ignore', 'pipe', 'pipe'] });
        let so = '', se = ''; child.stdout.on('data', (d) => { so += d; }); child.stderr.on('data', (d) => { se += d; });
        const stop = setTimeout(() => { try { process.kill(child.pid, 'SIGTERM'); } catch { /* gone */ } reject(new Error('the checker did not finish in 40 minutes')); }, 40 * 60000);
        process.once('exit', () => { try { if (child && child.pid) process.kill(child.pid, 'SIGTERM'); } catch { /* gone */ } });
        child.on('close', () => clearTimeout(stop));
        child.on('error', reject);
        child.on('close', () => { const line = so.split('\n').reverse().find((l) => l.startsWith('{')); line ? resolve(JSON.parse(line)) : reject(new Error('the checker gave no result: ' + se.slice(-300))); });
      });
      child = null;
      const checks = res.checks.filter((c) => c.id !== 'harness'), failed = checks.filter((c) => !c.pass), harness = res.checks.find((c) => c.id === 'harness');
      t.data.r4 = { passed: checks.length - failed.length, of: 25, failed: failed.map((c) => ({ id: c.id, note: c.note.slice(0, 200) })), console_errors: res.errors.length, seconds: res.t_s,
        regression_failed: (res.regression || []).filter((c) => !c.pass).map((c) => c.id) };
      t.must(!harness, `the checker stopped: ${harness && harness.note}`);
      const passed = checks.length - failed.length;
      t.must(passed >= R4_TARGET, `${passed} of 25; failed: ${failed.map((c) => `${c.id} (${c.note.slice(0, 90)})`).join('; ')}`);
      return `${passed} of 25${failed.length ? `, failed ${failed.map((c) => c.id).join(' ')}` : ''}${t.data.r4.regression_failed.length ? `; of rounds 1-3: ${t.data.r4.regression_failed.join(' ')} failed` : ''}; ${res.errors.length} console errors; ${res.t_s} s`;
    } finally {
      if (child && child.pid) { try { process.kill(child.pid, 'SIGTERM'); } catch { /* gone */ } }   // the checker's driver closes its browser on SIGTERM
      if (server) await server.close();
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }, { timeout: 45 * 60000, slow: true, browser: false });
}
