# The SRD data (`data/srd/`)

Numbers from the System Reference Document 5.1 (see `ATTRIBUTION.md`). **One entry per line**, so single entries are easy to
look at without reading a whole file:

```sh
grep -n '"id": "goblin"' data/srd/monsters.json          # one monster
grep -n '"id": "chain-mail"' data/srd/items.json         # one item
grep -o '"id": "[a-z0-9-]*"' data/srd/items.json | head -100   # all ids
python3 -c "import json; d = json.load(open('data/srd/monsters.json'))['monsters']; print(len(d), sorted({m['cr'] for m in d}))"
```

## `monsters.json`: `{ source, count, note, monsters: [ ... ] }`, 83 monsters, challenge rating 0 to 17, sorted by it

| field | meaning |
|---|---|
| `id`, `name` | `goblin`, `Goblin` |
| `size`, `type` | `Small`, `humanoid` (`beast`, `undead`, `dragon`, `giant`, `fiend`, ...) |
| `cr`, `xp` | challenge rating (0, 0.125, 0.25, 0.5, 1 ... 17) and the XP for defeating it |
| `ac`, `hp`, `hit_dice` | armour class, average hit points, the dice behind them (`2d6`) |
| `speed` | feet per round: `{ walk, fly, swim, climb, burrow }` (only those it has) |
| `abilities` | `{ str, dex, con, int, wis, cha }` |
| `attacks` | `[ { name, bonus, damage, type, plus } ]`: `bonus` is added to the d20, `damage` is dice like `1d6+2` (a few tiny beasts have a flat `1`), `type` the damage type, `plus` an extra `{ damage, type }` on a hit (a dragon's fire). The first attack is the main one. |
| `multiattack` | the SRD sentence, when the monster attacks more than once a turn (optional to build) |
| `immune`, `resist`, `vulnerable` | damage types (optional to build) |
| `sprite` | kit hint, not SRD: `{ sheet: 'dungeon', frame, tint }`, the closest picture in `assets/dungeon.png` and a colour to tell look-alikes apart (`sprite.setTint(0xff6040)`) |

## `items.json`: `{ source, count, note, items: [ ... ] }`, 87 items

Every item: `id`, `name`, `kind`, `cost_gp` (gold pieces; `0.5` = 5 silver; `null` = the SRD gives no price: not for sale),
`sprite` (kit hint). By `kind`:

| kind | count | more fields |
|---|---|---|
| `weapon` | 30 | `damage` (`1d8`), `damage_type`, `category` (`simple melee`, `martial ranged`, ...), `properties` (`finesse`, `two-handed`, `versatile`, `light`, `heavy`, `reach`, `thrown`, `ammunition`, `loading`), `two_handed_damage`, `range`, `weight` |
| `armor` | 12 | `category` (`light`, `medium`, `heavy`), `ac: { base, dex_bonus, max_dex }`, `str_minimum`, `stealth_disadvantage`, `weight` |
| `shield` | 1 | `ac_bonus` (2) |
| `gear` | 15 | `weight`; some have an `effect` (`throw: { damage, type }`, `cure`) |
| `potion` | 6 | `rarity`, `effect` (`heal: '2d4+2'`, `temp_hp`, `set_ability`), `desc` |
| `magic` | 23 | `rarity`, `attunement`, `slot` (`weapon`, `armor`, `ring`, `cloak`, `neck`, `hands`, `waist`, `wrists`, `head`), `base` (the plain item it is a better version of: use that item's damage or armour), `effect`, `srd`, `desc` |

`effect` (kit reading of the SRD text, for the game to apply): `ac_bonus`, `attack_bonus`, `damage_bonus`, `extra_damage:
{ damage, type, only_vs: [monster types] }`, `set_ability: { str: 19 }`, `resist: [types]`, `heal`, `temp_hp`, `charges`, `cast`,
`only_if`. Build at least `ac_bonus`, `attack_bonus` (with `damage_bonus`) and `heal`.

## `rules.json`

`level_xp` (total XP for each level), `proficiency_bonus` (by level), `hit_die` (by class), and in words: `ability_modifier`,
`hit_points`, `attack_roll`, `attack_ability`, `damage_roll`, `armor_class` (unarmored, light, medium, heavy, shield, magic),
`selling`, `coins`, `xp_by_cr`. Small: read it whole.

The armour class the test expects: no armour `10 + DEX modifier`; light `base + DEX modifier`; medium `base + DEX modifier, at
most +2`; heavy `base`; `+2` with a shield; plus every worn item's `ac_bonus`.
