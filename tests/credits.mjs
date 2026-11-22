// credits.mjs - the credits a player can read ON SCREEN (Start menu, Credits, A turns the pages) carry what the licences ask.
// The required SRD sentence is read from the build's own data/srd/ATTRIBUTION.md (the quoted block), so the test follows the file.
// Letters and digits are compared, not line breaks: the page is 18 letters wide and breaks words where it must.
const squash = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

/** every credits page as drawn: START, cursor to Credits, A through the pages until the first one comes back */
async function readCredits(t, ctx) {
  if (ctx.shared.credits != null) return ctx.shared.credits;
  await t.play(); await t.menu('Credits');
  const pages = [], grab = async () => (await t.texts()).filter((x) => x.y < 144).map((x) => x.text).join('\n');
  for (let i = 0; i < 40; i++) { const p = await grab(); if (pages.includes(p)) break; pages.push(p); await t.A(200); }
  await t.ev('T.shut()');
  return (ctx.shared.credits = pages.join('\n'));
}

export default function (suite, ctx) {
  const quote = ctx.data.attribution.split('\n').filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, '')).join(' ').trim();
  const sentences = quote.split(/(?<=legalcode\.|document\.)\s+/).filter(Boolean);
  const has = async (t, words, what) => { const all = squash(await readCredits(t, ctx)), miss = words.filter((w) => !all.includes(squash(w)));
    t.must(!miss.length, `the on-screen credits do not carry ${what}: missing ${miss.map((m) => JSON.stringify(m.length > 70 ? m.slice(0, 67) + '...' : m)).join(', ')}`); };

  suite.test('credits.srd.named', 'credits: the System Reference Document 5.1, Wizards of the Coast and CC-BY-4.0 are named', (t) =>
    has(t, ['System Reference Document 5.1', 'Wizards of the Coast', 'CC-BY-4.0'], 'the SRD'));
  suite.test('credits.srd.sentence', 'credits: the full credit sentence data/srd/ATTRIBUTION.md requires, with both licence addresses', async (t) => {
    t.must(sentences.length >= 2 && /creativecommons\.org/.test(quote), 'data/srd/ATTRIBUTION.md has no quoted credit to check against');
    await has(t, sentences, 'the required sentence');
  });
  suite.test('credits.unaffiliated', 'credits: the game says it is not affiliated with Wizards of the Coast', (t) =>
    has(t, ['not affiliated with', 'Wizards of the Coast'], 'the line that it is not affiliated'));
  suite.test('credits.dawnlike', 'credits: DawnLike by DragonDePlatino, palette by DawnBringer, CC-BY 4.0', (t) =>
    has(t, ['DawnLike', 'DragonDePlatino', 'DawnBringer', 'CC-BY 4.0'], 'DawnLike'));
  suite.test('credits.kenney', 'credits: the Kenney tiles, CC0', (t) => has(t, ['Kenney', 'CC0'], 'Kenney'));
  suite.test('credits.font', 'credits: the font Press Start 2P, OFL', (t) => has(t, ['Press Start 2P', 'OFL'], 'the font'));
  suite.test('credits.engine', 'credits: the engine Phaser 3, MIT', (t) => has(t, ['Phaser', 'MIT'], 'the engine'));
  suite.test('credits.hook', 'credits: window.__game.credits (read by the engine check) carries the required sentence too', async (t) => {
    await t.play(); const all = squash(await t.ev('window.__game.credits'));
    t.must(sentences.every((s) => all.includes(squash(s))), 'window.__game.credits lacks the required sentence');
  });
}
