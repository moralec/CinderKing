# Cheat sheet, round 4 (the world of Aldermoor)

`BRIEF.md` is the task and the contract. `CHEATSHEET.md` (round 1) still holds Phaser, rexUI and the tile numbers.

## What is new in this folder

```
data/world.json          60 KB  36 zones, 14 biomes, 52 people, 8 main + 12 side quests   -> read data/WORLD.md, not the file
data/srd/monsters.json   44 KB  83 monsters, challenge rating 0 to 17                       -> read data/srd/SCHEMA.md
data/srd/items.json      27 KB  87 items: 30 weapons, 12 armours, shield, gear, potions, magic
data/srd/rules.json       2 KB  levels, attack rolls, armour class, selling (read it whole)
data/srd/ATTRIBUTION.md         the licence text for the Credits page
selftest.py, tools/             the self-test, now with a round 4 part (do not edit tools/)
```

You write `PLAN.md` first, then your code in `js/`. Do not edit `data/`, `lib/`, `tools/`.

## Never read a data file whole: every entry is one line

```sh
python3 -c "import json; w = json.load(open('data/world.json')); print({k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in w.items()})"
grep -n '"id": "glasswind-dunes"' data/world.json       # a zone        grep -n '"id": "zafira"' data/world.json   # a person
python3 -c "import json; w = json.load(open('data/world.json')); print(json.dumps(w['biomes']['snow'], indent=1)); print(json.dumps(w['quests']['side'][3], indent=1))"
grep -n '"id": "ogre"' data/srd/monsters.json           # a monster     grep -n '"id": "frost-brand"' data/srd/items.json
cat data/srd/rules.json
```

## Loading the data (before the game starts)

```js
const get = f => fetch('data/' + f).then(r => r.json());
Promise.all([get('world.json'), get('srd/monsters.json'), get('srd/items.json'), get('srd/rules.json')]).then(([world, mon, items, rules]) => {
  /* build your tables, then */ new Phaser.Game({ ... });
});
```
`window.__game` may exist before the data has arrived; the round 4 fields must be there within a second of the page opening.
Fetch the files under exactly these paths: the test swaps them for changed ones to see whether the game follows its data.

## Phaser pieces you may need now

```js
layer.setTint(0xe6f2ff); sprite.setTint(0xff6040); sprite.clearTint();        // biome tints, monster tints
parseInt('#e6f2ff'.slice(1), 16)                                              // '#rrggbb' -> number
this.scene.start('zone', { id: 'saltmere' });                                 // ONE scene class can show every zone: init(data) { this.zoneId = data.id; }
this.scene.restart({ id: next });                                             // the same scene again with another zone
const t = this.make.tilemap({ data: grid, tileWidth: 16, tileHeight: 16 });   // grid built by your generator; -1 = empty
const g = this.add.graphics(); g.fillStyle(0x58a048).fillRect(x, y, 20, 12);  // a map page: 36 small rectangles
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }   // same seed, same map
```
Two tile sheets on one map: one tilemap layer per sheet (`assets/town.png` tiles and `assets/dungeon.png` tiles), the upper one
with `-1` where it is empty. Dice: `'2d6+3'` = two six-sided dice plus 3.

## The contract in short (the full text is in BRIEF.md)

| the test reads | it must be |
|---|---|
| `world.zones` (36) | `id, name, biome, x, y` as in the data; `map`; `encounters`; `exits { north, east, south, west }`; `visited` |
| `bestiary`, `catalog` | every monster / item of the data with its numbers |
| `npcs` (52) | `id, name, role, zone, map, x, y` |
| `quests.main` (8), `quests.side` (12) | `id, name, status, stage, steps [ { type, at { map, x, y } } ], reward` |
| `party[0]` | also `ac`, `attack { bonus, damage }`, `equipment { weapon, armor, shield }` |
| `battle` | also `enemy.id`, `enemy.ac`, `enemyRoll` |
| `gold`, `won`, `credits`, `shop` | numbers, a flag, the credits text, the open shop |
| `actions` | also `travel, forceBattle, winBattle, addItem, addGold, equip, unequip, buy, sell` |

## How the test plays (so you can try the same by hand in the self-test's browser or in your head)

1. Rounds 1 to 3 again, as before.
2. `travel` to each of the 36 zones: reads the whole map through `blocked(x, y)`, checks the exits, takes a screenshot and
   compares the colours of zones of different biomes.
3. Walks through three borders on foot and back.
4. Talks to six people and looks for a line of theirs from the data in `lastMessage`; buys and sells at the armourer in Highmarrow.
5. `forceBattle('rat')` + `winBattle()`: XP +10. `grantXp` to 300 / 900 / 6500 XP: level 2 / 3 / 5. Fights an ogre for a few
   rounds and checks every roll against the armour class.
6. `addItem` + `equip`: chain mail = AC 16, with a shield 18, hide = 12 + DEX modifier (at most 2), nothing = 10 + DEX
   modifier; a greatsword hits for `2d6...`, a dagger for `1d4...`.
7. Plays the 8 main quests in order and all side quests: for each step `travel` next to `steps[k].at`, A, A through the
   dialogue, `winBattle()` if a battle started; then `stage` must be one higher. Checks rewards, `won`, the menu pages.
8. Saves in a far zone, reloads the page, loads, compares everything.
9. Opens the game once more with changed data files.

## The self-test in round 4

`timeout 110 python3 selftest.py` prints, after the usual lines: the round 4 fields that are missing, the counts against the
data, which data files the page fetched, `quests.main[0]`, then it travels to every zone and lists the zones with a problem
(map too small, an exit blocked or not reachable on foot, a person not on a blocked tile), and three zone screenshots
(`selftest-shot-zone-<id>.png`). Look at them: is the land what its biome says? It does not play quests, battles or shops.
