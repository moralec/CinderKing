// data.mjs - is the game's own data whole? The truth is the build's data/ folder; nothing here compares it with another copy.
//   static (no browser): ids resolve, quests can be played with what they give, rewards, orphans, pictures, leftover notes
//   placed (in the game): every person and every quest step has a tile, and a player can walk to it
import fs from 'node:fs';
import path from 'node:path';

const STEP_TYPES = ['talk', 'fetch', 'open', 'defeat'];
const SIDES = { north: 'south', south: 'north', east: 'west', west: 'east' };
/** who offers a rest: a `rest` field on the person, or an innkeeper by title (README, "What the suite expects of the data") */
export const offersRest = (n) => !!n.rest || n.role === 'innkeeper' || /innkeep/i.test(n.title || '');
export const isSettlement = (z) => z.settlement === true || (z.settlement == null && z.biome === 'town');

function pngSize(file) { const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }
const list = (a, n = 6) => a.slice(0, n).join('; ') + (a.length > n ? `; and ${a.length - n} more` : '');

export default function (suite, { data: D }) {
  const W = D.world, zone = Object.fromEntries(W.zones.map((z) => [z.id, z])), npc = Object.fromEntries(W.npcs.map((n) => [n.id, n]));
  const site = Object.fromEntries((W.sites || []).map((s) => [s.id, s]));

  suite.test('data.zones', 'zones: unique ids, a full grid, neighbours that agree both ways, creatures and biomes that exist', (t) => {
    const bad = [], ids = W.zones.map((z) => z.id);
    if (new Set(ids).size !== ids.length) bad.push('duplicate zone ids');
    const g = W.meta.grid; if (W.zones.length !== g.width * g.height) bad.push(`${W.zones.length} zones for a ${g.width} x ${g.height} grid`);
    if (!zone[W.meta.start.zone]) bad.push(`start zone ${W.meta.start.zone} does not exist`);
    for (const z of W.zones) {
      if (!W.biomes[z.biome]) bad.push(`${z.id}: biome ${z.biome}`);
      for (const m of z.encounters || []) if (!D.mon[m]) bad.push(`${z.id}: creature ${m}`);
      for (const [side, to] of Object.entries(z.neighbours || {})) { if (!to) continue;
        if (!zone[to]) bad.push(`${z.id}: neighbour ${to}`); else if (zone[to].neighbours[SIDES[side]] !== z.id) bad.push(`${z.id} ${side} -> ${to}, but ${to} ${SIDES[side]} -> ${zone[to].neighbours[SIDES[side]]}`); }
    }
    // every zone can be reached from the start over the neighbour links
    const seen = new Set([W.meta.start.zone]), todo = [W.meta.start.zone];
    while (todo.length) for (const to of Object.values(zone[todo.pop()].neighbours || {})) if (to && zone[to] && !seen.has(to)) { seen.add(to); todo.push(to); }
    if (seen.size !== W.zones.length) bad.push(`${W.zones.length - seen.size} zones cannot be reached from the start`);
    for (const s of W.sites || []) { if (!zone[s.zone]) bad.push(`site ${s.id}: zone ${s.zone}`); for (const m of s.encounters || []) if (!D.mon[m]) bad.push(`site ${s.id}: creature ${m}`); }
    for (const [slot, id] of Object.entries(W.meta.start.equipment || {})) if (!D.item[id]) bad.push(`start ${slot}: item ${id}`);
    t.must(!bad.length, list(bad));
    return `${W.zones.length} zones, ${(W.sites || []).length} sites`;
  }, { browser: false });

  suite.test('data.people', 'people: unique ids, a zone that exists, lines to say; merchants sell things that exist and have a price', (t) => {
    const bad = [], ids = W.npcs.map((n) => n.id);
    if (new Set(ids).size !== ids.length) bad.push('duplicate people ids');
    for (const n of W.npcs) {
      if (!zone[n.zone]) bad.push(`${n.id}: zone ${n.zone}`);
      if (!Array.isArray(n.lines) || !n.lines.length || n.lines.some((l) => !String(l).trim())) bad.push(`${n.id}: no lines`);
      if (n.role === 'merchant' && !(n.stock || []).length) bad.push(`${n.id}: a merchant with nothing to sell`);
      for (const id of n.stock || []) { if (!D.item[id]) bad.push(`${n.id}: stock ${id}`); else if (D.item[id].cost_gp == null) bad.push(`${n.id}: ${id} has no price`); }
    }
    t.must(!bad.length, list(bad));
    return `${W.npcs.length} people, ${W.npcs.filter((n) => n.stock).length} merchants`;
  }, { browser: false });

  suite.test('data.quests', 'quests: unique ids, known step types, every person, creature, place and thing of a step exists; one final chapter, the last', (t) => {
    const bad = [], ids = D.quests.map((q) => q.id);
    if (new Set(ids).size !== ids.length) bad.push('duplicate quest ids');
    for (const q of D.quests) {
      if (!npc[q.giver]) bad.push(`${q.id}: giver ${q.giver}`);
      if (!(q.steps || []).length) bad.push(`${q.id}: no steps`);
      (q.steps || []).forEach((s, k) => { const w = `${q.id} step ${k + 1}`;
        if (!STEP_TYPES.includes(s.type)) { bad.push(`${w}: type ${s.type}`); return; }
        if (s.type === 'talk') { if (!npc[s.npc]) bad.push(`${w}: person ${s.npc}`); if (!(s.pages || []).length) bad.push(`${w}: a talk with no pages`); }
        else { if (!zone[s.zone]) bad.push(`${w}: zone ${s.zone}`); if (s.site && (!site[s.site] || site[s.site].zone !== s.zone)) bad.push(`${w}: site ${s.site}`); }
        if (s.type === 'defeat') { if (!D.mon[s.monster]) bad.push(`${w}: creature ${s.monster}`); if (!s.as) bad.push(`${w}: the foe has no name ("as")`); }
        if (s.type === 'fetch' || s.type === 'open') { if (!s.name) bad.push(`${w}: the thing has no name`); if (!(s.pages || []).length) bad.push(`${w}: no pages`); }
        if (s.type === 'open' && !s.needs) bad.push(`${w}: an "open" step that needs nothing`);
        for (const id of [...(s.gives || []), ...(s.takes || []), ...(s.needs ? [s.needs] : [])]) if (!D.thing[id]) bad.push(`${w}: thing ${id}`);
      });
    }
    const main = W.quests.main, fin = main.filter((q) => q.final);
    if (fin.length !== 1 || fin[0] !== main[main.length - 1]) bad.push('exactly the last main chapter must be "final"');
    main.forEach((q, i) => { if (q.chapter !== i + 1) bad.push(`${q.id}: chapter ${q.chapter} at place ${i + 1}`); });
    t.must(!bad.length, list(bad));
    return `${main.length} chapters, ${W.quests.side.length} side quests, ${D.quests.reduce((n, q) => n + q.steps.length, 0)} steps`;
  }, { browser: false });

  suite.test('data.quests.flow', 'quests can be played with what they give: a step never needs or takes a thing the hero cannot have by then', (t) => {
    const bad = [], held = new Set();   // what the main story has put in the bag so far (chapters in order)
    const play = (q, bag) => q.steps.forEach((s, k) => { const w = `${q.id} step ${k + 1}`;
      if (s.needs && !bag.has(s.needs)) bad.push(`${w} needs ${s.needs}, which nothing gives before it`);
      if (s.needs) bag.delete(s.needs);
      for (const id of s.takes || []) { if (!bag.has(id)) bad.push(`${w} takes ${id}, which nothing gives before it`); bag.delete(id); }
      for (const id of s.gives || []) bag.add(id); });
    for (const q of W.quests.main) { play(q, held); for (const id of q.reward.items || []) held.add(id); }
    for (const q of W.quests.side) play(q, new Set());
    t.must(!bad.length, list(bad));
  }, { browser: false });

  suite.test('data.quests.rewards', 'rewards: every quest pays XP (more than 0), gold (0 or more) and a list of things that exist', (t) => {
    const bad = [];
    for (const q of D.quests) { const r = q.reward;
      if (!r) { bad.push(`${q.id}: no reward`); continue; }
      if (!(Number.isFinite(r.xp) && r.xp > 0)) bad.push(`${q.id}: xp ${r.xp}`);
      if (!(Number.isFinite(r.gold) && r.gold >= 0)) bad.push(`${q.id}: gold ${r.gold}`);
      if (!Array.isArray(r.items)) bad.push(`${q.id}: items is not a list`);
      for (const id of r.items || []) if (!D.thing[id]) bad.push(`${q.id}: reward ${id}`); }
    t.must(!bad.length, list(bad));
  }, { browser: false });

  suite.test('data.orphans', 'no orphans: every quest person has a quest; every quest thing is given, taken, needed or paid somewhere', (t) => {
    const bad = [], usedNpc = new Set(), usedThing = new Set(), usedMon = new Set();
    for (const q of D.quests) { usedNpc.add(q.giver); for (const id of q.reward.items || []) usedThing.add(id);
      for (const s of q.steps) { if (s.npc) usedNpc.add(s.npc); if (s.monster) usedMon.add(s.monster); for (const id of [...(s.gives || []), ...(s.takes || []), ...(s.needs ? [s.needs] : [])]) usedThing.add(id); } }
    for (const z of W.zones) for (const m of z.encounters || []) usedMon.add(m);
    for (const s of W.sites || []) for (const m of s.encounters || []) usedMon.add(m);
    for (const n of W.npcs) if ((n.role === 'main' || n.role === 'side') && !usedNpc.has(n.id)) bad.push(`${n.id} (${n.role}) is in no quest`);
    for (const i of W.quest_items || []) if (!usedThing.has(i.id)) bad.push(`quest thing ${i.id} is used by no quest`);
    const unmet = D.monsters.filter((m) => !usedMon.has(m.id)).map((m) => m.id);   // not a fault of the game: reported
    t.must(!bad.length, list(bad));
    return unmet.length ? `${unmet.length} creature(s) of the bestiary are never met: ${unmet.join(', ')}` : '';
  }, { browser: false });

  suite.test('data.sprites', 'pictures: data/sprites.json names a picture for every creature and every item; each sheet is a file and holds the frame', (t) => {
    const S = D.sprites; t.must(S && S.monsters && S.items && S.sheets, 'data/sprites.json is missing or has no monsters / items / sheets');
    const bad = [], size = {};
    for (const [k, f] of Object.entries(S.sheets)) { const file = path.join(D.dir, f); if (!fs.existsSync(file)) bad.push(`sheet ${k}: no file ${f}`); else size[k] = pngSize(file); }
    size.dun = fs.existsSync(path.join(D.dir, 'assets/dungeon.png')) ? pngSize(path.join(D.dir, 'assets/dungeon.png')) : null;
    size.town = fs.existsSync(path.join(D.dir, 'assets/town.png')) ? pngSize(path.join(D.dir, 'assets/town.png')) : null;
    const check = (kind, ids, table) => { for (const id of ids) { const e = table[id];
      if (!e) { bad.push(`${kind} ${id}: no picture`); continue; }
      const [key, frame] = e, sz = size[key];
      if (!sz) bad.push(`${kind} ${id}: sheet ${key} is not in "sheets"`); else if (!(Number.isInteger(frame) && frame >= 0 && frame < Math.floor(sz.w / 16) * Math.floor(sz.h / 16))) bad.push(`${kind} ${id}: frame ${frame} is outside sheet ${key}`); } };
    check('creature', D.monsters.map((m) => m.id), S.monsters); check('item', D.items.map((i) => i.id), S.items);
    for (const id of [...Object.keys(S.monsters).filter((k) => !D.mon[k]), ...Object.keys(S.items).filter((k) => !D.thing[k])]) bad.push(`a picture for ${id}, which is not in the data`);
    t.must(!bad.length, list(bad));
    return `${D.monsters.length} creatures, ${D.items.length} items, ${Object.keys(S.sheets).length} sheets`;
  }, { browser: false });

  suite.test('data.sprites.questitems', 'pictures: the things a quest gives (keys, letters, the ledger) have a picture too', (t) => {
    const S = D.sprites || { items: {} }, miss = (W.quest_items || []).filter((i) => !S.items[i.id] && !i.sprite).map((i) => i.id);
    t.must(!miss.length, `${miss.length} of ${(W.quest_items || []).length} quest things have no picture: ${list(miss, 5)}`);
  }, { browser: false });

  suite.test('data.rest', 'rest: every settlement has someone who offers a bed (a `rest` field, or an innkeeper by title)', (t) => {
    const towns = W.zones.filter(isSettlement), miss = towns.filter((z) => !W.npcs.some((n) => n.zone === z.id && offersRest(n))).map((z) => z.id);
    t.must(towns.length > 0, 'no zone is a settlement');
    t.must(!miss.length, `${miss.length} of ${towns.length} settlements have nobody to rest with: ${miss.join(', ')}`);
    return `${towns.length} settlements`;
  }, { browser: false });

  suite.test('data.notes', 'no notes to the developer are left in the texts a player can read ("round 3", "your round 1 ...")', (t) => {
    const hits = [], walk = (v, where) => { if (typeof v === 'string') { if (/\bround \d\b|\byour round\b|keep it working/i.test(v)) hits.push(`${where}: "${v.slice(0, 60)}"`); }
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'note') walk(x, `${where}.${k}`); };
    walk({ zones: W.zones, sites: W.sites, npcs: W.npcs, quest_items: W.quest_items, quests: W.quests }, 'world');
    t.must(!hits.length, `${hits.length} texts: ${list(hits, 3)}`);
  }, { browser: false });

  if (D.defeat) suite.test('data.defeat', 'data/defeat.json: every outcome it can draw has its pages', (t) => {
    const d = D.defeat, bad = (d.outcomes || []).filter((o) => !Array.isArray(d[o]) || !d[o].length);
    t.must((d.outcomes || []).length > 0 && !bad.length && d.fall, `outcomes ${JSON.stringify(d.outcomes)}; without pages: ${bad.join(', ') || 'none'}; fall line: ${!!d.fall}`);
    return `${d.outcomes.length} outcomes`;
  }, { browser: false });

  // ---- in the game ----
  suite.test('data.placed', 'in the game: every person of the data stands in their zone on a tile of their own; every quest step has a place', async (t) => {
    await t.play();
    const r = await t.ev(`(() => { const g = window.__game, out = { npcs: g.npcs.map(n => ({ id: n.id, zone: n.zone, map: n.map, x: n.x, y: n.y })), steps: [], zones: g.world.zones.map(z => ({ id: z.id, map: z.map })) };
      for (const kind of ['main', 'side']) for (const q of g.quests[kind]) q.steps.forEach((s, k) => out.steps.push({ q: q.id, k, type: s.type, at: s.at || null })); return out; })()`);
    const bad = [], mapOf = Object.fromEntries(r.zones.map((z) => [z.id, z.map])), at = new Map();
    const homes = (zone) => new Set([mapOf[zone], ...(W.sites || []).filter((x) => x.zone === zone).map((x) => x.id)]);   // a zone's map and the rooms of its sites
    for (const n of W.npcs) { const p = r.npcs.find((x) => x.id === n.id);
      if (!p || p.map == null) { bad.push(`${n.id} is not in the game`); continue; }
      if (!homes(n.zone).has(p.map)) bad.push(`${n.id} stands on ${p.map}, not in ${n.zone} or a house of it`); }
    for (const q of D.quests) q.steps.forEach((s, k) => { const p = r.steps.find((x) => x.q === q.id && x.k === k);
      if (!p || !p.at || p.at.map == null) { bad.push(`${q.id} step ${k + 1} (${s.type}) has no place`); return; }
      const want = s.site || mapOf[s.type === 'talk' ? (npc[s.npc] || {}).zone : s.zone];
      const ok = s.type === 'talk' && !s.site ? homes((npc[s.npc] || {}).zone).has(p.at.map) : p.at.map === want;
      if (!ok) bad.push(`${q.id} step ${k + 1} is on ${p.at.map}, wanted ${want}`);
      if (s.type !== 'talk') { const key = `${p.at.map} ${p.at.x},${p.at.y}`; if (at.has(key) && at.get(key) !== `${q.id}#${k}`) bad.push(`${q.id} step ${k + 1} shares the tile ${key} with ${at.get(key)}`); at.set(key, `${q.id}#${k}`); } });
    const seen = new Map(); for (const p of r.npcs) { const key = `${p.map} ${p.x},${p.y}`; if (seen.has(key)) bad.push(`${p.id} and ${seen.get(key)} share the tile ${key}`); seen.set(key, p.id); if (at.has(key)) bad.push(`${p.id} stands on the tile of ${at.get(key)}`); }
    t.must(!bad.length, list(bad));
    return `${r.npcs.length} people, ${r.steps.length} steps placed`;
  });

  suite.test('data.reachable', 'in the game: a player can walk to every person and every quest step from where a zone is entered, and to every exit', async (t) => {
    await t.play();
    const bad = await t.ev(`(async () => { const g = window.__game, bad = [], targets = {};
      const add = (at, what) => { if (at && at.map != null) (targets[at.map] = targets[at.map] || []).push({ ...at, what }); };
      for (const n of g.npcs) add(n, n.id);
      for (const kind of ['main', 'side']) for (const q of g.quests[kind]) q.steps.forEach((s, k) => add(s.at, q.id + ' step ' + (k + 1)));
      const exits = {}; for (const z of g.world.zones) exits[z.map] = Object.entries(z.exits || {}).filter(e => e[1]).map(([side, e]) => ({ ...e, what: z.id + ' exit ' + side }));
      for (const map of new Set([...Object.keys(targets), ...Object.keys(exits)])) {
        if (g.actions.travel(map) !== true) { bad.push('cannot enter ' + map); continue; }
        if (!(await T.until(() => TA.idle() && g.player.map === map, 5000))) { bad.push(map + ' never became ready'); continue; }
        const from = g.player, ok = T.reach(from.x, from.y);
        for (const x of targets[map] || []) if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ok.has((x.x + dx) + ',' + (x.y + dy)))) bad.push(x.what + ' at ' + map + ' ' + x.x + ',' + x.y + ' cannot be walked to');
        for (const x of exits[map] || []) if (!ok.has(x.x + ',' + x.y)) bad.push(x.what + ' at ' + x.x + ',' + x.y + ' cannot be walked to');
      } return bad; })()`, 120000);
    t.must(!bad.length, list(bad));
  }, { timeout: 150000 });
}
