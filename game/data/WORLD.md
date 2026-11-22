# The world data (`data/world.json`, 60 KB: do not read it whole)

The land of **Aldermoor** and the campaign **"The Cinder King"**. Original setting. One entry per line; look at single ones:

```sh
python3 -c "import json; w = json.load(open('data/world.json')); print({k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in w.items()})"
python3 -c "import json; w = json.load(open('data/world.json')); print(json.dumps(w['meta'], indent=1))"
grep -n '"id": "glasswind-dunes"' data/world.json                    # one zone
python3 -c "import json; w = json.load(open('data/world.json')); print(json.dumps(w['biomes']['desert'], indent=1))"
grep -n '"id": "ilsabet-quill"' data/world.json                      # one person
python3 -c "import json; w = json.load(open('data/world.json')); print(json.dumps(w['quests']['main'][1], indent=1))"   # one quest
python3 -c "import json; w = json.load(open('data/world.json')); [print(z['y'], z['x'], z['id'], z['biome']) for z in sorted(w['zones'], key=lambda z: (z['y'], z['x']))]"
```

## The map (x grows to the east, y to the south; the sea lies beyond the west edge)

| y \ x | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| 0 | Frostfang Shore (snow) | Rimewater Glacier (snow) | Karn Doruhl (mountain, dwarf hold) | Stonejaw Pass (mountain) | Ashfall Reach (volcanic) | **Mount Cindermaw** (volcanic, the end) |
| 1 | Gullcry Cliffs (coast) | Pinewatch (forest) | Hollowhorn Hills (hills) | Greywether Moor (hills) | Emberscar Badlands (canyon) | The Cindergate (ruins) |
| 2 | Saltmere (coast, port) | Larkspur Fields (plains) | Highmarrow (town) | Gallows Heath (plains) | Thornreach Ruins (ruins) | Glasswind Dunes (desert) |
| 3 | Wrecker's Coast (coast) | **Brindlemere** (town, the start) | Thornwood (forest) | Mistral Downs (plains) | Sunspire Oasis (desert, camp) | Sepulchre of Sand (ruins) |
| 4 | Blackmire (swamp) | Willowfen (swamp) | Autumn Hollow (forest) | Oldking Barrows (graveyard) | Redrock Canyon (canyon) | Scorpion Flats (desert) |
| 5 | The Drowned Shrine (ruins) | Mangrove Maze (jungle) | Emerald Deep (jungle) | Serpent's Rest (ruins) | Bonewhite Wastes (desert) | Fallen Star Crater (mountain) |

## What is in the file

- **`meta`**: title, `grid`, `start` (`zone`, `gold`, `equipment`: the hero starts with a rapier and leather armour), `goal`,
  `story` (three sentences of history, for an intro or the Credits page).
- **`biomes`** (14: town, forest, plains, hills, mountain, snow, coast, swamp, jungle, desert, canyon, volcanic, ruins,
  graveyard): the rules for building a zone map of that kind. Tiles are written `t:N` (tile N of `assets/town.png`) or `d:N`
  (`assets/dungeon.png`); the numbers are those of `CHEATSHEET.md`.
  - `ground`: tiles to cover the floor with (repeat = more common). `path`: a road between the exits.
  - `solid`: things that block (trees, rocks, walls, water `t:132`). `scatter`: decoration you can walk on.
  - `danger`: the tile that starts random encounters (like tall grass). `tint`: a colour to multiply the whole map with
    (`layer.setTint(0xe6f2ff)`), `null` for none. The tile pack has no snow, ash or jungle tiles: the tint makes them.
  - `build`: one sentence on what the land should look like.
- **`zones`** (36): `id`, `name`, `x`, `y`, `biome`, `danger` (0 to 10, how strong its creatures are), `encounters` (monster
  ids for random battles; empty = safe), `blurb` (one sentence), `tint` (optional, wins over the biome's: it is what makes
  two forests differ), `settlement` (true for towns and camps: houses, no danger tiles needed), `features` (things worth
  drawing), `neighbours` (`north`, `east`, `south`, `west`: zone id or null).
- **`sites`**: interiors that belong to a zone and are not zones: your `house` and your `crypt` (with the crypt's
  `encounters`). You may add interiors of your own (a dragon's cave); nothing requires it.
- **`npcs`** (52): `id`, `name`, `zone`, `role`, `title`, `sprite` (kit hint: a frame of `assets/dungeon.png` and a tint),
  `lines` (2 or 3 things the person says when nothing else is going on), `stock` (merchants only: item ids).
  Roles: `main` (8, people of the main quests), `side` (12, they give side quests), `merchant` (5), `lore` (26), `helper` (1).
  Four of them are people you already have: `elder-maren` (your quest giver), `brother-tobin` (your gravekeeper), `hale` (your
  helper), `orwyn` (your first villager). Where a person stands inside the zone is your decision.
- **`quest_items`** (16): things that are not in `items.json` (`Crypt Key`, `Cinder Key`, ...): `id`, `name`, `desc`.
- **`quests.main`** (8, in order) and **`quests.side`** (12): `id`, `name`, `giver` (npc id), `summary`, `steps`, `reward`
  (`xp`, `gold`, `items`: ids of `items.json` or `quest_items`); main quests also `chapter`; the last one `final: true`.

## Quest steps

Every step has `type`, `log` (the line for the Quest page while it is the current step) and `pages` (what is said or shown when
it is done; optional for `defeat`). The first step of every quest is `talk` to its giver.

| type | fields | done when |
|---|---|---|
| `talk` | `npc` | the player presses A facing that person. The person says `pages` instead of the usual `lines`. |
| `fetch` | `thing`, `name`, `zone`, `sprite` | A facing the thing (a chest, a stone, a nest). You place it in the zone. |
| `open` | `thing`, `name`, `zone`, `sprite`, `needs` | A facing it **with the item `needs` in the inventory**; the item is used up. Without it: a message, no progress. |
| `defeat` | `monster`, `as`, `zone`, `site` | A facing the foe starts a battle against that monster (shown under the name `as`); the step is done when it is won. After a loss the player can try again. |

Any step can also have `gives` (items put into the inventory when the step is done) and `takes` (items removed). `zone` says
where the thing or foe is; with `site` it is inside that interior of the zone. A person is where `npcs` puts him or her.
Give `fetch`, `open` and `defeat` targets a tile of their own that blocks, with a free tile next to it.

## The campaign in one paragraph

1 The Restless Crypt (your round 3 quest: Elder Maren, Brother Tobin, the chest, the gate, the Gravecaller). 2 The Bell's
Maker: the bell's mark leads to Loremistress Ilsabet Quill in Highmarrow and to the bandit Garrick Redcap. 3 Salt and Shadow:
the cult's cargo, a sea hag on Wrecker's Coast. 4 The Drowned Shrine: the marsh folk, the wyrmling Mirefang, the Moon Stone's
answer. 5 The Dwarven Road: Forgemaster Brakka Ironvein, star-iron from Stonejaw Pass. 6 Winter's Tooth: the white dragon
Hoarfang; the reward is the Frost Brand. 7 The Ashen Choir: the High Cantor in the Sepulchre of Sand, the Cinder Key.
8 The Cinder King: the Cindergate, then Vharaxis, an adult red dragon, on Mount Cindermaw; then home to Elder Maren.
