// story.mjs - can the story be played to its end? Every chapter and every side quest of the build's own data/world.json, in
// order, step by step, the way a player does a step: stand beside the person or thing, turn to it with the arrow key, press A,
// read every page with A, fight with A.
//
// Set-ups (never the thing under test): the hero is put beside the target with the hook's travel(), random encounters are off,
// and in a story fight the hero cannot die (his HP is set very high before the first blow). The foe keeps its own numbers and
// falls to real blows; whether a real hero can win that fight is balance.mjs's question, not this file's.
import { sleep } from './lib/harness.mjs';

const squash = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const END = '/^\\s*THE END\\s*$/';

export default function (suite, ctx) {
  const D = ctx.data, W = D.world, main = W.quests.main, side = W.quests.side;
  const S = (ctx.shared.story = { done: {}, paid: [], pages: [], unfit: [], bosses: [], ending: null, sidesOpen: false });
  // every text a writer wrote as one page: a shown page shorter than 3 words must be one of these
  const authored = new Set();
  for (const n of W.npcs) for (const l of n.lines || []) { authored.add(l.trim()); authored.add(`${n.name}: ${l}`.trim()); }
  for (const q of D.quests) for (const s of q.steps) for (const p of [...(s.pages || []), ...(s.intro || [])]) { authored.add(p.trim()); const who = s.npc && W.npcs.find((n) => n.id === s.npc); if (who) authored.add(`${who.name}: ${p}`.trim()); }

  const snap = (t) => t.ev(`(() => { const g = window.__game, h = g.party[0]; return { inv: g.inventory.slice(), gold: g.gold, xp: h.xp, level: h.level, maxHp: h.maxHp, ac: h.ac, won: !!g.won }; })()`);
  const count = (inv, name) => inv.filter((n) => n === name).length;

  /** one step of a quest with the keys. Returns { pre, post, fought, rounds } (the pages before and after a fight). */
  async function doStep(t, q, k, watchEnd = false) {
    const step = q.steps[k], where = `${q.id} step ${k + 1} (${step.type}${step.npc ? ' ' + step.npc : ''}${step.as ? ' ' + step.as : ''})`;
    const v = await t.ev(`T.quest('${q.kind}', ${q.index})`);
    t.must(v.stage === k, `${where}: the quest is at stage ${v.stage}, not ${k}`);
    const b = await snap(t);
    const s = await t.ev(`T.standBy(${JSON.stringify(v.steps[k].at)})`);
    await t.arrow(s.dir, 80);
    const f = (await t.state()).facing; t.must(f === s.dir, `${where}: the arrow key did not turn the hero ${s.dir} (facing ${f})`);
    await t.A(120);
    const pre = [], post = [], card = []; let fought = false, rounds = 0, level = b.level;
    for (let i = 0; i < 900; i++) {
      const st = await t.state();
      if (st.dialogue) { (fought ? post : pre).push(st.page); S.pages.push(st.page);
        const lay = await t.ev(`({ over: T.overlaps(), off: T.offscreen(), spill: T.spills(), end: T.sees(${END}) })`);
        for (const x of [...lay.over, ...lay.off, ...lay.spill]) S.unfit.push(`${where}: ${x}`);
        if (watchEnd) card.push(lay.end);
        await t.A(); }
      else if (st.battle) { if (!fought) { fought = true; level = st.level; await t.ev('TA.setHp(99999)'); } await t.A(); rounds++; if (rounds > 600) throw new Error(`${where}: the fight is not over after 600 rounds`); }
      else if (!st.idle) await sleep(30);
      else break;
    }
    if (fought) await t.ev('TA.setHp(T.hero().maxHp)');
    const said = [...pre, ...post];
    t.must(step.type !== 'defeat' || fought, `${where}: A on the foe started no fight; it said ${JSON.stringify(said[0] || '')}`);
    const v2 = await t.ev(`T.quest('${q.kind}', ${q.index})`), a = await snap(t);
    t.must(v2.stage === k + 1, `${where}: the stage is ${v2.stage}, wanted ${k + 1}; it said ${JSON.stringify(said[0] || '(nothing)')}`);
    for (const id of step.gives || []) t.must(count(a.inv, D.nameOf(id)) > count(b.inv, D.nameOf(id)) || (q.reward.items || []).includes(id), `${where}: it should give ${D.nameOf(id)}, which is not in the bag`);
    for (const id of [...(step.takes || []), ...(step.needs ? [step.needs] : [])]) t.must(count(a.inv, D.nameOf(id)) < count(b.inv, D.nameOf(id)) || (step.gives || []).includes(id), `${where}: it should take ${D.nameOf(id)}, which is still in the bag`);
    if (step.type === 'defeat') S.bosses.push({ quest: q.id, kind: q.kind, chapter: q.chapter || null, as: step.as, level, xp: b.xp, ac: b.ac, rounds, pre, intro: step.intro || null });
    if (k === q.steps.length - 1) {
      t.must(v2.status === 'done', `${q.id}: every step is done but the status is ${v2.status}`);
      S.paid.push({ quest: q.id, want: q.reward, gold: a.gold - b.gold, xp: step.type === 'defeat' ? null : a.xp - b.xp,
        items: (q.reward.items || []).filter((id) => count(a.inv, D.nameOf(id)) < count(b.inv, D.nameOf(id)) + 1 - ((step.takes || []).includes(id) ? 1 : 0)) });
      S.done[q.id] = true;
    }
    return { pre, post, fought, rounds, card };
  }

  // ---------------------------------------------------------------- the main story, chapter by chapter, on one page
  main.forEach((q0, i) => {
    const q = { ...q0, kind: 'main', index: i }, last = i === main.length - 1;
    suite.test(`story.main.${i + 1}`, `chapter ${i + 1}, ${q.name}: its ${q.steps.length} steps in order with the keys${last ? '; the campaign is won' : ''}`, async (t) => {
      if (i === 0) { await t.play(); await t.ev('window.__game.actions.setEncounters(false)'); }
      else await t.ev('T.shut()');
      const v = await t.ev(`T.quest('main', ${i})`);
      t.must(v.status !== 'locked', `chapter ${i + 1} is still locked after chapter ${i}`);
      t.must(!(await snap(t)).won, 'the campaign is "won" before its last chapter');
      let rounds = 0;
      for (let k = 0; k < q.steps.length; k++) {
        const endStep = last && k === q.steps.length - 1, r = await doStep(t, q, k, endStep); rounds += r.rounds;
        if (endStep) { await sleep(1500); S.ending = { during: r.card, after: await t.ev(`T.sees(${END})`), pages: r.pre.length }; }
      }
      if (last) t.must((await snap(t)).won, 'the last chapter is done but window.__game.won is false');
      const boss = S.bosses.filter((x) => x.quest === q.id).map((x) => `${x.as} met at level ${x.level}`).join(', ');
      return `${boss}${rounds ? `, ${rounds} rounds` : ''}`;
    }, { needs: i ? `story.main.${i}` : undefined, timeout: 240000 });
  });

  // ---------------------------------------------------------------- the ending (the page of the last chapter goes on)
  const lastId = `story.main.${main.length}`;
  suite.test('story.ending.card', 'ending: the end card comes after the last line, and stays until START', async (t) => {
    const e = S.ending; t.must(e, 'the last chapter did not reach its last step');
    const early = e.during.slice(0, -1).filter(Boolean).length;
    t.must(e.after, `the end card is gone 1.5 s after the last line${early ? ` (it was up behind ${early} of the ${e.during.length} pages of the last talk instead)` : ''}: the player is back in the village with no ending`);
    t.must(!early, `"THE END" is on the screen while ${early} of the ${e.during.length} pages of the last talk are still to be read`);
    await t.key('ArrowLeft', 45, 300); await t.A(300);
    t.must(await t.ev(`T.sees(${END})`), 'an arrow key or A takes the end card away: it must stay until START');
  }, { needs: lastId });

  suite.test('story.ending.credits', 'ending: START on the end card rolls the credits', async (t) => {
    await t.ev('T.shut()');
    await t.START(300);
    const st = await t.state();
    if (st.menu) { await t.ev('T.shut()'); throw new Error('START after the ending opens the Start menu: there is no credits roll'); }
    let all = '';
    for (let i = 0; i < 40 && !(await t.ev('T.onTitle()')); i++) { all += (await t.texts()).filter((x) => x.y < 144).map((x) => x.text).join('\n') + '\n'; await t.A(200); }
    t.must(squash(all).includes(squash('System Reference Document 5.1')), 'the credits after the ending do not name the System Reference Document 5.1');
  }, { needs: lastId });

  suite.test('story.ending.title', 'ending: after the credits the game is back at the title, and Continue returns to the won game', async (t) => {
    for (let i = 0; i < 40 && !(await t.ev('T.onTitle()')) && !(await t.ev('window.__game.menuOpen')); i++) await t.A(150);
    if (!(await t.ev('T.onTitle()'))) { await t.ev('T.shut()'); throw new Error('the game does not return to the title after the ending'); }
    t.must(await t.ev('T.sees(/continue/i)'), 'the title after the ending offers no Continue');
    await t.START(400); await t.ev('T.idle()'); await t.readAll();
    const st = await t.state();
    t.must(st.won && st.idle && !(await t.ev('T.onTitle()')), `Continue after the ending: won ${st.won}, idle ${st.idle}`);
  }, { needs: lastId });

  // ---------------------------------------------------------------- side quests, on a new game
  side.forEach((q0, i) => {
    const q = { ...q0, kind: 'side', index: i };
    suite.test(`story.side.${q.id}`, `side quest ${q.name}: its ${q.steps.length} steps in order with the keys`, async (t) => {
      if (!S.sidesOpen) { await t.play(); await t.ev('window.__game.actions.setEncounters(false)'); S.sidesOpen = true; } else await t.ev('T.shut()');
      let rounds = 0; for (let k = 0; k < q.steps.length; k++) rounds += (await doStep(t, q, k)).rounds;
      return rounds ? `${rounds} rounds` : '';
    }, { timeout: 240000 });
  });

  // ---------------------------------------------------------------- what the play showed
  suite.test('story.rewards', 'rewards: every finished quest paid what its data says, once: the XP, the gold and the things', (t) => {
    t.must(S.paid.length > 0, 'no quest was finished in this run (run the story tests with it)');
    const bad = [];
    for (const p of S.paid) { const w = p.want;
      if (p.xp != null && p.xp !== w.xp) bad.push(`${p.quest} paid ${p.xp} XP on its last step, the data says ${w.xp}${p.xp > w.xp ? ' (paid twice?)' : ''}`);
      if (Math.abs(p.gold - (w.gold || 0)) > 0.01) bad.push(`${p.quest} paid ${p.gold} gp, the data says ${w.gold}`);
      if (p.items.length) bad.push(`${p.quest} did not give ${p.items.map(D.nameOf).join(', ')}`); }
    t.must(!bad.length, bad.slice(0, 4).join('; '));
    return `${S.paid.length} quests`;
  }, { browser: false });

  suite.test('story.boss.intro', 'bosses speak BEFORE the fight: the last boss has `intro` pages in the data, and every `intro` is shown before the first blow', (t) => {
    const fights = S.bosses.filter((x) => x.kind === 'main'); t.must(fights.length > 0, 'no boss was fought in this run (run the story tests with it)');
    const fin = main[main.length - 1].steps.find((s) => s.type === 'defeat');
    t.must(fin && (fin.intro || []).length, `the last boss (${fin ? fin.as : '?'}) has no \`intro\` pages: his challenge is in \`pages\`, which the game shows after he is defeated`);
    const bad = S.bosses.filter((x) => x.intro && !x.intro.every((p) => squash(x.pre.join(' ')).includes(squash(p)))).map((x) => x.as);
    t.must(!bad.length, `the intro of ${bad.join(', ')} was not shown before the fight`);
    return `${S.bosses.filter((x) => x.intro).length} bosses with an intro`;
  }, { browser: false });

  suite.test('story.pages.whole', 'dialogue: no page of 1 or 2 words that is the cut-off tail of a longer page', (t) => {
    t.must(S.pages.length > 0, 'no dialogue was read in this run (run the story tests with it)');
    const tails = S.pages.filter((p) => words(p) < 3 && !authored.has(p.trim()));
    t.must(!tails.length, `${tails.length} of ${S.pages.length} pages are stray tails, such as ${[...new Set(tails)].slice(0, 5).map((x) => JSON.stringify(x)).join(', ')}`);
    return `${S.pages.length} pages`;
  }, { browser: false });

  suite.test('story.pages.fit', 'dialogue: every page of the story fits its box (no text over another, off the screen or into the status strip)', (t) => {
    t.must(S.pages.length > 0, 'no dialogue was read in this run (run the story tests with it)');
    t.must(!S.unfit.length, `${S.unfit.length} faults, such as ${S.unfit.slice(0, 3).join(' | ')}`);
    t.data.bosses = S.bosses.map(({ pre, intro, ...x }) => x);
  }, { browser: false });
}
