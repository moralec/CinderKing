// ui.mjs - the screens, with keys only: what a player's fingers can do. The hook sets a state up (a hurt hero, a full bag,
// gold, a fight) and reads the result; equip(), useItem(), buy(), sell() and winBattle() are never the thing under test.
//
// The keys: arrows, Space = A, Escape = B, Enter = START. What a list must look like for these tests to drive it:
// the row under the cursor starts with '>' (as the Start menu and the shop already do), ArrowUp/ArrowDown move it.
import { KEY, sleep, sigDist } from './lib/harness.mjs';
import { offersRest, isSettlement } from './data.mjs';
import { helpers } from './lib/gate.mjs';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const row = (name) => new RegExp(esc(name.slice(0, 10)), 'i');          // a row may cut a long name: its first 10 letters
const setup = (t, js) => t.ev(`(() => { const g = window.__game, a = g.actions; ${js}; return true; })()`);
const hook = (t, e) => t.ev(`window.__game.${e}`);
const carried = (t, name) => t.ev(`T.has(${JSON.stringify(name)})`);

/** texts that lie over each other, leave the canvas, or run from the view into the status strip */
async function layout(t, where) {
  const r = await t.ev(`({ over: T.overlaps(), off: T.offscreen(), spill: T.spills() })`);
  return [...r.over.map((x) => `${where}: ${x}`), ...r.off.map((x) => `${where}: off the screen: ${x}`), ...r.spill.map((x) => `${where}: runs into the status strip: ${x}`)];
}
/** stand beside a thing (set-up), turn to it with the arrow key, press A */
async function press(t, at) {
  const s = await t.ev(`T.standBy(${JSON.stringify(at)})`);
  await t.arrow(s.dir, 80);
  const f = (await t.state()).facing; t.must(f === s.dir, `the arrow key ${s.dir} towards a blocked tile did not turn the hero (facing ${f})`);
  await t.A(150);
}
/** START, cursor to Items, A: the cursor must now be on a row of the bag */
async function itemsList(t, names) {
  await t.menu('Items'); await t.A(200);
  const st = await t.state();
  t.must(!st.dialogue, `A on "Items" opens no list of the bag, it says: ${JSON.stringify(st.page)}`);
  const marked = await t.ev('T.marked()');
  t.must(marked.some((m) => names.some((n) => row(n).test(m))), `A on "Items" puts no cursor ('>') on a row of the bag; rows under a cursor: ${JSON.stringify(marked)}`);
}
/** does the battle show the command menu of layout A (Attack / Item / Run with a cursor)? */
const hasMenu = (t) => t.ev(`T.marked().length > 0 && ['Attack', 'Item', 'Run'].every(w => T.lines().some(l => new RegExp('^\\\\s*[>▶►]?\\\\s*' + w + '\\\\b', 'i').test(l)))`);
/** a battle command with the keys: on the command menu, the cursor to the word and A; on the old screen, the old key */
async function cmd(t, word, oldKey) {
  if (!(await hasMenu(t))) { await t.key(oldKey, 45, 150); return false; }
  if (!(await t.cursorTo(new RegExp('^' + word + '\\b', 'i'), { max: 4 }))) throw new Error(`the battle menu's cursor never reaches "${word}"`);
  await t.A(180); return true;
}
/** in a battle: drink with the keys. Item on the command menu opens the list of the bag, A takes the row. (Old screen: START.) */
async function drink(t, name) {
  const n0 = await t.ev(`window.__game.inventory.length`);
  await cmd(t, 'Item', KEY.START);
  if ((await t.ev(`window.__game.inventory.length`)) < n0) return true;
  if (name && (await t.cursorTo(row(name), { max: 12 }))) { await t.A(200); if ((await t.ev(`window.__game.inventory.length`)) < n0) return true; }
  return false;
}
async function openShop(t, id) {
  const m = await t.ev(`window.__game.npcs.find(n => n.id === ${JSON.stringify(id)})`); t.must(m, `the merchant ${id} is not in the game`);
  await press(t, m); await t.readAll();
  t.must((await t.state()).shop, `A on the merchant ${id} and A through the greeting opened no shop (window.__game.shop is null)`);
}

export default function (suite, { data: D }) {
  const W = D.world, startZone = W.meta.start.zone;
  const merchant = W.npcs.find((n) => n.role === 'merchant' && n.zone === startZone) || W.npcs.find((n) => n.role === 'merchant');
  const weak = [...D.monsters].sort((a, b) => a.xp - b.xp || a.hp - b.hp).find((m) => m.hp >= 5) || D.monsters[0];     // a foe that lasts a few rounds and cannot kill a level-5 hero fast
  const strong = [...D.monsters].sort((a, b) => b.xp - a.xp)[0];
  const BAG = ['potion-of-healing', 'potion-of-healing', 'chain-shirt', 'shield', 'longsword', 'dagger', 'torch', 'cloak-of-protection', 'ring-of-protection', 'rations-1-day', 'crowbar', 'frost-brand']
    .filter((id) => D.item[id]);
  const fill = (t) => setup(t, `for (const id of ${JSON.stringify(BAG)}) a.addItem(id); a.setEncounters(false)`);
  const bagNames = [...new Set(BAG.map((id) => D.item[id].name))];

  // ---------------------------------------------------------------- title
  suite.test('ui.title.new', 'title: a fresh page shows the title; START starts a new game in the start zone', async (t) => {
    await t.open();
    t.must(await t.ev('T.onTitle()'), `a fresh page shows no title (drawn: ${JSON.stringify((await t.lines()).slice(0, 8))})`);
    const bad = await layout(t, 'title'); t.must(!bad.length, bad.join(' | '));
    await t.START(250);
    t.must(!(await t.ev('T.onTitle()')), 'START does not leave the title');
    const st = await t.state(), want = (await hook(t, 'world.zones')).find((z) => z.id === startZone).map;
    t.must(st.map === want && st.idle && !st.dialogue && !st.menu, `after START the game is not ready in the start zone: ${JSON.stringify({ map: st.map, idle: st.idle, dialogue: st.dialogue, menu: st.menu })}`);
  });

  suite.test('ui.title.continue', 'title: with a save, the title offers Continue and START on it brings the saved game back', async (t) => {
    await t.play();
    const other = (await hook(t, 'world.zones')).find((z) => z.id !== startZone && D.world.zones.find((d) => d.id === z.id).neighbours);
    await t.ev(`T.go(${JSON.stringify(other.map)})`); await setup(t, 'a.addGold(123); a.save(); T.shut()');
    const saved = await t.state();
    await t.open({ clear: false });                                          // nothing reads the hook before the keys below
    t.must(await t.ev('T.onTitle()'), 'after a reload with a save there is no title');
    t.must(await t.ev('T.sees(/continue/i)'), `the title offers no Continue (drawn: ${JSON.stringify((await t.lines()).slice(-5))}); a new game starts and the save is only under Menu, Load`);
    await t.START(400); await t.ev('T.idle()'); await t.readAll();
    const now = await t.state();
    t.must(now.map === saved.map && now.x === saved.x && now.y === saved.y && now.gold === saved.gold, `Continue gave ${now.map} ${now.x},${now.y} with ${now.gold} gp; saved was ${saved.map} ${saved.x},${saved.y} with ${saved.gold} gp`);
  });

  // ---------------------------------------------------------------- status bar
  const strip = (t) => t.ev(`T.texts().filter(x => x.y >= 144).map(x => x.text)`);
  suite.test('ui.status.values', 'status bar: HP, level and gold are the hero\'s, and follow when they change', async (t) => {
    await t.play();
    const check = async (when) => { const st = await t.state(), s = (await strip(t)).join(' | ');
      t.must(new RegExp(`\\b${st.hp}\\s*/\\s*${st.maxHp}\\b`).test(s), `${when}: the bar does not show HP ${st.hp}/${st.maxHp} (it shows: ${s})`);
      t.must(new RegExp(`L(v|vl|evel)\\.?\\s*${st.level}\\b`, 'i').test(s), `${when}: the bar does not show level ${st.level} (it shows: ${s})`);
      t.must(new RegExp(`\\b${Math.floor(st.gold)}\\s*gp\\b`, 'i').test(s), `${when}: the bar does not show ${Math.floor(st.gold)} gp (it shows: ${s})`); };
    await check('new game');
    await setup(t, `a.addGold(42); a.grantXp(${D.rules.level_xp[1]}); T.shut()`); await sleep(120);
    await check('after 42 gp and a level');
    await t.ev('TA.setHp(1)'); await sleep(120); await check('at 1 HP');
    const bad = await layout(t, 'status bar'); t.must(!bad.length, bad.join(' | '));
  });

  suite.test('ui.status.zone', 'status bar: it names the place the hero is in, in every zone, without running over the other values', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const zones = await hook(t, 'world.zones'), bad = [];
    for (const z of zones) { await t.ev(`T.go(${JSON.stringify(z.map)})`); await sleep(60);
      const s = (await strip(t)).join(' | '); if (!s.toLowerCase().includes(z.name.toLowerCase())) bad.push(`${z.name}: not named (the bar shows: ${s})`);
      bad.push(...(await layout(t, z.name))); if (bad.length > 4) break; }
    t.must(!bad.length, bad.slice(0, 3).join(' | '));
    return `${zones.length} zones`;
  }, { timeout: 180000 });

  suite.test('ui.status.nobuttons', 'status bar: no drawn A, B and START buttons (the game is played with keys)', async (t) => {
    await t.play();
    const drawn = (await strip(t)).filter((s) => /^(A|B|START)$/.test(s.trim()));
    t.must(!drawn.length, `the strip still draws the buttons ${drawn.join(', ')}`);
  });

  // ---------------------------------------------------------------- the Start menu
  suite.test('ui.menu.pages', 'menu: START opens it, the arrows reach every entry, each page is drawn clean, B closes it', async (t) => {
    await t.play(); await fill(t);
    await t.menu(); const opts = await hook(t, 'menuOptions'), bad = [];
    t.must(opts.length >= 5, `menu entries: ${JSON.stringify(opts)}`);
    for (const o of opts) { await t.menu(o); bad.push(...(await layout(t, `menu ${o}`))); }
    t.must(!bad.length, bad.slice(0, 4).join(' | '));
    await t.B(200); t.must(!(await hook(t, 'menuOpen')), 'B does not close the menu');
    return opts.join(', ');
  });

  // ---------------------------------------------------------------- the Items page
  suite.test('ui.items.list', 'Items: A opens a list with a cursor; scrolling shows every thing carried, each row inside the panel', async (t) => {
    await t.play(); await fill(t);
    await itemsList(t, bagNames);
    const seen = new Set(), bad = []; let first = null, same = 0, last = '';
    for (let i = 0; i < 40; i++) { const m = (await t.ev('T.marked()')).join('|'); for (const l of await t.lines()) seen.add(l);
      bad.push(...(await layout(t, `row ${i + 1}`)));
      if (first == null) first = m; else if (m === first) break;
      same = m === last ? same + 1 : 0; if (same >= 2) break; last = m; await t.arrow('down'); }
    const all = [...seen].join('\n'), miss = bagNames.filter((n) => !row(n).test(all));
    t.must(!miss.length, `${miss.length} of ${bagNames.length} carried things are never listed: ${miss.join(', ')}`);
    t.must(!bad.length, bad.slice(0, 3).join(' | '));
    return `${bagNames.length} things listed`;
  });

  suite.test('ui.items.drink', 'Items: A on a Potion of Healing drinks it: HP rises, one potion fewer', async (t) => {
    await t.play(); await fill(t); await t.ev('TA.setHp(1)');
    const name = D.item['potion-of-healing'].name, n0 = await carried(t, name);
    await itemsList(t, bagNames);
    t.must(await t.cursorTo(row(name), { max: 20 }), `the cursor never reaches a row "${name}"`);
    await t.A(200); await t.readAll();
    const st = await t.state(), n1 = await carried(t, name);
    t.must(st.hp > 1 && n1 === n0 - 1, `after A on "${name}": HP ${st.hp}/${st.maxHp} (was 1), ${n1} potions (were ${n0})`);
  });

  suite.test('ui.items.equip', 'Items: A on a piece of armour wears it: the armour class follows, the old armour goes back to the bag', async (t) => {
    await t.play(); await fill(t);
    const h0 = await t.ev('T.hero()'), old = D.item[h0.equipment.armor], neu = D.item['chain-shirt'];
    await itemsList(t, bagNames);
    t.must(await t.cursorTo(row(neu.name), { max: 20 }), `the cursor never reaches a row "${neu.name}"`);
    await t.A(200); await t.readAll();
    const h1 = await t.ev('T.hero()');
    t.must(h1.equipment.armor === neu.id, `after A on "${neu.name}" the hero wears ${h1.equipment.armor}`);
    t.must(h1.ac !== h0.ac, `the armour class stayed ${h0.ac}`);
    if (old) t.must((await carried(t, old.name)) === 1, `the old armour (${old.name}) is not back in the bag`);
    return `AC ${h0.ac} -> ${h1.ac}`;
  });

  suite.test('ui.items.unequip', 'Items: worn gear is in the list too, and A on it takes it off', async (t) => {
    await t.play(); await fill(t); await setup(t, `a.equip('shield')`);
    const sh = D.item.shield, h0 = await t.ev('T.hero()'); t.must(h0.equipment.shield === 'shield', 'set-up: the shield is not worn');
    await itemsList(t, [...bagNames, sh.name]);
    t.must(await t.cursorTo(row(sh.name), { max: 24 }), `worn gear is not in the list: the cursor never reaches a row "${sh.name}"`);
    await t.A(200); await t.readAll();
    const h1 = await t.ev('T.hero()');
    t.must(!h1.equipment.shield && h1.ac === h0.ac - sh.ac_bonus && (await carried(t, sh.name)) >= 1, `after A on the worn "${sh.name}": shield slot ${h1.equipment.shield}, AC ${h0.ac} -> ${h1.ac}`);
  });

  suite.test('ui.items.worn', 'menu: the gear the hero wears is shown (weapon and armour by name, on the Party or the Items page)', async (t) => {
    await t.play();
    const eq = (await t.ev('T.hero()')).equipment, names = [eq.weapon, eq.armor].filter(Boolean).map((id) => D.item[id].name);
    t.must(names.length === 2, `set-up: a new hero should hold a weapon and wear armour (${JSON.stringify(eq)})`);
    let all = ''; for (const o of ['Party', 'Items']) { await t.menu(o); all += (await t.lines()).join('\n') + '\n'; }
    const miss = names.filter((n) => !row(n).test(all));
    t.must(!miss.length, `neither page shows ${miss.join(' or ')} (the Items page says: ${JSON.stringify(all.split('\n').filter((l) => /nothing|empty/i.test(l)))})`);
  });

  // ---------------------------------------------------------------- shop
  suite.test('ui.shop.buy', 'shop: A on the merchant opens the shop; the cursor reaches a ware, A buys it (gold down, the thing in the bag); B leaves', async (t) => {
    await t.play(); await setup(t, 'a.addGold(100); a.setEncounters(false)');
    const ware = D.item[merchant.stock.find((id) => D.item[id].cost_gp >= 5) || merchant.stock[0]];
    await openShop(t, merchant.id);
    const bad = await layout(t, 'shop'); t.must(!bad.length, bad.join(' | '));
    t.must(await t.cursorTo(row(ware.name), { max: merchant.stock.length + 2 }), `the cursor never reaches "${ware.name}"`);
    const g0 = (await t.state()).gold;
    await t.A(200); if ((await t.state()).gold === g0) { await t.readAll(); await t.A(200); }     // a confirmation takes a second A
    await t.readAll();
    const g1 = (await t.state()).gold;
    t.must(Math.abs(g0 - g1 - ware.cost_gp) < 0.01 && (await carried(t, ware.name)) === 1, `buying "${ware.name}" (${ware.cost_gp} gp): gold ${g0} -> ${g1}, in the bag ${await carried(t, ware.name)}`);
    for (let i = 0; i < 3 && (await t.state()).shop; i++) await t.B(200);
    t.must(!(await t.state()).shop, 'B does not leave the shop');
    return `${ware.name} for ${ware.cost_gp} gp`;
  });

  suite.test('ui.shop.confirm', 'shop: the first A on a ware asks; nothing is bought until the second A, and B takes it back', async (t) => {
    await t.play(); await setup(t, 'a.addGold(100); a.setEncounters(false)');
    await openShop(t, merchant.id);
    const g0 = (await t.state()).gold, n0 = await hook(t, 'inventory.length');
    await t.A(250);
    const st = await t.state(), n1 = await hook(t, 'inventory.length');
    t.must(st.gold === g0 && n1 === n0, `one A bought at once (gold ${g0} -> ${st.gold}): a player who presses A through the greeting buys the first ware`);
    await t.B(250);
    t.must((await t.state()).gold === g0 && (await t.state()).shop, 'B at the question did not go back to the list with the gold untouched');
  });

  suite.test('ui.shop.sell', 'shop: a Sell list (ArrowRight) shows what the hero carries; A sells a thing for half its price', async (t) => {
    await t.play(); await setup(t, `a.addItem('dagger'); a.addItem('shield'); a.setEncounters(false)`);
    const thing = D.item.shield;
    await openShop(t, merchant.id);
    t.must(await t.ev('T.sees(/sell/i)'), `the shop shows no way to sell (it says: ${JSON.stringify((await t.lines()).slice(-1)[0])})`);
    await t.key(KEY.right, 45, 250);
    t.must(await t.cursorTo(row(thing.name), { max: 12 }), `after ArrowRight no list of the bag: the cursor never reaches "${thing.name}"`);
    const g0 = (await t.state()).gold;
    await t.A(200); if ((await t.state()).gold === g0) { await t.readAll(); await t.A(200); }
    await t.readAll();
    const g1 = (await t.state()).gold;
    t.must(Math.abs(g1 - g0 - thing.cost_gp / 2) < 0.01 && (await carried(t, thing.name)) === 0, `selling "${thing.name}": gold ${g0} -> ${g1} (wanted +${thing.cost_gp / 2}), still carried ${await carried(t, thing.name)}`);
  });

  // ---------------------------------------------------------------- rest
  suite.test('ui.rest.inn', 'rest: talking to an innkeeper (A through the talk) restores all HP, for a fee in gold the hero can pay', async (t) => {
    const inn = W.npcs.find((n) => n.zone === startZone && offersRest(n)) || W.npcs.find((n) => offersRest(n) && isSettlement(W.zones.find((z) => z.id === n.zone)));
    t.must(inn, 'no person of the data offers a rest (a `rest` field, or an innkeeper by title)');
    await t.play(); await setup(t, 'a.addGold(50); a.setEncounters(false)'); await t.ev('TA.setHp(1)');
    const at = await t.ev(`window.__game.npcs.find(n => n.id === ${JSON.stringify(inn.id)})`), g0 = (await t.state()).gold;
    let said = [];
    for (let i = 0; i < 3 && (await t.state()).hp < (await t.state()).maxHp; i++) { await press(t, at); said = await t.readAll(); await setup(t, 'T.shut()'); }
    const st = await t.state();
    t.must(st.hp === st.maxHp, `after talking to ${inn.name} three times the hero has ${st.hp}/${st.maxHp} HP; the last talk: ${JSON.stringify(said.join(' ').slice(0, 110))}`);
    t.must(st.gold < g0 && st.gold >= 0, `the inn took no gold (${g0} -> ${st.gold}): a night at an inn costs a fee, the bed at home is the free rest`);
    return `${inn.name}, fee ${g0 - st.gold} gp`;
  });

  suite.test('ui.rest.bed', 'rest: a bed in the start town (window.__game.landmarks.bed, e.g. in the hero\'s house) can be walked to from the start without a fight; A on it restores all HP for free and says so', async (t) => {
    await t.play();
    const bed = await hook(t, 'landmarks.bed');
    t.must(bed && bed.map != null, 'window.__game.landmarks.bed is missing: there is no bed to rest in');
    const zones = await hook(t, 'world.zones'), town = zones.find((z) => z.id === startZone).map, home = (W.sites || []).filter((x) => x.zone === startZone).map((x) => x.id);
    t.must(bed.map === town || home.includes(bed.map), `the bed is on ${bed.map}, not in the start town (${town}) or a house of it (${home.join(', ')})`);
    // on foot from the start tile, random fights on: no battle on the way
    const H = helpers(t);
    if (bed.map !== town) { const door = await hook(t, 'landmarks.door'); await H.walkTo(door.x, door.y); await sleep(400); await t.ev('T.idle()'); }
    const w = await H.walkTo(bed.x, bed.y, true), on = await t.state();
    t.must(!on.battle && on.result == null, 'a fight started on the way from the start to the bed');
    t.must(w.ok && on.map === bed.map, `the bed cannot be walked to from the start: ${w.why || 'the hero is on ' + on.map}`);
    await t.ev('TA.setHp(1)'); const g0 = on.gold;
    await press(t, bed); const said = await t.readAll();
    const st = await t.state();
    t.must(st.hp === st.maxHp, `after A on the bed: ${st.hp}/${st.maxHp} HP`);
    t.must(st.gold === g0, `the bed cost ${g0 - st.gold} gp: it must be free`);
    t.must(said.some((p) => /rest|sleep|slept|bed/i.test(p)), `A on the bed says nothing about resting (${JSON.stringify(said[0] || '')})`);
  });

  // ---------------------------------------------------------------- battle
  const fight = async (t, id, level = 5) => { await setup(t, `a.setEncounters(false); a.grantXp(${D.rules.level_xp[level - 1]}); T.shut()`);
    t.must(await hook(t, `actions.forceBattle(${JSON.stringify(id)})`), `set-up: forceBattle(${id}) returned false`); await sleep(150); };

  suite.test('ui.battle.potion', 'battle: a Potion of Healing can be drunk with the keys (Item on the command menu, then A on its row)', async (t) => {
    await t.play(); await setup(t, `a.addItem('potion-of-healing'); a.addItem('potion-of-healing')`);
    const name = D.item['potion-of-healing'].name;
    await fight(t, weak.id); await t.ev('TA.setHp(3)');
    const bad = await layout(t, 'battle'); t.must(!bad.length, bad.join(' | '));
    const ok = await drink(t, name), n = await carried(t, name);
    t.must(ok && n === 1, `START in a battle drank no ${name} (still ${n} of 2 in the bag; the bar says: ${JSON.stringify((await strip(t)).filter((s) => /heal|start/i.test(s)))})`);
  });

  suite.test('ui.battle.turn', 'battle: a drink costs the turn: the foe strikes after it', async (t) => {
    await t.play(); await setup(t, `a.addItem('healing-draught'); a.addItem('healing-draught'); a.addItem('potion-of-healing'); a.addItem('potion-of-healing')`);
    let acted = 0, drunk = 0;
    await fight(t, weak.id);
    for (let i = 0; i < 3; i++) {
      await t.ev('TA.setHp(4)');
      await t.ev(`(() => { const b = window.__game.battle; for (const k of ['foeRoll', 'enemyRoll']) if (b[k]) b[k].__seen = true; window.__log0 = b.log.length; })()`);
      if (!(await drink(t, D.item['potion-of-healing'].name))) break; drunk++;
      const r = await t.ev(`(() => { const b = window.__game.battle; return { fresh: ['foeRoll', 'enemyRoll'].some(k => b[k] && !b[k].__seen), lines: b.log.length - window.__log0, over: !b.active }; })()`);
      if (r.fresh || r.lines >= 2 || r.over) acted++;
    }
    t.must(drunk > 0, 'no drink could be taken with the keys in a battle');
    t.must(acted === drunk, `${drunk} drinks, the foe struck after ${acted} of them: drinking is free, a hero with potions cannot lose`);
    return `${drunk} drinks`;
  });

  suite.test('ui.flee.fails', 'battle: Run can fail: over 30 tries some fail and some get away', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)'); await setup(t, `a.grantXp(${D.rules.level_xp[4]}); T.shut()`);
    let fled = 0, failed = 0;
    for (let i = 0; i < 30 && !(fled && failed); i++) {
      await t.ev('TA.setHp(T.hero().maxHp)');
      t.must(await hook(t, `actions.forceBattle(${JSON.stringify(weak.id)})`), 'set-up: forceBattle returned false'); await sleep(60);
      await cmd(t, 'Run', KEY.B); await t.readAll();
      const st = await t.state(); if (st.battle) failed++; else if (st.result === 'fled') fled++; else if (st.result === 'lose') failed++;
      await setup(t, 'T.shut()'); await t.ev('T.idle()');
    }
    t.must(failed > 0 && fled > 0, `${fled} of ${fled + failed} tries to run got away, ${failed} failed: ${failed ? 'running never works' : 'running always works, so no fight has to be fought'}`);
    return `${fled} away, ${failed} failed`;
  }, { timeout: 180000 });

  suite.test('ui.flee.boss', 'battle: there is no running from a story boss (Run five times, the fight goes on)', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const q = W.quests.main[0], k = q.steps.findIndex((s) => s.type === 'defeat');
    await t.ev(`T.hookPlay('main', 0, ${k})`);
    await press(t, await t.ev(`T.quest('main', 0).steps[${k}].at`)); await t.readAll();
    t.must((await t.state()).battle, `set-up: A on ${q.steps[k].as} started no battle`);
    await t.ev('TA.setHp(99999)');
    for (let i = 0; i < 5; i++) { await cmd(t, 'Run', KEY.B); await t.readAll(); if (!(await t.state()).battle) break; }
    const st = await t.state();
    t.must(st.battle, `B ended the fight with ${q.steps[k].as} (result ${st.result}): every boss can be walked away from`);
  });

  suite.test('ui.defeat.price', 'defeat: a lost battle costs something (gold, things or HP) and the hero wakes in a settlement, not where he fell', async (t) => {
    await t.play(); await setup(t, `a.setEncounters(false); a.addGold(100); a.addItem('dagger')`);
    const zones = await hook(t, 'world.zones'), safe = new Set(zones.filter((z) => isSettlement(W.zones.find((d) => d.id === z.id))).map((z) => z.map));
    const wild = zones.find((z) => !safe.has(z.map)); await t.ev(`T.go(${JSON.stringify(wild.map)})`);
    const s0 = await t.state(), n0 = await hook(t, 'inventory.length');
    t.must(await hook(t, `actions.forceBattle(${JSON.stringify(strong.id)})`), 'set-up: forceBattle returned false'); await sleep(100);
    for (let i = 0; i < 80 && (await t.state()).battle; i++) await t.A(40);
    const res = (await t.state()).result; t.must(res === 'lose', `set-up: the fight with ${strong.name} ended with ${res}`);
    const told = [], unfit = [];
    for (let i = 0; i < 40; i++) { const st = await t.state(); if (!st.dialogue) { if (st.idle) break; await sleep(40); continue; } told.push(st.page); unfit.push(...(await layout(t, `defeat page ${i + 1}`))); await t.A(60); }
    await t.ev('T.idle()'); await sleep(600);
    const s1 = await t.state(), n1 = await hook(t, 'inventory.length');
    const price = [s1.gold < s0.gold && `${s0.gold - s1.gold} gp`, n1 < n0 && `${n0 - n1} things`, s1.hp < s1.maxHp && `HP ${s1.hp}/${s1.maxHp}`].filter(Boolean);
    t.must(price.length, `the defeat cost nothing: gold ${s0.gold} -> ${s1.gold}, HP ${s1.hp}/${s1.maxHp}, the bag as it was; it said ${JSON.stringify(told.slice(-1)[0] || '')}. Losing is the best healing in the game`);
    const homes = new Set((W.sites || []).filter((x) => safe.has((zones.find((z) => z.id === x.zone) || {}).map)).map((x) => x.id));   // the houses of the settlements
    t.must(safe.has(s1.map) || homes.has(s1.map), `the hero wakes on ${s1.map} at ${s1.x},${s1.y}, where he fell (${s0.map}); that is neither a settlement nor a house of one`);
    t.must(!s1.battle && s1.idle, 'after the defeat the game does not take input');
    t.must(!unfit.length, unfit.slice(0, 2).join(' | '));
    return `cost ${price.join(', ')}; woke on ${s1.map}`;
  });

  // The rule (author, item 14): a defeat out in the world always ends at home: the hero wakes in the start town, by the free bed
  // (landmarks.bed) when there is one, whichever outcome is drawn, and the telling names the place. A defeat inside a site (the
  // crypt, a house) still wakes him at that site's door, on the same map, so the fight can be tried again.
  suite.test('ui.defeat.home', 'defeat: from three far zones and for every outcome the hero wakes at home in the start town (by his bed), and the telling names the place; inside a site he wakes at its door', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const zones = await hook(t, 'world.zones'), z0 = W.zones.find((z) => z.id === startZone), town = zones.find((z) => z.id === startZone).map;
    const home = new Set([town, ...(W.sites || []).filter((x) => x.zone === startZone).map((x) => x.id)]), bed = await hook(t, 'landmarks.bed');
    const far = W.zones.filter((z) => !isSettlement(z)).sort((a, b) => (Math.abs(b.x - z0.x) + Math.abs(b.y - z0.y)) - (Math.abs(a.x - z0.x) + Math.abs(a.y - z0.y))).slice(0, 3);
    const outcomes = (D.defeat && D.defeat.outcomes) || [null], bad = [];
    const lose = async (map, o) => { await t.ev(`T.go(${JSON.stringify(map)})`); await setup(t, 'a.addGold(100)'); if (o) await t.ev(`TA.forceDefeat(${JSON.stringify(o)})`);
      t.must(await hook(t, `actions.forceBattle(${JSON.stringify(strong.id)})`), 'set-up: forceBattle returned false'); await sleep(80);
      for (let i = 0; i < 80 && (await t.state()).battle; i++) await t.A(40);
      t.must((await t.state()).result === 'lose', `set-up: the fight with ${strong.name} was not lost`);
      const told = await t.readAll(); await t.ev('T.idle()'); await sleep(500); await t.ev('TA.setHp(T.hero().maxHp)'); return { told, st: await t.state() }; };
    for (const z of far) for (const o of outcomes) { const r = await lose(zones.find((x) => x.id === z.id).map, o), w = `${z.name}${o ? ', outcome ' + o : ''}`;
      if (!home.has(r.st.map)) { bad.push(`${w}: he wakes on ${r.st.map}, not at home in ${z0.name}`); continue; }
      if (bed && (r.st.map !== bed.map || Math.abs(r.st.x - bed.x) + Math.abs(r.st.y - bed.y) > 3)) bad.push(`${w}: he wakes at ${r.st.map} ${r.st.x},${r.st.y}, not by his bed (${bed.map} ${bed.x},${bed.y})`);
      if (!r.told.some((p) => p.includes(z0.name) || /\b(home|your (own )?(bed|house))\b/i.test(p))) bad.push(`${w}: the telling does not say where he wakes (${JSON.stringify(r.told.slice(-1)[0] || '')})`); }
    const site = (W.sites || []).find((x) => (x.encounters || []).length);
    if (site) { const r = await lose(site.id, outcomes[0]); if (r.st.map !== site.id) bad.push(`a defeat inside ${site.name} wakes him on ${r.st.map}: there he must wake at the site's door, to try again`); }
    await t.ev('TA.forceDefeat(null)');
    t.must(!bad.length, `${bad.length} of ${far.length * outcomes.length + (site ? 1 : 0)} defeats: ${bad.slice(0, 3).join('; ')}`);
    return `${far.map((z) => z.name).join(', ')} x ${outcomes.length} outcomes`;
  }, { timeout: 240000 });

  suite.test('ui.battle.names', 'battle: the last boss\'s name is drawn whole (or the short battle name the data gives), not cut mid-word', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const n = W.quests.main.length - 1, q = W.quests.main[n], k = q.steps.findIndex((s) => s.type === 'defeat'), st = q.steps[k];
    for (let i = 0; i < n; i++) await t.ev(`T.hookPlay('main', ${i})`, 60000);
    await t.ev(`T.hookPlay('main', ${n}, ${k})`);
    await press(t, await t.ev(`T.quest('main', ${n}).steps[${k}].at`)); await t.readAll();
    t.must((await t.state()).battle, `set-up: A on ${st.as} started no battle`);
    await t.ev('TA.setHp(99999)'); await t.A(150);
    const view = (await t.texts()).filter((x) => x.y < 144).map((x) => x.text).join('\n'), ok = [st.as, st.short].filter(Boolean).some((nm) => view.includes(nm));
    const bad = await layout(t, 'boss battle');
    await setup(t, 'T.shut()');
    t.must(ok, `the battle screen shows neither ${JSON.stringify(st.as)}${st.short ? ' nor ' + JSON.stringify(st.short) : ' (the step has no `short` name)'}; it shows ${JSON.stringify(view.split('\n').filter((l) => l.includes(st.as.slice(0, 5))))}`);
    t.must(!bad.length, bad.join(' | '));
  }, { timeout: 180000 });

  // ---------------------------------------------------------------- the author's notes on v0.6 (feedback/round4-author.md)
  const VIEWBOX = [0, 0, 256, 144], dark = (c) => c[0] < 48 && c[1] < 48 && c[2] < 48;
  const viewText = async (t) => (await t.texts()).filter((x) => x.y < 144).map((x) => x.text).join('\n');

  suite.test('ui.title.animated', 'title: something moves on the title screen (two pictures 0.5 s apart differ)', async (t) => {
    await t.open(); t.must(await t.ev('T.onTitle()'), 'a fresh page shows no title');
    let most = 0; for (let i = 0; i < 4; i++) most = Math.max(most, await t.motion(VIEWBOX, 500));
    t.must(most >= 0.0005, `the title is a still picture: ${(100 * most).toFixed(2)} % of its pixels change in half a second (wanted at least 0.05 %)`);
    return `${(100 * most).toFixed(2)} % of the pixels move`;
  });

  suite.test('ui.title.nostatus', 'title: the status bar (HP, level, gold, the place) is not drawn on the title screen', async (t) => {
    await t.open(); t.must(await t.ev('T.onTitle()'), 'a fresh page shows no title');
    const bar = (await strip(t)).filter((s) => /HP\s*\d|Lv\.?\s*\d|\d\s*gp\b|START:/i.test(s) || W.zones.some((z) => z.name === s.trim()));
    t.must(!bar.length, `the title shows the status bar: ${bar.join(' | ')}`);
  });

  suite.test('ui.intro', 'a new game opens with the story: after START the introduction (meta.story of the data) is told before the hero can move', async (t) => {
    await t.open(); await t.pastTitle();
    let told = ''; for (let i = 0; i < 60; i++) { const st = await t.state(); told += ' ' + (await viewText(t)); if (!st.dialogue && st.idle && i > 0) break; await t.A(120); }
    const sq = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, ''), miss = W.meta.story.filter((line) => !sq(told).includes(sq(line).slice(0, 40)));
    t.must(miss.length < W.meta.story.length, `after START the game is on the map at once: none of the ${W.meta.story.length} sentences of the story's introduction is shown (the first: ${JSON.stringify(W.meta.story[0].slice(0, 60))})`);
    t.must(!miss.length, `${miss.length} of the ${W.meta.story.length} sentences of the introduction are not shown`);
    const st = await t.state(); t.must(st.idle && !st.dialogue, 'after the introduction the game does not take input');
  });

  suite.test('ui.shop.scroll', 'shop: every ware of every merchant comes under the cursor with ArrowDown, one row a tap; the list shows that it goes on; the last ware can be bought', async (t) => {
    await t.play(); await setup(t, 'a.addGold(20000); a.setEncounters(false)');
    const bad = [];
    for (const m of W.npcs.filter((n) => n.role === 'merchant')) { await openShop(t, m.id);
      for (let i = 0; i < m.stock.length; i++) { const it = D.item[m.stock[i]], mk = await t.ev('T.marked()');
        if (!mk.some((l) => row(it.name).test(l))) { bad.push(`${m.name}: after ${i} taps of ArrowDown the cursor is on ${JSON.stringify(mk[0] || '')}, not on ${it.name}`); break; }
        const rows = (await t.lines()).filter((l) => m.stock.some((id) => row(D.item[id].name).test(l))).length, more = /[▼▲↓↑…]|\bmore\b|\d+\s*\/\s*\d+/i.test(await viewText(t));
        if (m.stock.length > 5 && rows < 5 && !more) { bad.push(`${m.name}: with the cursor on ware ${i + 1} of ${m.stock.length} only ${rows} wares are drawn and nothing says the list goes on`); break; }
        if (i < m.stock.length - 1) await t.key(KEY.down, 30, 240); }
      const last = D.item[m.stock[m.stock.length - 1]], g0 = (await t.state()).gold;
      await t.A(200); if ((await t.state()).gold === g0) { await t.readAll(); await t.A(200); } await t.readAll();
      if (!bad.length && Math.abs(g0 - (await t.state()).gold - last.cost_gp) > 0.01) bad.push(`${m.name}: the last ware (${last.name}) could not be bought`);
      await setup(t, 'T.shut()'); }
    t.must(!bad.length, bad.slice(0, 3).join(' | '));
  }, { timeout: 240000 });

  suite.test('ui.battle.nobox', 'battle: the foe is drawn on the battle ground, not on a black box (under a quarter of the area around it is near-black)', async (t) => {
    await t.play(); const bad = [];
    for (const m of [weak, strong, D.mon[W.quests.main[0].steps.find((s) => s.type === 'defeat').monster]]) {
      await fight(t, m.id, 2); const all = (await t.ev('T.sprites()')).filter((x) => x.scene === 'UI' && x.y < 144 && x.scale >= 2), foe = all.sort((a, b) => b.w * b.h - a.w * a.h)[0];
      t.must(foe, 'no foe picture is drawn in the battle');
      const sh = await t.share([Math.max(0, foe.x - 4), Math.max(0, foe.y - 2), Math.min(foe.w + 8, 256 - foe.x), foe.h + 4], dark);
      if (sh >= 0.25) bad.push(`${m.name}: ${Math.round(100 * sh)} % of the area around the foe is near-black`);
      await setup(t, 'T.shut()'); await t.ev('T.idle()'); }
    t.must(!bad.length, bad.join(' | ') + ': the foe stands on a dark box');
  });

  suite.test('ui.map.foes', 'map: every quest foe standing on a map is drawn with its picture of data/sprites.json (the same one the battle shows)', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)'); const bad = []; let n = 0;
    for (const q of D.quests) for (let k = 0; k < q.steps.length; k++) { const st = q.steps[k]; if (st.type !== 'defeat') continue;
      const want = (D.sprites.monsters || {})[st.monster]; if (!want) continue;
      const at = await t.ev(`T.quest('${q.kind}', ${q.index}).steps[${k}].at`); await t.ev(`T.go(${JSON.stringify(at.map)})`); await sleep(60);
      const got = (await t.ev('T.sprites()')).filter((x) => x.scene !== 'UI' && Math.abs(x.cx - (at.x * 16 + 8)) < 1 && Math.abs(x.cy - (at.y * 16 + 8)) < 1).sort((a, b) => b.depth - a.depth)[0];
      n++; if (!got) bad.push(`${st.as}: nothing is drawn on its tile`); else if (got.key !== want[0] || String(got.frame) !== String(want[1])) bad.push(`${st.as} (${st.monster}) is drawn with ${got.key} ${got.frame}, sprites.json says ${want[0]} ${want[1]}`); }
    t.must(!bad.length, `${bad.length} of ${n} quest foes have the wrong picture on the map: ${bad.slice(0, 3).join('; ')}`);
    return `${n} foes`;
  }, { timeout: 180000 });

  suite.test('ui.items.sections', 'Items: what is worn and what is in the bag are two labelled groups', async (t) => {
    await t.play(); await fill(t); await t.menu('Items'); await t.A(200); await setup(t, 'if (g.dialogueOpen) a.pressA()');
    const all = (await t.lines()).join('\n');
    t.must(/\b(worn|wearing|equipped|equipment)\b/i.test(all) && /\b(bag|pack|carried|carrying)\b/i.test(all), `the Items page has no heading for worn gear and one for the bag (it shows: ${JSON.stringify(all.split('\n').filter((l) => !/^\s*>?\s*(Party|Items|Quest|Map|Credits|Save|Load|Close)$/.test(l)).slice(-6))})`);
  });

  suite.test('ui.items.hint', 'Items: the row under the cursor says in words what A will do (drink, wear or wield, take off)', async (t) => {
    await t.play(); await fill(t); await setup(t, `a.equip('shield')`);
    await itemsList(t, [...bagNames, D.item.shield.name]);
    const says = async (name, re) => { t.must(await t.cursorTo(row(name), { max: 24 }), `the cursor never reaches "${name}"`); const all = (await t.lines()).join('\n'); t.must(re.test(all), `with the cursor on "${name}" nothing on the page says what A does (wanted ${re})`); };
    await says(D.item['potion-of-healing'].name, /\b(drink|use)\b/i);
    await says(D.item['chain-shirt'].name, /\b(wear|equip|put on)\b/i);
    await says(D.item.shield.name, /\b(take off|remove|unequip)\b/i);
  });

  suite.test('ui.items.compare', 'Items: a piece of gear under the cursor shows what it changes (armour class or damage: now and with it, better or worse); a thing with no use says so', async (t) => {
    await t.play(); await fill(t);
    const h = await t.ev('T.hero()'), neu = D.item['chain-shirt'], ac1 = await t.ev(`(() => { const a = window.__game.actions; a.equip('chain-shirt'); const v = T.hero().ac; a.equip(${JSON.stringify(h.equipment.armor)}); return v; })()`);
    await itemsList(t, bagNames);
    t.must(await t.cursorTo(row(neu.name), { max: 24 }), `the cursor never reaches "${neu.name}"`);
    let all = await viewText(t);
    t.must(new RegExp(`\\b${h.ac}\\b[\\s\\S]{0,16}\\b${ac1}\\b`).test(all), `with the cursor on "${neu.name}" the page does not show the armour class now and with it (${h.ac} and ${ac1})`);
    t.must(/better|worse|▲|▼|\+\d/i.test(all), 'nothing marks the change as better or worse');
    t.must(await t.cursorTo(row(D.item.dagger.name), { max: 24 }), 'the cursor never reaches the dagger'); all = await viewText(t);
    t.must(all.includes(D.item[h.equipment.weapon].damage) && all.includes(D.item.dagger.damage), `with the cursor on the dagger the page does not show the damage now (${D.item[h.equipment.weapon].damage}) and with it (${D.item.dagger.damage})`);
    t.must(await t.cursorTo(row(D.item.torch.name), { max: 24 }), 'the cursor never reaches the torch'); all = await viewText(t);
    t.must(/can(no|')t|no use|not usable|nothing to do/i.test(all), 'a thing that cannot be used (a torch) does not say so');
  });

  suite.test('ui.shop.compare', 'shop: the ware under the cursor shows what it would change for the hero (armour class or damage: now and with it, better or worse)', async (t) => {
    await t.play(); await setup(t, 'a.addGold(500); a.setEncounters(false)');
    const m = W.npcs.find((n) => n.role === 'merchant' && n.stock.includes('chain-shirt') && n.stock.some((id) => D.item[id].kind === 'weapon')) || merchant;
    const arm = D.item[m.stock.find((id) => D.item[id].kind === 'armor')], wep = D.item[m.stock.find((id) => D.item[id].kind === 'weapon' && D.item[id].damage !== D.item[W.meta.start.equipment.weapon].damage)];
    const h = await t.ev('T.hero()'), ac1 = await t.ev(`(() => { const a = window.__game.actions; a.addItem(${JSON.stringify(arm.id)}); a.equip(${JSON.stringify(arm.id)}); const v = T.hero().ac; a.equip(${JSON.stringify(h.equipment.armor)}); return v; })()`);
    await openShop(t, m.id);
    t.must(await t.cursorTo(row(arm.name), { max: m.stock.length + 2 }), `the cursor never reaches "${arm.name}"`);
    let all = await viewText(t);
    t.must(new RegExp(`\\b${h.ac}\\b[\\s\\S]{0,16}\\b${ac1}\\b`).test(all), `with the cursor on "${arm.name}" the shop does not show the hero's armour class now and with it (${h.ac} and ${ac1}); it shows only the name and the price`);
    t.must(/better|worse|same|▲|▼|\+\d/i.test(all), 'nothing marks the change as better or worse');
    t.must(await t.cursorTo(row(wep.name), { max: m.stock.length + 2, dir: 'up' }), `the cursor never reaches "${wep.name}"`); all = await viewText(t);
    t.must(all.includes(D.item[h.equipment.weapon].damage) && all.includes(wep.damage), `with the cursor on "${wep.name}" the shop does not show the damage now (${D.item[h.equipment.weapon].damage}) and with it (${wep.damage})`);
  });

  // The rule: the status bar belongs to the map. It is drawn while the hero walks the map (also under a dialogue box or the shop,
  // where the map stays in view); it is not drawn on the title (ui.title.nostatus) nor in a battle, and the battle screen then
  // uses the whole canvas, down to its bottom edge. (The Start menu may keep it or hide it.)
  suite.test('ui.status.maponly', 'status bar: on the map only: in a battle the place and the gold are not drawn, and the battle screen uses the full height of the canvas', async (t) => {
    await t.play(); const zone = W.zones.find((z) => z.id === startZone).name;
    const onMap = (await strip(t)).join(' | '); t.must(/\d\s*gp\b/i.test(onMap), `set-up: on the map the bar shows no gold (${onMap})`);
    await fight(t, weak.id);
    const lines = await t.lines(), bar = lines.filter((l) => /\d\s*gp\b/i.test(l) || l.trim() === zone || /START:\s*menu/i.test(l));
    const low = [...(await t.texts()), ...(await t.ev('T.sprites()'))].filter((x) => x.scene === 'UI' && x.y + x.h > 150 && !bar.includes(x.text)).length;
    await setup(t, 'T.shut()');
    t.must(!bar.length, `in a battle the status bar is still drawn: ${bar.join(' | ')}`);
    t.must(low > 0, 'the battle screen leaves the bottom quarter of the canvas empty: it should use the full height once the bar is gone');
  });

  // The battle screen the author chose (layout A, 22 Nov): a command menu Attack / Item / Run with a cursor; the roll told as a
  // narration line; the foe's portrait (data/portraits.json, 32 x 32 at 2x) on a backdrop strip of the zone's biome; the whole canvas.
  suite.test('ui.battle.menu', 'battle: a command menu Attack / Item / Run with a cursor: the arrows move it, A on Attack fights a round, Item opens the list of the bag and B backs out', async (t) => {
    await t.play(); await setup(t, `a.addItem('potion-of-healing')`); await fight(t, weak.id); await t.ev('TA.setHp(99999)');
    t.must(await hasMenu(t), `the battle shows no command menu with Attack, Item and Run under a cursor (it shows: ${JSON.stringify((await t.lines()).filter((l) => /attack|run|item|start/i.test(l)))})`);
    t.must((await t.ev('T.marked()')).some((l) => /^Attack/i.test(l)), 'the cursor does not start on Attack (A alone must still fight a round)');
    for (const w of ['Item', 'Run', 'Attack']) t.must(await t.cursorTo(new RegExp('^' + w + '\\b', 'i'), { max: 4 }), `the cursor never reaches "${w}"`);
    const l0 = (await t.state()).log; await t.A(200); t.must((await t.state()).log > l0 || !(await t.state()).battle, 'A on Attack told nothing in the log');
    if ((await t.state()).battle) { await t.readAll(); await cmd(t, 'Item', KEY.START);
      t.must((await t.ev('T.marked()')).some((l) => row(D.item['potion-of-healing'].name).test(l)), 'Item opens no list of the bag with a cursor');
      await t.B(200); t.must(await hasMenu(t) && (await t.state()).battle, 'B does not go back from the item list to the command menu'); }
    await setup(t, 'T.shut()');
  });

  suite.test('ui.battle.controls', 'battle: only controls that work are shown, in words: no "START: menu", no bare "?", "-" or die label', async (t) => {
    await t.play(); await fight(t, weak.id);
    const lines = await t.lines(), bad = [];
    if (lines.some((l) => /\bSTART\b\s*[:=]?\s*menu/i.test(l))) bad.push('"START: menu" is shown, but START opens no menu in a battle');
    const blanks = lines.filter((l) => /^[?\-–]$/.test(l.trim())), labels = lines.filter((l) => /^d\d+$/.test(l.trim()));
    if (blanks.length) bad.push(`${blanks.length} boxes show a bare "?" or "-" with nothing to say what they are`);
    if (labels.length) bad.push(`bare die labels (${[...new Set(labels)].join(', ')}) stand under numbers that are not that die`);
    if (!['attack', 'run'].every((w) => lines.some((l) => new RegExp('\\b' + w + '\\b', 'i').test(l)))) bad.push('the words Attack and Run are not on the screen');
    await setup(t, 'T.shut()');
    t.must(!bad.length, bad.join('; '));
  });

  suite.test('ui.battle.portrait', 'battle: a foe with a portrait in data/portraits.json is drawn with it (32 x 32 at 2x); a foe without one keeps its old picture', async (t) => {
    const P = D.portraits; t.must(P, 'data/portraits.json is missing: every foe is a 16 x 16 map picture drawn at 3x');
    const map = P.monsters || P.portraits || P, ids = D.monsters.map((m) => m.id), with_ = ids.filter((id) => map[id]).slice(0, 3), without = ids.find((id) => !map[id]);
    t.must(with_.length, 'data/portraits.json maps no creature of the data');
    await t.play(); const bad = [], big = async () => (await t.ev('T.sprites()')).filter((x) => x.scene === 'UI' && x.scale >= 2).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    for (const id of with_) { await fight(t, id, 2); const f = await big(), e = map[id], fr = Array.isArray(e) ? e[e.length - 1] : e.frame;
      if (!f || f.w !== 64 || f.h !== 64) bad.push(`${id}: the foe is drawn ${f ? f.w + ' x ' + f.h : 'not at all'}, not 64 x 64`); else if (fr != null && String(f.frame) !== String(fr)) bad.push(`${id}: frame ${f.frame}, the map says ${fr}`);
      await setup(t, 'T.shut()'); await t.ev('T.idle()'); }
    if (without) { await fight(t, without, 2); if (!(await big())) bad.push(`${without} (no portrait) is not drawn at all`); await setup(t, 'T.shut()'); }
    t.must(!bad.length, bad.join('; '));
  });

  suite.test('ui.battle.backdrop', 'battle: the backdrop behind the fight is the zone\'s biome: the same foe in two biomes stands before two different pictures', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const zones = await hook(t, 'world.zones'), pick = [zones.find((z) => z.biome === 'volcanic'), zones.find((z) => z.biome === 'snow'), zones.find((z) => z.biome === 'forest' || z.biome === 'swamp')].filter(Boolean), sig = [];
    for (const z of pick) { await t.ev(`T.go(${JSON.stringify(z.map)})`); await fight(t, weak.id, 2); sig.push(await t.signature(0, 36 / 192, 0.6, 100 / 192)); await setup(t, 'T.shut()'); await t.ev('T.idle()'); }
    const d = []; for (let i = 0; i < sig.length; i++) for (let j = i + 1; j < sig.length; j++) d.push(sigDist(sig[i], sig[j]));
    t.must(d.length && Math.min(...d) >= 0.2, `the battle looks the same in ${pick.map((z) => z.biome).join(', ')} (colour distance ${d.map((x) => x.toFixed(2)).join(', ')}; wanted 0.2 or more)`);
  });

  suite.test('ui.battle.narration', 'battle: the log tells the fight in whole short sentences (the roll as one line "d20: 15 + 5 = 20 vs AC 18"), naming who acts, in varied words; win and flight are told; no line over 29 letters, nothing cut', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const who = (await t.ev('T.hero().name')), foe = [...D.monsters].filter((m) => m.hp >= 60 && m.name.length >= 14).sort((a, b) => a.xp - b.xp)[0] || strong;
    await fight(t, foe.id, 3); await t.ev('TA.setHp(99999)');
    const cut = []; let log = [];
    for (let i = 0; i < 24 && (await t.state()).battle; i++) { await t.A(60); log = await t.ev('window.__game.battle.log.slice()');
      const drawn = (await t.texts()).map((x) => x.text).join('\n').toLowerCase().replace(/[^a-z0-9]/g, ''), lastLine = String(log[log.length - 1] || '').split('\n').pop();
      await t.ev(`window.__longest = Math.max(window.__longest || 0, ...T.lines().map(l => l.trimEnd().length))`);
      if ((await t.state()).battle && !drawn.includes(lastLine.toLowerCase().replace(/[^a-z0-9]/g, ''))) cut.push(lastLine); }
    await t.ev('TA.setHp(T.hero().maxHp)'); await setup(t, 'T.shut()');
    log = log.flatMap((l) => String(l).split('\n')).filter((l) => l.trim());
    const rollLine = (l) => /^d20: \d+ [+-] \d+ = \d+ vs AC \d+\.?$/.test(l.trim());    // layout A: the roll is one line of the telling
    const sentence = (l) => rollLine(l) || (/^[A-Z"'].*[.!?…"']$/.test(l.trim()) && l.trim().split(/\s+/).length >= 2 && !/=/.test(l) && !/\b[A-Z]{3,}\b/.test(l.replace(/\bHP\b|\bXP\b|\bAC\b/g, '')));
    const names = (l) => new RegExp(`\\b(you|your|${esc(who)}|${esc(foe.name)}|${esc(foe.name.split(' ').pop())})\\b`, 'i').test(l);
    const notS = log.filter((l) => !sentence(l)), anon = log.filter((l) => !names(l));
    const shape = (l) => l.replace(/\d+/g, '#'), mine = new Set(log.filter((l) => /^(you|your)\b/i.test(l) || l.startsWith(who)).map(shape)), theirs = new Set(log.filter((l) => l.toLowerCase().includes(foe.name.toLowerCase().split(' ').pop()) && !(/^(you|your)\b/i.test(l) || l.startsWith(who))).map(shape));
    // the three endings
    const ends = {};
    t.must(await hook(t, `actions.forceBattle(${JSON.stringify(weak.id)})`), 'set-up: forceBattle returned false'); for (let i = 0; i < 80 && (await t.state()).battle; i++) await t.A(40);
    ends.win = await t.ev('window.__game.battle.log.slice(-1)[0]'); await t.readAll(); await setup(t, 'T.shut()'); await t.ev('T.idle()');
    for (let i = 0; i < 30 && !ends.flee; i++) { await t.ev('TA.setHp(T.hero().maxHp)'); await hook(t, `actions.forceBattle(${JSON.stringify(weak.id)})`); await sleep(60); await cmd(t, 'Run', KEY.B); await t.readAll();
      if ((await t.state()).result === 'fled') ends.flee = await t.ev('window.__game.battle.log.slice(-1)[0]'); await setup(t, 'T.shut()'); await t.ev('T.idle()'); }
    const bad = [];
    if (notS.length) bad.push(`${notS.length} of ${log.length} log lines are not sentences, such as ${JSON.stringify(notS.slice(-2))}`);
    if (anon.length > log.length * 2 / 3) bad.push(`only ${log.length - anon.length} of ${log.length} lines name who acts`);
    const long = (await t.ev('window.__longest || 0'));
    if (long > 29) bad.push(`a line of ${long} letters is drawn in the battle: the box holds 29`);
    if (mine.size < 3 || theirs.size < 3) bad.push(`the hero's blows are told in ${mine.size} ways and the foe's in ${theirs.size} (wanted at least 3 each over ${log.length} lines)`);
    for (const [k, l] of Object.entries(ends)) if (!l || !sentence(l)) bad.push(`the ${k} is not told in a sentence (${JSON.stringify(l || '')})`);
    if (!ends.flee) bad.push('no flight could be told (B never got away in 30 tries)');
    if (cut.length) bad.push(`${cut.length} lines were cut in the log box, such as ${JSON.stringify(cut[0])}`);
    t.must(!bad.length, bad.join('; '));
  }, { timeout: 180000 });

  suite.test('ui.chests.loot', 'chests: every chest in a house (window.__game.chests) gives loot once, from the data\'s loot table, the same after a reload of the save, not the same in every game', async (t) => {
    const table = W.loot || (W.meta && W.meta.loot);
    const open1 = async () => { await t.play(); await setup(t, 'a.setEncounters(false)'); return (await hook(t, 'chests')) || null; };
    const chests = await open1();
    t.must(Array.isArray(chests) && chests.length, 'window.__game.chests is missing or empty: no house has a chest with loot');
    t.must(table, 'data/world.json has no `loot` table for chests');
    const take = async (c) => { const b = await t.ev('({ inv: window.__game.inventory.slice(), gold: window.__game.gold })'); await press(t, c); const said = await t.readAll();
      const a = await t.ev('({ inv: window.__game.inventory.slice(), gold: window.__game.gold })'); return { got: [...a.inv.filter((n, i) => a.inv.indexOf(n) === i && a.inv.filter((x) => x === n).length > b.inv.filter((x) => x === n).length), ...(a.gold > b.gold ? [`${a.gold - b.gold} gp`] : [])].join(', '), said }; };
    await setup(t, 'a.save(); T.shut()');
    const first = []; for (const c of chests) { const r = await take(c); t.must(r.got, `the chest at ${c.map} ${c.x},${c.y} gave nothing; it said ${JSON.stringify(r.said[0] || '')}`); first.push(r.got);
      const again = await take(c); t.must(!again.got, `the chest at ${c.map} ${c.x},${c.y} gave loot a second time`); }
    await setup(t, 'a.load()'); await t.ev('T.idle()'); await setup(t, 'T.shut()');
    const second = []; for (const c of chests) second.push((await take(c)).got);
    t.eq(second, first, 'after loading the save made before the chests were opened, the loot');
    let differs = false; for (let i = 0; i < 3 && !differs; i++) { const cs = await open1(), now = []; for (const c of cs) now.push((await take(c)).got); differs = JSON.stringify(now) !== JSON.stringify(first); }
    t.must(differs, 'three new games gave exactly the same loot in every chest: it is not random');
    return `${chests.length} chests`;
  }, { timeout: 240000 });

  suite.test('ui.doors.houses', 'houses: every settlement has house doors (window.__game.doors), and walking into each leads to an interior and back out', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const doors = (await hook(t, 'doors')) || null, zones = await hook(t, 'world.zones');
    t.must(Array.isArray(doors) && doors.length, 'window.__game.doors is missing: only the hero\'s own house can be entered');
    const towns = zones.filter((z) => isSettlement(W.zones.find((d) => d.id === z.id))), none = towns.filter((z) => !doors.some((d) => d.map === z.map)).map((z) => z.name);
    t.must(!none.length, `no house can be entered in ${none.join(', ')}`);
    const zoneMaps = new Set(zones.map((z) => z.map)), bad = [];
    for (const d of doors) { const s = await t.ev(`T.standBy(${JSON.stringify(d)})`).catch(() => null);
      if (!s) { bad.push(`the door at ${d.map} ${d.x},${d.y} cannot be reached`); continue; }
      await t.arrow(s.dir, 80); await t.ev('T.idle()'); await sleep(150); if ((await t.state()).map === d.map) { await t.A(300); await t.ev('T.idle()'); }
      const inside = (await t.state()).map; if (inside === d.map || zoneMaps.has(inside)) bad.push(`the door at ${d.map} ${d.x},${d.y} leads nowhere (the hero is on ${inside})`); }
    t.must(!bad.length, `${bad.length} of ${doors.length} doors: ${bad.slice(0, 3).join('; ')}`);
    return `${doors.length} doors in ${towns.length} settlements`;
  }, { timeout: 240000 });

  suite.test('ui.layout.quest', 'layout: the Quest page is drawn clean at every step of the story and with every side quest begun', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)'); const bad = [];
    const look = async (when) => { await t.menu('Quest'); bad.push(...(await layout(t, `Quest page ${when}`))); await t.B(150); await setup(t, 'T.shut()'); };
    for (let j = 0; j < W.quests.side.length; j++) await t.ev(`T.hookPlay('side', ${j}, 1)`, 60000);
    await look('with every side quest begun');
    for (let i = 0; i < W.quests.main.length; i++) for (let k = 1; k <= W.quests.main[i].steps.length; k++) { await t.ev(`T.hookPlay('main', ${i}, ${k})`, 60000); await look(`chapter ${i + 1} step ${k}`); if (bad.length > 3) break; }
    t.must(!bad.length, bad.slice(0, 3).join(' | '));
  }, { timeout: 240000 });

  // ---------------------------------------------------------------- every screen is drawn clean
  suite.test('ui.layout.talk', 'layout: every page every person of the world says fits the dialogue box (nothing below the text area)', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const folk = await hook(t, 'npcs'), bad = []; let pages = 0;
    for (const n of folk) { await press(t, n);
      for (let i = 0; i < 40; i++) { const st = await t.state(); if (!st.dialogue) break; pages++; bad.push(...(await layout(t, `${n.name} page ${i + 1}`))); await t.A(60); }
      await setup(t, 'T.shut()'); }
    t.must(pages >= folk.length, `only ${pages} pages from ${folk.length} people`);
    t.must(!bad.length, bad.slice(0, 3).join(' | '));
    return `${folk.length} people, ${pages} pages`;
  }, { timeout: 300000 });

  suite.test('ui.layout.battle', 'layout: the battle screen is drawn clean at the start, after two rounds and at its end, also for the longest creature names', async (t) => {
    await t.play(); const bad = [], long = [...D.monsters].sort((a, b) => b.name.length - a.name.length).slice(0, 4);
    await fight(t, weak.id); bad.push(...(await layout(t, `${weak.name}, start`)));
    await t.A(120); await t.A(120); bad.push(...(await layout(t, `${weak.name}, after two rounds`)));
    for (let i = 0; i < 60 && (await t.state()).battle; i++) await t.A(40);
    bad.push(...(await layout(t, `${weak.name}, the end`))); await t.readAll(); await setup(t, 'T.shut()');
    for (const m of long) { t.must(await hook(t, `actions.forceBattle(${JSON.stringify(m.id)})`), `set-up: forceBattle(${m.id}) returned false`); await sleep(120);
      bad.push(...(await layout(t, m.name))); await setup(t, 'T.shut()'); await t.ev('T.idle()'); }
    t.must(!bad.length, bad.slice(0, 3).join(' | '));
    return `${1 + long.length} foes`;
  });

  suite.test('ui.layout.shops', 'layout: every merchant\'s shop is drawn clean on every row', async (t) => {
    await t.play(); await setup(t, 'a.addGold(5000); a.setEncounters(false)');
    const bad = [], shops = W.npcs.filter((n) => n.role === 'merchant');
    for (const m of shops) { await openShop(t, m.id);
      for (let i = 0; i < m.stock.length; i++) { bad.push(...(await layout(t, `${m.name} row ${i + 1}`))); await t.arrow('down'); }
      await setup(t, 'T.shut()'); }
    t.must(!bad.length, bad.slice(0, 3).join(' | '));
    return `${shops.length} shops`;
  }, { timeout: 180000 });
}
