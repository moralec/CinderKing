# Brief, round 4: the world of Aldermoor (the decisive round; extends rounds 1 to 3)

## How you will be graded

1. **Requirements work (60 %).** An automatic test opens `index.html` in a headless browser and drives the game only through
   `window.__game` (the contract below). 25 checks, each worth the same: rounds 1 to 3 again (2 checks), then the world, the
   monsters, the items, the people, the quests, saving, and whether the game follows its data files. What the test cannot reach
   through the contract counts as missing, even if it works by hand.
2. **Look and polish (25 %).** Screenshots (six zones of different kinds, a villager talking, a shop, a battle against a dragon
   with a roll on screen, the Quests page, the Map page, the ending) are judged for a consistent Game Boy Color-style look made
   from the supplied tiles: every kind of land clearly its own, readable text in the pixel font, clean boxes, nothing
   overlapping or cut off.
3. **Your own plan (7.5 %).** **No plan is provided this round, and no code.** Before you write any code, write your own
   `PLAN.md`: a checklist (`- [ ]` lines, as many as you need, at least 6) of the steps you will take, in the order you will take
   them. Tick each (`- [x]`) when it is done and the self-test is clean. The points are for a plan that exists and is ticked
   off truthfully.
4. **A clean console (7.5 %).** No page errors, no failed requests.

**Reported next to the score: the quality of your code.** A reviewer reads your JavaScript after each pass, and the test measures
it: how many Scene classes, the size of the largest file, how much code is repeated, whether the zones live in data or in code.
One engine that builds every zone from data is what this round is looking for; 36 hand-made scenes are not.

## The task

**This folder holds YOUR round 3 build.** Brindlemere is now one village in the land of **Aldermoor**: a world of **6 x 6 = 36
zones**, each with its own kind of land, creatures and people, and a campaign in eight chapters, **"The Cinder King"**, that
starts with the quest you already built (the Restless Crypt is chapter 1) and ends with a dragon on a fire mountain.

This time you get **data, not instructions**. The kit holds the world, the monsters, the items and the rules as JSON. You design
and build the systems that turn that data into a game. How you structure the code is your decision, and it is what this round
tests:

- **Build engines, not content.** One zone engine that makes any of the 36 zones from its entry in `data/world.json` (its biome,
  its tint, its people, its creatures). One quest engine that runs any quest from its list of steps. One battle system that
  fields any monster from `data/srd/monsters.json`. One item system for everything in `data/srd/items.json`.
- **Load the data files when the page opens (`fetch`). Do not copy their content into your code.** The test also runs your
  game with changed data files (a zone with another name and biome, another creature list, a new villager, a monster with
  other numbers, a sword with another price and damage) and expects the game to follow.
- **The tile maps of the zones are not in the kit. Your code makes them**, from the biome rules in `data/world.json` (by a
  generator with a fixed seed per zone, or any other compact way). Your two maps from the earlier rounds stay: the town is
  the zone `brindlemere`, the forest is the zone `thornwood`, and the house and the crypt stay interiors.
- Keep rounds 1 to 3 working. They are tested again. Refactor where the old code is in your way, but do not break it.

Everything you need is in this folder and **the machine is offline**:

- `data/world.json` (60 KB) and `data/WORLD.md`: the 36 zones, the biomes with their tile hints, 52 people with their lines,
  8 main quests and 12 side quests, the quest items.
- `data/srd/monsters.json` (44 KB, 83 monsters), `data/srd/items.json` (27 KB, 87 items), `data/srd/rules.json` (the rules:
  levels, attack rolls, armour class, selling) and `data/srd/SCHEMA.md`. Real numbers from the SRD 5.1.
- `data/srd/ATTRIBUTION.md`: the licence text. The game must show it in its credits.
- `CHEATSHEET-R4.md`: how to look at the data, the contract in short, what the self-test prints. `CHEATSHEET.md`: Phaser,
  rexUI and the tile numbers, as before. Never open the files in `lib/`.

**The data files are big. Never `cat` them.** Read `data/WORLD.md` and `data/srd/SCHEMA.md`, then look at single entries
(`CHEATSHEET-R4.md` shows how: one zone, one monster, one quest).

The setting is original. Do not use the names "Dungeons & Dragons" or "D&D" in the game, and no place, person or story from
any published setting. Do not edit anything in `data/`.

## Steps

1. Read this brief, `CHEATSHEET-R4.md`, `data/WORLD.md` and `data/srd/SCHEMA.md`. Look at a few entries of each data file. Read
   your own code from round 3.
2. **Write `PLAN.md` (your checklist) before any code.** Decide the structure first: which files, which classes or modules, what
   each one owns, how the data flows in. Put the steps in an order that keeps the game running after each one.
3. Build it. Keep `index.html` plus your JavaScript in `js/`. Load only local files (no CDN, no network).
4. **Run `python3 selftest.py` after every step and fix what it prints.** In this round it prints the page's errors, which
   fields of the contract are missing, the counts (zones, maps, monsters, items, people, quests), which data files the page
   fetched, what `travel` and one move do, and screenshots of three zones. Look at the screenshots. It returns in about a
   minute and does not grade the requirements: check those yourself against this brief. Every shell command must return on its
   own: always use `timeout`.
5. Tick `PLAN.md` as you go. If time runs short, a smaller world that works beats a large one that does not: every check is
   worth the same.

## Requirements of rounds 1 to 3 (still tested, unchanged)

1-13 (rounds 1 and 2): the town map, grid movement with keys and the on-screen D-pad, A and B, collision, the house, the
villager's dialogue, fishing, the three items, the character sheet, tall grass with random encounters, the turn-based battle
with visible dice, XP and level-up, the Start menu, save and load.
14-21 (round 3): the town, the forest and the crypt; the quest in six steps (`quest.stage` 0 to 6) with the quest giver, the
gravekeeper, the chest, the crypt gate, the boss and the helper; the Quest page; `Healing Draught`; HP on screen; save and load.

## Requirements added in round 4

22. **A world of 36 zones** in a 6 x 6 grid, exactly the zones of `data/world.json` (id, name, biome, position). Every zone is
    its own map of at least 20 x 15 tiles. `brindlemere` is your town map and `thornwood` your forest map.
23. **Walking between zones.** Each zone has, for every neighbour (north, east, south, west), an exit tile on its edge. Stepping
    onto it takes the player to the neighbouring zone, next to that zone's opposite exit. Inside a zone every exit can be
    reached on foot from every other exit. So the whole world can be walked from Brindlemere. Your town and forest need new
    gaps in their edges for their new neighbours.
24. **Every zone looks like its kind of land.** Build each map from its biome's tile hints and tint (`biomes` in
    `data/world.json`; a zone's own `tint` wins over its biome's). No two zones have the same map, and in each between
    5 % and 80 % of the tiles block. The test compares screenshots: two zones of different biomes must not look alike in
    colour.
25. **Monsters from the data.** Every monster of `data/srd/monsters.json` exists in the game with its real numbers (armour
    class, hit points, XP, attack bonus, damage). Every random foe is one of them: a zone's random encounters come from its
    `encounters` list, also in the town, the forest and the crypt (`sites` in `world.json` has the crypt's list). The zone's
    danger tile (like tall grass) starts them. Zones with an empty list are safe.
26. **Battles by the rules** (`data/srd/rules.json`): your attack is d20 + your attack bonus against the foe's armour class and
    hits when the total is at least that (a natural 20 always hits, a natural 1 never); the foe attacks with its own bonus
    from the data against your armour class; a win gives the monster's XP. Levels follow the XP table of `rules.json`
    (level 2 at 300 XP, level 5 at 6500 XP).
27. **Items from the data.** Every item of `data/srd/items.json` exists with its real cost, damage or armour value. The
    hero carries items, wears armour and a shield and wields a weapon, and that changes the numbers: armour class by the
    armour rules of `rules.json`, the attack's damage dice by the weapon. The hero starts with the equipment and the gold
    of `meta.start` in `world.json`. A `Potion of Healing` heals 2d4+2 and is used up; magic items add what their `effect`
    says (at least `ac_bonus` and `attack_bonus`).
28. **People.** All 52 people of `world.json` stand in their zones (a person blocks the tile). Talking to one (A) shows a
    dialogue with lines of theirs from the data.
29. **Merchants.** Talking to a merchant opens a shop with the merchant's `stock`. Buying costs the item's cost in gold,
    selling pays half of it. Not enough gold: no sale.
30. **The campaign: 8 main quests, in order.** Each quest of `quests.main` is a list of steps; a step is done by pressing A
    facing its person or thing (`talk`, `fetch`, `open`) or by winning the battle that A starts (`defeat`). Step by step
    the quest's `stage` rises by 1; after the last step the quest is done and pays its reward (XP, gold, items). A main
    quest can only be started when the one before it is done. Chapter 1 is your round 3 quest, unchanged.
31. **Side quests.** At least 8 of the 12 side quests of `quests.side`, built the same way, open from the start, each paying
    its reward.
32. **The end.** Defeating the dragon and finishing the last main quest wins the game: `won` becomes true and the game shows
    an ending.
33. **Menu pages.** The Start menu gains a **Map** page (the 6 x 6 grid, where you are, where you have been) and a
    **Credits** page with the licence text of `data/srd/ATTRIBUTION.md`; the **Quest** page now lists the main quest and the
    side quests in progress.
34. **Save and load keep everything**: zone and position, gold, equipment, inventory, level, every quest's state, visited
    zones; also after a page reload.

## Required test hook: `window.__game`

The test uses only this object. Keep it accurate at all times. **Every field of rounds 1 to 3 stays as it is** (`player`,
`inventory`, `dialogueOpen`, `lastMessage`, `maps`, `landmarks`, `blocked`, `ui`, `party`, `battle`, `menuOpen`, `menuOptions`,
`quest`, `actions.move / pressA / pressB / pressStart / save / load / grantXp / useItem / startBattle / setEncounters`).
Round 4 adds:

```js
world: { width: 6, height: 6,
  zones: [ {                      // 36, any order
    id, name, biome, x, y,        // as in data/world.json
    map,                          // the name of this zone's map in `maps` (player.map while the player is there)
    encounters: [ ...monster ids ],
    exits: { north, east, south, west },   // each { x, y } (a tile of this zone's map) or null at the world's edge
    visited                       // true once the player has been in the zone
  } ] },
maps,                             // now also one map per zone; interiors (house, crypt, ...) are maps that are no zone
bestiary: [ { id, name, cr, xp, ac, hp, attack: { bonus, damage } } ],   // every monster; attack = its first attack in the data
catalog:  [ { id, name, kind, cost,          // every item; cost in gp (null when the data has none)
              damage,                        // weapons: the damage dice, e.g. '1d8'
              ac } ],                        // armour: its base armour class (a number)
npcs: [ { id, name, role, zone, map, x, y } ],   // every person; map, x, y = where he or she stands
quests: {
  main: [ { id, name,             // 8, in the order of the data
    status,                       // 'locked' (the quest before is not done) | 'available' | 'active' | 'done'
    stage,                        // number of steps done, 0 .. steps.length
    steps: [ { type, at: { map, x, y } } ],   // where the player presses A for this step: the person's or thing's tile
    reward: { xp, gold, items: [ ...names ] } } ],
  side: [ ... ] },                // the same shape; 'available' from the start
gold,                             // gp, a number (0.5 = 5 silver)
won,                              // false, then true for ever once the campaign is finished
credits,                          // the text of the Credits page (a string)
shop: null,                       // while a shop is open: { npc, stock: [ { id, price } ] }
party: [ { ...as before, xp,      // xp = all XP earned so far (it never goes down)
    ac,                           // armour class now, by the rules, with everything worn
    attack: { bonus, damage },    // bonus = what is added to the d20; damage like '1d8+3'
    equipment: { weapon, armor, shield, ... } } ],   // item ids or null; more slots (ring, cloak, ...) as you need
battle: { ...as before,
    enemy: { ...as before, id, ac },   // id = the monster's id in the data; hp, maxHp and ac from the data
    enemyRoll },                  // the foe's last attack roll { die: 20, value, mod, total }, null before its first
actions: { ...as before,
    travel(map, x, y),            // test aid: put the player on tile x,y of that map (any map in `maps`); without x,y: a free
                                  // tile of your choice. Returns true, or false if the map is unknown or the tile blocked.
    forceBattle(monsterId),       // test aid: start a battle against that monster now (false if a box, menu or battle is open)
    winBattle(),                  // test aid: end the running battle as a win, with everything a win brings (XP, quest step)
    addItem(itemId),              // test aid: put one such item into the inventory (ids of items.json and quest_items)
    addGold(n),                   // test aid
    equip(itemId),                // wear or wield a carried item: true if done. It replaces what was in its slot.
    unequip(slot),                // 'weapon', 'armor', 'shield', ...: back into the inventory
    buy(itemId), sell(itemId) }   // while a shop is open: true if the sale happened
```

Rules the test relies on:

- `inventory` stays a list of **names** (`'Longsword'`, `'Potion of Healing'`, `'Crypt Key'`), one entry per piece. Worn and
  wielded things are in `party[0].equipment`, not in `inventory`. `useItem(name)` works as before, now also for the potions.
- The tile of a step (`steps[k].at`) is blocked while its person or thing is there, and has a free tile next to it. The test
  puts the player on such a free tile with `travel`, turns to the step's tile, presses A, presses A through the dialogue,
  and calls `winBattle()` if a battle started. After that the quest's `stage` must be one higher. A step that is not the
  quest's current step does nothing to the quest.
- An exit tile is free to walk on (never blocked), and `travel` without x,y never drops the player on one.
- `travel` and stepping onto an exit may take a moment (a scene change). The test waits until `player.map` has changed.
- During a battle `pressA()` makes exactly one attack of yours, then (if the foe lives) one attack roll of the foe.
  `battle.lastRoll` is yours: `{ die: 20, value, mod, total }` with `mod === party[0].attack.bonus`.
- A shop opens when the merchant's dialogue ends (or at once). While it is open, `pressB()` closes it.
- The test viewport is 1024x768. Random encounters are switched off for the scripted parts.

When you have finished, run `python3 selftest.py` once more (no errors, nothing missing, the three zone screenshots look
right), tick `PLAN.md`, and stop.
