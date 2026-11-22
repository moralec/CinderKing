# Review: The Cinder King v0.5 (build R4F2, qwen3635ba3b)

Reviewed 22 Nov 2026 on a copy of `bench/coding-semi/runs/R4F2/qwen3635ba3b/work/`, played headless through `window.__game` with
real moves, A presses and menu keys. I started a new game and played chapters 1 to 8 to `won = true`, plus one side quest, a save, a
reload and a load. Five story fights could not be won at the level the story reaches, so I finished those with `winBattle()` (list
below). I also equipped the quest rewards through the hook, because the player cannot do it from the UI. Screenshots are in
`review/v0.5/`, 512 x 384 (2x).

## Verdict

v0.5 works as a slice of the game, but a player cannot finish it yet. The world is all there: 36 zones you can walk, all 20 quests
complete in order, the story text reads well and the clues land, save and load bring back every field, it runs at 60 fps, and two
hours of play gave no console error. A player who plays by the rules gets stuck, though. Chapter 2's boss has about a 2 % chance at
the level the story reaches, and the bosses of chapters 5, 6 and 8 cannot be beaten at all. None of the armour, weapons or rings the
quests give can be worn from the menus. The only healing for sale (a Potion of Healing) can't be drunk anywhere. Nowhere lets you rest,
and losing a fight heals you to full, so nothing is at stake. The ending disappears with the last line of dialogue. The R4 checker
sees none of this (25/25): it equips with `equip()`, wins every story fight with `winBattle()`, and takes its ending screenshot on
the first frame. Round 3 (sprites, house, zones) fixes the right art. The round after it has to be about the game's systems: our
own test suite first, then items and gear, rest and defeat, boss balance, the full story, and the ending.

**Keep:** the data-driven world (one Zone scene, the quest engine `Tales`), the clean console, save/load, the title cover, the
dialogue box and HUD layout, and the story text of chapters 2 to 8.

## Balance: what a player meets

These win rates come from the game's own battle code (`Battle.start` / `Battle.attack`), run in the page. Each cell is 400 fights,
with the hero reset before each one. The hero wears the rewards he has earned by that chapter (through the hook; a player can't, see
P1-5). When marked "3 potions", he drinks a 2d4+2 potion at 35 % HP or less, which in this game costs no turn. The "level the story
reaches" is the XP from main quests and bosses only, with no grinding. Stats were STR 12, DEX 14, CON 11 (a typical roll).

| Ch | Boss (monster, CR) | Level reached | AC worn | Win % (no / 3 potions) | Level for ~50 % |
|---|---|---|---|---|---|
| 1 | the Gravecaller (cult-fanatic, 2) | 2 | 13 | 61 / 91 | 2 |
| 2 | Garrick Redcap (bandit-captain, 2; 65 HP) | 3 | 15 | **2 / 11** | 8 |
| 3 | Old Mother Brine (sea-hag, 2) | 3 | 17 | **2 / 14** | 7-8 |
| 4 | Mirefang (black-dragon-wyrmling, 2) | 4 | 18 | 49 / 76 | 4 |
| 5 | Grum-and-Gorl (ettin, 4) | 4 | 19 | **1 / 2** | 12+ (37 % at 12) |
| 6 | Hoarfang (young-white-dragon, 6) | 5 | 20 | **0 / 0** | never (4 % at 15) |
| 7 | High Cantor Sereth Vane (mage, 6) | 5 | 20 | 100 / 100 | trivial |
| 8 | Vharaxis (adult-red-dragon, 17) | 6 | 21 | **0 / 0** | never (0 % at 15) |

In play I lost 5 of 5 fights against Garrick at level 3 and 3 of 3 against Brine, and lost to the ettin, Hoarfang and Vharaxis. I
finished those five with `winBattle()`. With about 60 random fights along the way I reached level 3 by chapter 2 and level 7 at the
dragon. The causes are threefold. One hero faces SRD monsters sized for a party of four. The hero gets one attack a turn and HP of a
full d8 per level. The story's weak point, winter against fire, is not a mechanic: Frost Brand's `resist: fire` is ignored, and the
blade even lowers this DEX hero's attack from +5 to +4.

## Prioritised changes

P1 = must fix before calling it a finished game. P2 = should fix. P3 = nice to have. "Round 3" is the planned `plans/r4-fix3/`
(steps 60-67). "Known" marks items from the brief, placed here without being derived again.

| # | Pri | What | Why (evidence) | Round |
|---|---|---|---|---|
| P1-1 | P1 | **Boss curve.** 5 of 8 chapter bosses can't be beaten at the level the story reaches, and ch7 is trivial. This includes the known red dragon. | Balance table above. Played: 0/5 against Garrick at L3, 0/3 against Brine. The dragon at L7 hits for 21 and has 256 HP ([31](review/v0.5/31-battle-vharaxis.png)). Fix: scale bosses per `defeat` step in world.json, or pick monsters that fit the level. Make "winter beats fire" real: Frost Brand halves the dragon's fire damage and adds cold damage against red dragons. Add a sim test with a target band. Scale in the step, not in monsters.json, because R4-25 pins monster HP. | 4 |
| P1-2 | P1 | **XP and reward curve.** The Pale Lady pays 10,000 XP for a CR-5 fight (known). Chapter 1 pays twice. Random fights pay SRD XP that is meant for four heroes. | `actors.js:8` hard-codes 60 XP and `elder.js:15` then adds the data's 300 XP. The player reads "You gain 60 XP" and then "You also get 25 gp and 300 XP". 22 forest fights in 120 grass steps took the hero from 75 to 850 XP (level 1 to 2, 50 XP short of level 3). Fix: one reward pass, checked by the sim test. Run chapter 1's reward through `Tales` only. | 4 |
| P1-3 | P1 | **Nothing at stake.** Losing heals you to full, fleeing always works (even against bosses), and drinking in battle costs no turn. | `battle.js:26` (`h.hp = h.maxHp`), `foes.js:14` ("wake where you stood"), `battle.js:23`, `quest.js:25`. Played: I walked into the ettin at 2/32 HP, lost in one round and woke at 32/32 ([18](review/v0.5/18-boss-loss-no-penalty.png)). Losing is the best healing in the game. Fix: on defeat, wake at the last rest place and lose half your gold. Give fleeing a chance to fail, with no fleeing from story bosses. Make a drink take your turn. Note that R3-30 ("retry after a loss") may then fail, and R4-02 tolerates one failure. | 4 |
| P1-4 | P1 | **There is no way to rest.** The innkeeper promises a bed but nothing heals. | Pella says "A bed at the Brass Kettle mends any wound." and the hero's HP stays at 5/64. `rules.json` `resting` is not implemented. The only ways to heal are levelling up, potions, or losing. Fix: rest with the innkeepers in the 5 safe settlements and in the house bed, for a small fee. | 4 |
| P1-5 | P1 | **The Items page is the only item UI, and it doesn't work.** No equip menu (known). START in battle drinks only the round-3 draught (known). | A on any row drinks the Healing Draught: "A: Shield" answers "No Healing Draught in the bag." ([16](review/v0.5/16-items-press-a.png), `pack.js:11-12`). A bought Potion of Healing can't be drunk from the menu or in battle (`foes.js:16`). Only the first 5 things you carry are listed, and the 5th row runs past the panel; I carried 11 ([41](review/v0.5/41-items-page-first-five.png), `itemicons.js:20-31`). Worn gear shows nowhere: the Party page has no slots ([06](review/v0.5/06-menu-party.png)), and the Items page says "(nothing yet)" while the hero holds a rapier and wears leather ([07](review/v0.5/07-menu-items.png)). So every armour, weapon and ring the campaign gives is dead without the test hook. | 4 |
| P1-6 | P1 | **The ending disappears.** | The ending card appears behind Maren's first line, so "THE END" shows before she speaks ([32](review/v0.5/32-ending-with-dialog.png)). It hides as soon as the dialogue closes (`ending.js:57-65`). The player is then back in town, and Maren gives her round-3 idle line ([33](review/v0.5/33-after-ending.png)). There is no credits roll and no return to the title. Fix: after the last page, the card stays until START, then the credits pages, then the title (Continue = post-game). | 4 |
| P1-7 | P1 | **The on-screen credits lack the licence wording.** The required SRD sentence and the licence URL are missing, and so is the line saying the game is not affiliated with Wizards of the Coast. | Compare the credits page ([37](review/v0.5/37-credits-page.png), `pages.js:9`) with `data/srd/ATTRIBUTION.md`: "The required credit, which the game must also show in its credits". Only `hook.credits` carries the full text. The page needs it before the public release. Small fix. | 4 |
| P1-8 | P1 | **The checker pins the game's content.** R4-17..21 compare the quest shapes and rewards with `task-r4/data`, and the feeder's FACTS 20-21 and chunk-22 pin the same things. | This blocks P1-1, P1-2 and the full story (`plans/r4-fix2-alt/NOTE.txt`). See "The checker constraint" below. | 4 (Claude, first) |
| P1-9 | P1 | Garbled battle sprites for some monsters (known). | The rat ([09](review/v0.5/09-battle-ratthief.png)) and the dragon ([31](review/v0.5/31-battle-vharaxis.png)). Step 61 adds a dark stage, step 60 fixes the frog. | 3 (planned) |
| P2-1 | P2 | **Dialogue leaves one-word pages.** | `cutPages` (`ending.js:6-21`) splits a page every 78 characters into separate boxes, so pages read "it.", "road." or "Go." ([39](review/v0.5/39-dialogue-orphan-page.png)). It happens on most story pages. Fix: page by wrapped lines, 3 lines per box. | 4 |
| P2-2 | P2 | **Long names are cut three different ways.** This covers the known "X attacks!" cut. | The panel cuts with `slice(0,16)` and shows "Vharaxis, the Ci". The log cuts at the last space and prints "Vharaxis, the rolls 23 HIT" (`swing.js:5-12`). Log lines are cut at 30 characters (`battleview.js:32`) ([31](review/v0.5/31-battle-vharaxis.png)). Fix: one rule for fitting a name, plus a short battle name for each boss in the data. | 4 |
| P2-3 | P2 | **The battle numbers are mislabelled.** | Both damage boxes are labelled "d8" (`battleview.js:18-19`) but show totals with the modifier: the dragon's 2d10+8 appears as "21" under "d8". The foe's line gives a total with no bonus, unlike "You roll 15+4=19". "the Ham Thief attacks!" starts with a lowercase letter ([09](review/v0.5/09-battle-ratthief.png)). | 5 |
| P2-4 | P2 | **Shop.** There is no sell page and no buy confirmation. | Selling exists only as a hook action; the panel says "A buy B leave" (`shopview.js:34`). A buys at once (`shopview.js:87-95`): mashing A through the merchant's line bought a Handaxe in my play. Items show no damage, AC, owned or worn. Prices read "0.01 gp". Only 3 rows show at the top of the list. Merchants never say their second line (`shopdoor.js:24`) ([04](review/v0.5/04-shop.png)). | 4 (sell, confirm); 5 (the rest) |
| P2-5 | P2 | **Boss lines come at the wrong time.** The full outline's 7 new steps are parked (known). | A `defeat` step only has pages for after the win. So Vharaxis's challenge, "WHO WAKES THE CINDER KING? ... A blade of winter. I remember that sting.", appears after "is defeated!". Every boss opens with a bare "X attacks!". Fix: an `intro` field in the step, shown before the battle. Bring in `plans/r4-fix2-alt/story` once P1-8 is done. | 4 |
| P2-6 | P2 | **Old-round text beats the data.** | Orwyn still says "Three lost treasures lie about town" (`data.js:3-7`). Maren, Tobin and Hale speak lines hard-coded in `actors.js`, so their lines in world.json never show. Maren closes chapter 1 with "Then it is over." (`actors.js:7`) with 7 chapters still to come. The reforged blade arrives as "Winter's Tooth bites again. ... You got: Frost Brand." Fix: move chapter 1's text into world.json, and add a display name for quest rewards. | 4 |
| P2-7 | P2 | **Story gates and landmarks are missing.** | You can walk to Mount Cindermaw before the gate opens; there the dragon says "Vharaxis, the Cinder King: not now." (`questpress.js:9`). The Cindergate is a one-tile fence in a field ([30](review/v0.5/30-cindergate-gate.png)). Pressing anything early gives "X: not now." Fix: the gate tile blocks the north exit until it opens. Give each step an "early" line in the data. | 5 |
| P2-8 | P2 | **Settlements look like open fields.** This goes beyond round 3's biome fix. | The hub Highmarrow ([14](review/v0.5/14-highmarrow.png)), the harbour Saltmere ([19](review/v0.5/19-saltmere.png)), the dwarf hold Karn Doruhl ([23](review/v0.5/23-karn-doruhl.png)) and Sunspire Oasis, which has no water ([27](review/v0.5/27-sunspire-oasis.png)), have no buildings. The Drowned Shrine has no water and shows flat green squares ([22](review/v0.5/22-drowned-shrine.png)). Fix: a settlement layout with houses, an inn door, a stall and a well, plus set pieces for the main story sites. | 5 (after round 3) |
| P2-9 | P2 | **Every zone uses the same six tiles.** | Every generated zone puts its people and things at 6,4 / 18,4 / 6,12 / 18,12 / 9,11 / 15,5 (`zoneplan.js:124-131`). If a zone needs a 7th, `Folk.takeSlot` logs "No slots" and `questspots.js:30` reads a null, which leaves the quest table half-built. Fix: search for a free tile near anchors chosen by role. | 5 |
| P2-10 | P2 | **The Map and Quest pages don't guide the player.** | The Map is a grid of colour squares with no names and no marker for the next goal ([36](review/v0.5/36-map-page.png)). The Quest page lists side quests by name only, with no next step ([38](review/v0.5/38-quest-page-late.png)). | 5 |
| P2-11 | P2 | **The title has no Continue.** | After a reload a new game starts, and the save is only reachable through Menu → Load ([34](review/v0.5/34-reload-title.png)). | 4 (with P1-6) |
| P2-12 | P2 | **Many items do nothing.** | `set_ability` does nothing: the Gauntlets, and the Belt of Giant Strength (the Pale Lady's reward). So do `temp_hp` (Heroism), `throw` (holy water, alchemist's fire, acid), the wand and staff, and `resist` (Frost Brand, Red Dragon Scale Mail). `hero.js:20-22` adds only AC, attack and damage bonuses, `potion.js` handles only `heal`, and `useItem` returns false without a message. The Bracers of Defense add +2 even over armour and a shield (AC 21 → 23; `only_if` is ignored). The shops sell rope, torches, rations and a crowbar, none of which has a use. | 5 |
| P2-13 | P2 | **Each new game rolls a different hero.** | Stats are 4d6 drop lowest (`rules.js:4,12`), so difficulty changes from game to game. HP is a full d8 per level (`rules.js:5,24`) while `rules.json` gives the Ranger a d10 (average after level 1). Fix: a fixed array (or a reroll on the title) and HP by the rules. The balance test needs this. | 4 |
| P2-14 | P2 | **Input runs through stacked wraps.** | `Ctl.pressA` is replaced or wrapped 6 times (`state.js:58`, `rules.js:34`, `actors.js:23`, `shopview.js:87`, `platino.js:8`, `title.js:63`). `step`, `pressB`, `pressStart` and `Menu.text` have 4 layers each. Which one wins depends on the order of the script tags, and every round-4 screen (items, sell, inn, ending, title) would add another layer. Fix: one input router with a mode stack (title > ending > dialogue > shop > menu > battle > map), and menu pages kept as a registry. | 4 (first local step) |
| P2-15 | P2 | **There are two quest engines.** | Chapter 1 runs on `G.quest` plus `actors.js` / `things.js` / `foes.js`, with hard-coded text, coordinates and 60 XP, joined to the rest by `elder.js`. Chapters 2-8 run on `Tales` and world.json. Fix: run chapter 1 through `Tales` and copy its stage into `hook.quest.stage`. That also fixes P1-2's double pay. | 4 |
| P2-16 | P2 | **Saves have no version number.** | A save made before the new story steps (`save.js`, `keep.js`) would map its stages onto the wrong steps. Fix: a version number, and migration by step id. | 4 (with the story) |
| P2-17 | P2 | The house interior has black stripes (known). Biome zones are sparse (known). | Town tile 124 is used as floor. The zones scatter tiles one by one. | 3 (planned) |
| P3-1 | P3 | **Dead code.** | `rules.js:6-8` MONSTERS. `battle.js:7-22` strike/attack, replaced by `swing.js:31`. `foes.js:2-4` FOES and its strike/attack wraps. The R2 `Rules.xpNext`. The focus logic in `menu.js`, which `pack.js:9-13` overrides. The placeholder `Tales.press` (`questspots.js:3-6`). `Shop.buy` written 3 times (`shop.js:20`, `shopview.js:53`, `shopdoor.js:7`). `refreshCounter`, overwritten every frame. `wrap()` defined 3 times (`db.js:11`, `sprites.js:5`, `platino.js:4`). | 5 |
| P3-2 | P3 | **Hacks that hide failures.** | `title.js:74-79` hides the title whenever anything reads `window.__game`, a trick that only serves the test. `tints.js:25` swallows errors. A failing SETUP only writes to the console (`db.js:97-99`) and leaves the world half-built. | 5 |
| P3-3 | P3 | **Content in code.** | "The Cinder King is slain. Aldermoor is free." (`questfinish.js:68`), the ending card (`ending.js:36-46`), the credits (`pages.js:8-13`), `Folk.OLD`. Move them to `meta` in world.json. | 5 |
| P3-4 | P3 | **Text polish.** | Some gift lines repeat ("You got the Ashen Sigil." then "You got: Ashen Sigil."). "X is defeated." appears twice after quest fights. "Orwyn carries you out of the grass" shows for quest fights in town and lands in every battle log (`battle.js:26`). "Sealed crate: not now." | 5 |
| P3-5 | P3 | **Developer notes in world.json.** | "Your round 3 potion ... Keep it working as it is." and "(your round 3 quest giver)". The game will show these once it shows item and zone descriptions. Remove them once P1-8 frees the data. | 4-5 |
| P3-6 | P3 | **Round-1 leftovers.** | The three treasures (Moonpetal Potion, Brass Key, Oak Shield) have no use, and an Oak Shield next to the SRD Shield confuses. The R1 checks pin them. | later |
| P3-7 | P3 | **Encounter danger far from home.** | Zones of danger 8-10 field CR 10-16 foes (stone golem, iron golem) in random fights. That is harmless now, because fleeing is free and losing heals. It matters once P1-3 lands: add signposts or level-gated encounter lists. | 5 |
| P3-8 | P3 | Seeded RNG for stats and battles. | `Math.random` is everywhere, so tests and balance runs can't be reproduced. | 4 (with the sim test) |
| P3-9 | P3 | No pictures for quest items (known). Quest foes on the map keep old frames (known). The battle background is the same flat green everywhere: the crypt, the glacier ([12](review/v0.5/12-boss-gravecaller.png)). | Art pass, after round 3's dark stage. | 5 |

Performance needs no work: 60 fps in every zone, about 130 game objects per zone, scene changes in 11-34 ms, a 21 MB JS heap.

## The checker constraint

**Recommendation: move past it now, for the game's content, and keep it as an engine test.** The R4 checker tests one thing:
whether the engine can run `task-r4`'s world. v0.5 passes it 25/25. It can't see any P1 above, because it equips with `equip()`,
wins with `winBattle()`, never rests, and photographs the ending on its first frame. It also blocks the fixes:

- R4-17 compares each quest's step count, step types and reward with `task-r4/data/world.json`.
- R4-18..21 replay the kit's steps and check the kit's rewards.
- The feeder's FACTS 20-21 (20 quests, 8 main + 12 side) and `plans/r4-chunks/tests/chunk-22.mjs` (chapter 2 = talk, talk, defeat,
  talk) pin the same shapes.
- R4-25 pins a monster's HP in battle to the SRD numbers. Boss balance therefore has to scale through the quest step, not through
  monsters.json.

What it would take:

1. **Split the two jobs.** *Engine gate:* run `check_game.mjs R4` on a copy of the build with `data/` replaced by `task-r4/data`.
   The engine must still run the kit's world (target ≥ 24/25). R4-02 already tolerates one R3 failure, which covers R3-30 ("retry
   after a loss") if the defeat penalty changes it. *Game gate:* our own suite, which treats the game's own `data/world.json` as the
   truth. Report the R4 score as "engine compatibility", not as the game's score.
2. **The game suite** reuses `plans/r4-chunks/tests/lib.mjs` (its server, the kit driver and the `T.press` / `T.play` helpers) in
   five files:
   - `story.mjs`: plays every main and side quest from the game's world.json in order. Each step raises the stage by 1, the game's
     own rewards are paid, and `won` leads to the ending, the credits and the title.
   - `balance.mjs`: works out each chapter's expected level and gear from the data, then runs this review's in-page sim (about 60
     lines) for each boss. Target: 35-85 % wins with no potions and at least 70 % with 3. Reward curve: level 8-10 before the dragon
     with the side quests done, and no side quest worth more XP than the next two chapters.
   - `ui.mjs`: drives everything by keys only, with no `equip()` or `winBattle()`. It checks: equip from the Items page, drink a
     potion in battle, sell, confirm a buy, rest heals, defeat wakes you at the inn, the ending stays until START, Continue on the
     title loads the save, no dialogue page has fewer than 3 words, and names fit their boxes (measured text bounds, as in the fix2
     tests).
   - `data.mjs`: checks the game's world.json. Every id resolves, step types are known, each zone has room for its people and
     things, no "round N" notes remain, and every reward item exists.
   - `engine.mjs`: the engine gate from step 1.
3. **Retire from the feeder's regression** FACTS 20-21, chunk-22, and chunk-40..44, which compare the data with the fix2 text blocks.
   Keep the rest.
4. **Cost:** one Claude planning pass, about 600-900 lines of tests, mostly reused from `lib.mjs`. The sim already exists from this
   review. No local-model time is needed. After that, P1-1, P1-2, P2-5 and the full story become ordinary data steps with small code
   changes.

## Proposed round 4 (after round 3 lands)

Step 0 is done by Claude before the local round. Steps 1-11 are for the local model, in this order, each with its test:

0. **The game suite and engine gate** (P1-8): the five files above. Retire the shape-pinning facts.
1. **An input router with a mode stack**, and menu pages kept as a registry (P2-14). Behaviour must not change, and all 58
   existing tests stay green.
2. **Items and gear:** an Items page with a cursor and scrolling, where A drinks, equips or unequips any carried thing. The Party
   page shows the worn slots, AC and attack. A battle item list replaces "START = draught" (P1-5; this covers the known missing equip
   menu and the known START item).
3. **Rest and defeat:** rest at the innkeepers of the 5 safe settlements and in the house bed. Defeat wakes you at the last rest
   place with half your gold. Fleeing can fail, and you can't flee story bosses. Drinking takes your turn (P1-3, P1-4).
4. **A fixed hero:** fixed stats or a reroll on the title, HP from `rules.json`, and seeded RNG (P2-13, P3-8).
5. **Boss balance**, including the red dragon (known): per-step scaling of `defeat` steps. Frost Brand resists fire and adds cold
   damage against red dragons. Sereth Vane is raised. Gate: the sim band (P1-1).
6. **Reward curve:** the Pale Lady's XP (known) drops to a tier-3 value. Chapter 1 runs through `Tales`, which removes the double
   pay and moves its text into the data (P1-2, P2-15, P2-6).
7. **The full story:** the 7 parked steps (known) and "The Last Knight". Bosses get `intro` pages before the fight. Saves get a
   version number (P2-5, P2-16).
8. **The ending sequence and Continue on the title** (P1-6, P2-11).
9. **Text fit:** dialogue paged by wrapped lines, and one rule for fitting names, which fixes the known "X attacks!" cut (P2-1,
   P2-2).
10. **Shop:** a sell page and a buy confirmation (P2-4).
11. **The on-screen credits** with the required SRD sentence, the licence URL and the line saying the game is not affiliated with
    Wizards of the Coast (P1-7).

Candidates for round 5: story gates and set pieces (P2-7), settlements (P2-8), placement of people and things (P2-9), the Map and
Quest pages (P2-10), item effects (P2-12), battle labels (P2-3), the art for quest items and quest foes (P3-9), and cleanup (P3-1..5).
