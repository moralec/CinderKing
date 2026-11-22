// js/db.js — load data, build tables, expose helpers, wrap Boot/Map create

const DB = {};
const SETUP = [];
const DRAWN = [];

function expose(name, get) {
  Object.defineProperty(hook, name, { configurable: true, enumerable: true, get: get });
}

function wrap(obj, name, make) {
  obj[name] = make(obj[name]);
}

function parseDice(text) {
  // '2d6+3' -> {n:2, d:6, k:3}, '1d8' -> {n:1, d:8, k:0}, '1' -> {n:0, d:0, k:1}, '1d4-1' -> {n:1, d:4, k:-1}
  const m = text.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (m) {
    return { n: parseInt(m[1]), d: parseInt(m[2]), k: parseInt(m[3] || '0') };
  }
  // plain number like '1'
  const plain = text.match(/^(\d+)$/);
  if (plain) {
    return { n: 0, d: 0, k: parseInt(plain[1]) };
  }
  return { n: 0, d: 0, k: 0 };
}

function rollDice(text, twice) {
  const { n, d, k } = parseDice(text);
  let sum = 0;
  const count = twice ? 2 * n : n;
  for (let i = 0; i < count; i++) {
    sum += roll(d);
  }
  return sum + k;
}

function mapOf(zoneId) {
  return DB.hand[zoneId] || zoneId;
}

function zoneOf(mapName) {
  for (const z of DB.world.zones) {
    if (mapOf(z.id) === mapName) return z;
  }
  return null;
}

(function () {
  // Start loading the five data files
  const loading = Promise.all([
    fetch('data/world.json').then(r => r.json()),
    fetch('data/srd/monsters.json').then(r => r.json()),
    fetch('data/srd/items.json').then(r => r.json()),
    fetch('data/srd/rules.json').then(r => r.json()),
    fetch('data/srd/ATTRIBUTION.md').then(r => r.text())
  ]);

  wrap(BootScene.prototype, 'create', old => function () {
    loading.then(([world, mon, items, rules, credit]) => {
      DB.world = world;
      DB.monsters = mon.monsters;
      DB.items = items.items;
      DB.rules = rules;
      DB.credit = credit;

      // By-id tables
      DB.mon = {};
      for (const m of DB.monsters) DB.mon[m.id] = m;

      DB.item = {};
      for (const it of DB.items) DB.item[it.id] = it;

      // thing = items + quest_items
      const thingList = [];
      for (const it of DB.items) thingList.push(it);
      for (const qi of (DB.world.quest_items || [])) thingList.push(qi);

      DB.thing = {};
      for (const t of thingList) DB.thing[t.id] = t;

      // named = by name (title-case)
      DB.named = {};
      for (const t of thingList) DB.named[t.name] = t;

      // hand: map zone ids to their map name
      DB.hand = {};
      DB.hand[DB.world.meta.start.zone] = 'town';
      for (const site of (DB.world.sites || [])) {
        if (site.id === 'crypt') {
          DB.hand[site.zone] = 'forest';
        }
      }

      // Run SETUP functions
      for (const f of SETUP) {
        try { f(); } catch (e) { console.error('SETUP ' + f.name + ': ' + e.message); }
      }
      DB.ready = true;

      old.call(this);
    });
  });

  wrap(MapScene.prototype, 'create', old => function () {
    old.call(this);
    for (const f of DRAWN) {
      try { f(this, MAPS[this.mapName]); } catch (e) { console.error('DRAWN ' + f.name + ': ' + e.message); }
    }
  });
})();
