// balance.mjs - can a player who plays the story straight win its fights, and do the rewards make sense?
//
// The boss simulation (the method of REVIEW-v0.5.md): the game's own battle code decides every fight. The suite walks the main
// story through the hook to each boss (earlier fights are ended with winBattle, a set-up), so the hero has exactly the XP, level
// and HP the game gave him by then, and wears what the story's rewards gave him (each reward equipped as it arrives). He stands
// before the boss, facing it, at full HP; that state is saved. Each fight = load that save, press A on the boss, press A every
// round until the battle ends (all through window.__game.actions, i.e. the game's own input path). 400 fights a boss by default.
//   no potions   he only attacks                                                     -> the band below is checked on this number
//   3 potions    he drinks a Potion of Healing (useItem) at 35 % HP or less, 3 at most -> reported
// The hero: the game's own, if a new game always gives the same one; otherwise the review's typical roll (STR 12, DEX 14, CON 11).
//
// Bands (README.md, "The bands and why"): a boss must be won in 40 % to 85 % of the fights without potions.
import fs from 'node:fs';
import path from 'node:path';

export const BAND = { min: 40, max: 85 };          // % of fights won against a chapter boss, no potions
export const CURVE = { step: 3, side: 2, final: [8, 10] };   // a chapter pays at most 3x the one before; a side quest at most 2x the best chapter before the last; level at the last boss with every side quest done
const TYPICAL = { str: 12, dex: 14, con: 11, int: 10, wis: 10, cha: 10 };
const mod = (v) => Math.floor((v - 10) / 2);

const SIM = `window.SIM = async (n, potion) => { const g = window.__game, a = g.actions; let wins = 0, rounds = 0, drinks = 0, odd = 0;
  for (let i = 0; i < n; i++) { await T.idle(); a.load(); await T.idle(); while (g.dialogueOpen) a.pressA();
    a.pressA(); let res = null, left = 3;
    for (let k = 0; k < 6000; k++) { if (g.dialogueOpen) { a.pressA(); continue; }
      const b = g.battle; if (!b || !b.active) { if (!TA.idle()) { await T.sleep(5); continue; } break; }
      const h = g.party[0];
      if (potion && left > 0 && h.hp <= h.maxHp * 0.35 && a.useItem(potion)) { left--; drinks++; if (!g.battle || !g.battle.active) { res = g.battle ? g.battle.result : null; break; } continue; }
      a.pressA(); rounds++; if (!g.battle || !g.battle.active) { res = g.battle ? g.battle.result : null; break; } }
    if (res === 'win') wins++; else if (res !== 'lose') odd++; }
  return { n, wins, pct: Math.round(1000 * wins / n) / 10, rounds: Math.round(10 * rounds / n) / 10, drinks: Math.round(10 * drinks / n) / 10, odd }; }`;

export default function (suite, ctx) {
  const D = ctx.data, W = D.world, main = W.quests.main, fast = !!ctx.args.fast, N = fast ? Math.min(ctx.fights, 120) : ctx.fights;
  const B = (ctx.shared.balance = { fixed: null, rows: [] });
  const stats = (t) => t.ev('(() => { const h = T.hero(); return { stats: h.stats, hp: h.maxHp, cls: h.cls, level: h.level }; })()');

  async function heroFixed(t) {
    if (B.fixed != null) return B.fixed;
    const seen = []; for (let i = 0; i < 3; i++) { await t.play(); seen.push(JSON.stringify(await stats(t))); }
    B.sample = seen.map((s) => JSON.parse(s)); return (B.fixed = new Set(seen).size === 1);
  }
  /** a new game for the walk: the game's hero if it is fixed, else the typical roll */
  async function newHero(t) {
    const fixed = await heroFixed(t);
    await t.play(); await t.ev('window.__game.actions.setEncounters(false)'); await t.ev(SIM);
    // the gear the story gives before chapter 1 (meta.start.tutorial: a hero who starts empty-handed is armed by the tutorial)
    await t.ev(`(() => { const a = window.__game.actions; for (const id of ${JSON.stringify((W.meta.start && W.meta.start.tutorial) || [])}) { a.addItem(id); a.equip(id); } return 1; })()`);
    if (!fixed) await t.ev(`TA.setStats(${JSON.stringify(TYPICAL)})`);
    return fixed;
  }
  const equipAll = async (t, ids) => { for (const id of ids || []) await t.ev(`window.__game.actions.equip(${JSON.stringify(id)})`); };
  /** play chapter i to its end through the hook and wear its rewards */
  const finish = async (t, i) => { await t.ev(`T.hookPlay('main', ${i})`, 60000); await equipAll(t, main[i].reward.items); };
  const bossStep = (i) => main[i].steps.findIndex((s) => s.type === 'defeat');
  /** stand before the boss of chapter i at full HP and save; returns the hero as he is there */
  async function toBoss(t, i, extra) {
    const k = bossStep(i); await t.ev(`T.hookPlay('main', ${i}, ${k})`, 60000);
    if (extra) await extra();
    const at = await t.ev(`T.quest('main', ${i}).steps[${k}].at`);
    await t.ev(`(async () => { const s = await T.standBy(${JSON.stringify(at)}); await window.__game.actions.move(s.dir, 1); T.shut(); TA.setHp(T.hero().maxHp); window.__game.actions.save(); T.shut(); })()`);
    return t.ev(`(() => { const h = T.hero(); return { level: h.level, xp: h.xp, hp: h.maxHp, ac: h.ac, attack: '+' + h.attack.bonus + ' ' + h.attack.damage, gear: Object.values(h.equipment).filter(Boolean) }; })()`);
  }
  const reload = (t, js = '') => t.ev(`(async () => { await T.idle(); window.__game.actions.load(); await T.idle(); T.shut(); ${js} })()`);
  /** the two numbers of one boss: { hero, no, pot } */
  async function simulate(t, n) {
    const no = await t.ev(`SIM(${n}, null)`, 900000);
    let pot = null;
    if (!fast) { const name = D.item['potion-of-healing'].name;
      await reload(t, `const a = window.__game.actions; for (let i = 0; i < 3; i++) a.addItem('potion-of-healing'); a.save(); T.shut();`);
      pot = await t.ev(`SIM(${n}, ${JSON.stringify(name)})`, 900000); }
    await reload(t);
    return { no, pot };
  }

  // ---------------------------------------------------------------- the hero
  suite.test('balance.hero.fixed', 'the hero: every new game starts with the same hero (the same ability scores and HP), so every player meets the same game', async (t) => {
    const fixed = await heroFixed(t);
    t.must(fixed, `three new games gave three heroes: ${B.sample.map((s) => `STR ${s.stats.str} DEX ${s.stats.dex} CON ${s.stats.con} HP ${s.hp}`).join(' | ')}`);
  });

  suite.test('balance.hero.hp', 'the hero: hit points by data/srd/rules.json (the class\'s hit die at level 1, then its average rounded up, plus the CON modifier each level)', async (t) => {
    await t.play(); const h1 = await stats(t), die = D.rules.hit_die[h1.cls], con = mod(h1.stats.con);
    t.must(die, `rules.json has no hit die for the class ${h1.cls}`);
    await t.ev(`(() => { window.__game.actions.grantXp(${D.rules.level_xp[4]}); T.shut(); })()`);
    const h5 = await stats(t), per = Math.max(1, die / 2 + 1 + con), want1 = die + con, want5 = want1 + 4 * per;
    t.must(h5.level === 5, `set-up: ${D.rules.level_xp[4]} XP gave level ${h5.level}`);
    t.must(h1.hp === want1 && h5.hp === want5, `a ${h1.cls} with CON ${h1.stats.con}: ${h1.hp} HP at level 1 and ${h5.hp} at level 5; the rules give ${want1} and ${want5} (d${die}, ${per} a level)`);
  });

  suite.test('balance.levels', 'levels: XP raises the level by the table of data/srd/rules.json', async (t) => {
    await t.play(); const bad = [];
    for (let n = 2; n <= 10; n++) { const need = D.rules.level_xp[n - 1];
      const got = await t.ev(`(() => { const a = window.__game.actions, h = T.hero(); a.grantXp(${need} - 1 - h.xp); T.shut(); const below = T.hero().level; a.grantXp(1); T.shut(); return [below, T.hero().level]; })()`);
      if (got[0] !== n - 1 || got[1] !== n) bad.push(`${need - 1} XP = level ${got[0]}, ${need} XP = level ${got[1]} (wanted ${n - 1} and ${n})`); }
    t.must(!bad.length, bad.slice(0, 3).join('; '));
  });

  // ---------------------------------------------------------------- the bosses
  main.forEach((q, i) => {
    const k = bossStep(i); if (k < 0) return;
    const step = q.steps[k], m = D.mon[step.monster];
    suite.test(`balance.boss.${i + 1}`, `chapter ${i + 1} boss ${step.as} (${m.name}, CR ${m.cr}): won in ${BAND.min}-${BAND.max} % of ${N} fights at the level and with the gear the story gives`, async (t) => {
      let fixed = B.fixed;
      if ((await t.ev(`typeof window.__walkAt === 'undefined' ? -1 : window.__walkAt`).catch(() => -1)) !== i) { fixed = await newHero(t); for (let j = 0; j < i; j++) await finish(t, j); }
      const hero = await toBoss(t, i), r = await simulate(t, N);
      const rowOut = { chapter: i + 1, boss: step.as, monster: m.id, cr: m.cr, level: hero.level, xp: hero.xp, hp: hero.hp, ac: hero.ac, attack: hero.attack, gear: hero.gear,
        win: r.no.pct, win_3_potions: r.pot ? r.pot.pct : null, fights: N, rounds: r.no.rounds, hero: fixed ? 'the game\'s' : 'typical roll (STR 12 DEX 14 CON 11)' };
      B.rows[i] = rowOut; t.data.row = rowOut;
      // go on to the next boss on this page, whatever the verdict
      await finish(t, i); await t.ev(`window.__walkAt = ${i + 1}`);
      const line = `level ${hero.level}, ${hero.hp} HP, AC ${hero.ac}, ${hero.attack}: ${r.no.pct} % won${r.pot ? `, ${r.pot.pct} % with 3 potions` : ''}`;
      t.must(r.no.odd === 0 && (!r.pot || r.pot.odd === 0), `${r.no.odd + (r.pot ? r.pot.odd : 0)} fights ended neither won nor lost: the simulation could not start the fight or the battle did not end`);
      t.must(r.no.pct >= BAND.min && r.no.pct <= BAND.max, `${line}; wanted ${BAND.min}-${BAND.max} %: ${r.no.pct < BAND.min ? 'a player at this level cannot be expected to win' : 'no contest'}`);
      return line;
    }, { timeout: 900000 });
  });

  // ---------------------------------------------------------------- rewards and levels
  suite.test('balance.rewards.curve', `rewards: chapters pay more as they go (never more than ${CURVE.step}x the one before); no side quest pays more than ${CURVE.side}x the best chapter before the last`, (t) => {
    const bad = [], body = main.slice(0, -1);
    for (const key of ['xp', 'gold']) {
      body.forEach((q, i) => { if (!i) return; const a = body[i - 1].reward[key], b = q.reward[key];
        if (b < a) bad.push(`chapter ${i + 1} pays ${b} ${key}, less than chapter ${i} (${a})`); else if (a > 0 && b > CURVE.step * a) bad.push(`chapter ${i + 1} pays ${b} ${key}, ${(b / a).toFixed(1)}x chapter ${i}`); });
      const top = Math.max(...body.map((q) => q.reward[key]));
      for (const q of W.quests.side) if (q.reward[key] > CURVE.side * top) bad.push(`side quest ${q.id} pays ${q.reward[key]} ${key}, ${(q.reward[key] / top).toFixed(1)}x the best chapter (${top})`);
    }
    t.must(!bad.length, bad.join('; '));
  }, { browser: false });

  suite.test('balance.level.final', `levels: with every side quest done the hero meets the last boss at level ${CURVE.final[0]} to ${CURVE.final[1]} (the level by the story alone is reported)`, async (t) => {
    const fixed = await newHero(t), n = main.length - 1;
    for (let j = 0; j < n; j++) await finish(t, j);
    await t.ev(`T.hookPlay('main', ${n}, ${bossStep(n)})`, 60000);
    const alone = await stats(t);
    for (let j = 0; j < W.quests.side.length; j++) await t.ev(`T.hookPlay('side', ${j})`, 60000);
    const all = await stats(t);
    t.data.levels = { story_only: alone.level, with_side_quests: all.level, hero: fixed ? 'the game\'s' : 'typical roll' };
    t.must(all.level >= CURVE.final[0] && all.level <= CURVE.final[1], `at the last boss: level ${alone.level} by the story alone, level ${all.level} with every side quest; wanted ${CURVE.final[0]}-${CURVE.final[1]} with the side quests`);
    t.must(all.level <= D.rules.level_xp.length, `level ${all.level} is beyond the rules table`);
    return `level ${alone.level} by the story alone, ${all.level} with every side quest`;
  }, { timeout: 240000 });

  // ---------------------------------------------------------------- calibration against the v0.5 review (only with --calibrate)
  if (ctx.args.calibrate) suite.test('balance.calibration', 'calibration: with the v0.5 review\'s levels and gear the simulation gives the review\'s win rates (5 points either way)', async (t) => {
    const R = JSON.parse(fs.readFileSync(path.join(ctx.here, 'lib', 'review-v0.5.json'), 'utf8')), n = Math.max(ctx.fights, 400), rows = [], bad = [];
    await t.play(); await t.ev('window.__game.actions.setEncounters(false)'); await t.ev(SIM); await t.ev(`TA.setStats(${JSON.stringify(R.hero)})`);
    for (let i = 0; i < main.length; i++) { const want = R.bosses[i];
      const hero = await toBoss(t, i, async () => {
        const need = D.rules.level_xp[want.level - 1];
        await t.ev(`(() => { const a = window.__game.actions, h = T.hero(); if (h.xp < ${need}) a.grantXp(${need} - h.xp); T.shut(); for (const id of ${JSON.stringify(want.also || [])}) if (!Object.values(T.hero().equipment).includes(id)) { a.addItem(id); a.equip(id); } })()`); });
      const no = await t.ev(`SIM(${n}, null)`, 900000);
      await reload(t, `const a = window.__game.actions; for (let i = 0; i < 3; i++) a.addItem('potion-of-healing'); a.save(); T.shut();`);
      const pot = await t.ev(`SIM(${n}, ${JSON.stringify(D.item['potion-of-healing'].name)})`, 900000);
      await reload(t); await finish(t, i);
      rows.push({ chapter: i + 1, boss: want.boss, level: hero.level, ac: hero.ac, win: no.pct, review: want.win[0], win_3_potions: pot.pct, review_3_potions: want.win[1] });
      if (hero.level !== want.level || hero.ac !== want.ac) bad.push(`chapter ${i + 1}: level ${hero.level} AC ${hero.ac}, the review had level ${want.level} AC ${want.ac}`);
      if (Math.abs(no.pct - want.win[0]) > 5 || Math.abs(pot.pct - want.win[1]) > 5) bad.push(`chapter ${i + 1}: ${no.pct} / ${pot.pct} %, the review had ${want.win[0]} / ${want.win[1]} %`);
    }
    t.data.calibration = rows;
    t.must(!bad.length, bad.join('; '));
    return rows.map((r) => `ch${r.chapter} ${r.win}/${r.win_3_potions} (review ${r.review}/${r.review_3_potions})`).join(', ');
  }, { timeout: 1800000 });
}
