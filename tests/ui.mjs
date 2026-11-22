// ui.mjs - the screens, with keys only: what a player's fingers can do. The hook sets a state up (a hurt hero, a full bag,
// gold, a fight) and reads the result; equip(), useItem(), buy(), sell() and winBattle() are never the thing under test.
//
// The keys: arrows, Space = A, Escape = B, Enter = START. What a list must look like for these tests to drive it:
// the row under the cursor starts with '>' (as the Start menu and the shop already do), ArrowUp/ArrowDown move it.
import { KEY, sleep } from './lib/harness.mjs';
import { offersRest, isSettlement } from './data.mjs';

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
/** in a battle: drink with the keys. START drinks at once or opens a list of the bag; A takes the row under the cursor. */
async function drink(t, name) {
  const n0 = await t.ev(`window.__game.inventory.length`);
  await t.START(200);
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
  suite.test('ui.rest.inn', 'rest: talking to an innkeeper (A through the talk) restores all HP, for a fee the hero can pay', async (t) => {
    const inn = W.npcs.find((n) => n.zone === startZone && offersRest(n)) || W.npcs.find((n) => offersRest(n) && isSettlement(W.zones.find((z) => z.id === n.zone)));
    t.must(inn, 'no person of the data offers a rest (a `rest` field, or an innkeeper by title)');
    await t.play(); await setup(t, 'a.addGold(50); a.setEncounters(false)'); await t.ev('TA.setHp(1)');
    const at = await t.ev(`window.__game.npcs.find(n => n.id === ${JSON.stringify(inn.id)})`), g0 = (await t.state()).gold;
    let said = [];
    for (let i = 0; i < 3 && (await t.state()).hp < (await t.state()).maxHp; i++) { await press(t, at); said = await t.readAll(); await setup(t, 'T.shut()'); }
    const st = await t.state();
    t.must(st.hp === st.maxHp, `after talking to ${inn.name} three times the hero has ${st.hp}/${st.maxHp} HP; the last talk: ${JSON.stringify(said.join(' ').slice(0, 110))}`);
    t.must(st.gold <= g0 && st.gold >= 0, `gold ${g0} -> ${st.gold}`);
    return `${inn.name}, fee ${g0 - st.gold} gp`;
  });

  suite.test('ui.rest.bed', 'rest: the bed in the hero\'s house (window.__game.landmarks.bed) restores all HP', async (t) => {
    await t.play(); await t.ev('TA.setHp(1)');
    const bed = await hook(t, 'landmarks.bed');
    t.must(bed && bed.map != null, 'window.__game.landmarks.bed is missing: there is no bed to rest in');
    await press(t, bed); await t.readAll();
    const st = await t.state(); t.must(st.hp === st.maxHp, `after A on the bed: ${st.hp}/${st.maxHp} HP`);
  });

  // ---------------------------------------------------------------- battle
  const fight = async (t, id, level = 5) => { await setup(t, `a.setEncounters(false); a.grantXp(${D.rules.level_xp[level - 1]}); T.shut()`);
    t.must(await hook(t, `actions.forceBattle(${JSON.stringify(id)})`), `set-up: forceBattle(${id}) returned false`); await sleep(150); };

  suite.test('ui.battle.potion', 'battle: a Potion of Healing can be drunk with the keys (START, then A on its row if a list opens)', async (t) => {
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

  suite.test('ui.flee.fails', 'battle: B (run) can fail: over 30 tries some fail and some get away', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)'); await setup(t, `a.grantXp(${D.rules.level_xp[4]}); T.shut()`);
    let fled = 0, failed = 0;
    for (let i = 0; i < 30 && !(fled && failed); i++) {
      await t.ev('TA.setHp(T.hero().maxHp)');
      t.must(await hook(t, `actions.forceBattle(${JSON.stringify(weak.id)})`), 'set-up: forceBattle returned false'); await sleep(60);
      await t.B(120);
      const st = await t.state(); if (st.battle) failed++; else if (st.result === 'fled') fled++; else if (st.result === 'lose') failed++;
      await setup(t, 'T.shut()'); await t.ev('T.idle()');
    }
    t.must(failed > 0 && fled > 0, `${fled} of ${fled + failed} tries to run got away, ${failed} failed: ${failed ? 'running never works' : 'running always works, so no fight has to be fought'}`);
    return `${fled} away, ${failed} failed`;
  }, { timeout: 180000 });

  suite.test('ui.flee.boss', 'battle: there is no running from a story boss (B five times, the fight goes on)', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const q = W.quests.main[0], k = q.steps.findIndex((s) => s.type === 'defeat');
    await t.ev(`T.hookPlay('main', 0, ${k})`);
    await press(t, await t.ev(`T.quest('main', 0).steps[${k}].at`)); await t.readAll();
    t.must((await t.state()).battle, `set-up: A on ${q.steps[k].as} started no battle`);
    await t.ev('TA.setHp(99999)');
    for (let i = 0; i < 5; i++) { await t.B(150); await t.readAll(); if (!(await t.state()).battle) break; }
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
    const told = await t.readAll(); await t.ev('T.idle()'); await sleep(600);
    const s1 = await t.state(), n1 = await hook(t, 'inventory.length');
    const price = [s1.gold < s0.gold && `${s0.gold - s1.gold} gp`, n1 < n0 && `${n0 - n1} things`, s1.hp < s1.maxHp && `HP ${s1.hp}/${s1.maxHp}`].filter(Boolean);
    t.must(price.length, `the defeat cost nothing: gold ${s0.gold} -> ${s1.gold}, HP ${s1.hp}/${s1.maxHp}, the bag as it was; it said ${JSON.stringify(told.slice(-1)[0] || '')}. Losing is the best healing in the game`);
    t.must(safe.has(s1.map), `the hero wakes on ${s1.map} at ${s1.x},${s1.y}, where he fell (${s0.map}); that is not a settlement`);
    t.must(!s1.battle && s1.idle, 'after the defeat the game does not take input');
    return `cost ${price.join(', ')}; woke on ${s1.map}`;
  });

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

  // ---------------------------------------------------------------- every screen is drawn clean
  suite.test('ui.layout.talk', 'layout: every page the people of the start zone say fits the dialogue box', async (t) => {
    await t.play(); await setup(t, 'a.setEncounters(false)');
    const folk = (await hook(t, 'npcs')).filter((n) => n.zone === startZone), bad = []; let pages = 0;
    for (const n of folk) { await press(t, n);
      for (let i = 0; i < 40; i++) { const st = await t.state(); if (!st.dialogue) break; pages++; bad.push(...(await layout(t, `${n.name} page ${i + 1}`))); await t.A(60); }
      await setup(t, 'T.shut()'); }
    t.must(pages >= folk.length, `only ${pages} pages from ${folk.length} people`);
    t.must(!bad.length, bad.slice(0, 3).join(' | '));
    return `${folk.length} people, ${pages} pages`;
  });

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
