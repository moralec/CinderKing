# Old checks to retire as measures of the game's content

Decision of 22 Nov 2026 (after `REVIEW-v0.5.md`, P1-8): the game is measured by its own suite (`tests/`). The round-4 checker and
the builder's old step tests held a second copy of the story (quest shapes, rewards, lines, monster numbers) and so blocked every
fix to the story and to balance. They stop measuring content. Paths below are in the build harness (`bench/coding-semi/`), which
is not part of this repository.

## 1. The round-4 checker (`check.py R4`, `check_game.mjs`)

It stays, as an **engine check**: run on a copy of the build with the kit's data (`engine.r4`, target 24 of 25). It no longer
runs on the game's own data, and its score is reported as "engine compatibility", never as the game's score.

| Check | What it pinned | Now measured by |
|---|---|---|
| R4-17 | each quest's step count, step types and reward equal to `task-r4/data/world.json` | `data.quests`, `data.quests.flow`, `data.quests.rewards` (the build's own data is whole) |
| R4-18, R4-19, R4-20 | the kit's main quests step by step, the kit's rewards, `won` | `story.main.1` to `story.main.8` (keys, the build's own steps), `story.rewards`, `story.ending.*` |
| R4-21 | the kit's side quests and rewards | `story.side.*`, `story.rewards` |
| R4-25 | a monster's AC, HP and XP in battle equal to the SRD file | `balance.boss.*` (the fight as the story starts it, whatever its numbers) |
| R4-14, R4-15, R4-16 (same kind) | the kit's people, lines and shop stock | `data.people`, `data.placed`, `ui.shop.*`, `ui.layout.talk` |
| R4-22 | the SRD named in `window.__game.credits` | `credits.*` (what is drawn on the screen) |

On the engine copy all of these still pass, because there the kit's data is the truth.

## 2. The feeder's regression facts (`plans/r4-chunks/tests/lib.mjs`, `FACTS`)

Every step test of rounds 4 to 4.3 re-checks these on a fresh page. Round 4's step tests must not inherit them.

| Fact | What it pins | Do |
|---|---|---|
| 20 | `Tales.all().length === 20` | retire. `data.quests` checks the list against the data |
| 21 | 8 main and 12 side quests, each step with a place | retire. `data.placed`, `data.reachable` |

Facts of the same kind that a round-4 step will meet (not in the review's list; found while writing the suite):

| Fact | What it pins | Meets |
|---|---|---|
| 1, 12 | 36 zones | nothing planned; rewrite against the data when it does |
| 9 | `winBattle()` pays the monster's full SRD XP | the reward pass (P1-2), if random fights pay less |
| 25 | `uiScene().endCard`, hidden at the start | the ending (P1-6) |
| 26 | the elder is an `ACTORS` entry, `quest.stage === 0` | chapter 1 through `Tales` (P2-15) |
| 30 | the save's key and fields | save versions (P2-16) |

## 3. Step tests of earlier rounds

| Test | What it pins | Now measured by |
|---|---|---|
| `r4-chunks` chunk-22 | chapter 2 = talk, talk, defeat, talk; "Garrick Redcap is defeated."; 60 gp, 450 XP, Chain Shirt; the last reward 5000 gp | `story.main.2`, `story.main.8`, `story.rewards` |
| `r4-fix2` chunk-40, 41, 42 | the lines of chapters 2 to 8 equal, letter for letter, to `plans/r4-fix2/assets/world/*.txt` | `story.main.*` (any text plays), `story.pages.*` |
| `r4-fix2` chunk-43 | eight side quests, five people's lines and the intro equal to the same files; the Pale Lady's reward | `story.side.*`, `balance.rewards.curve` |
| `r4-fix2` chunk-44 | six biome lines | already replaced in round 3 by `r4-fix3` chunk-66; `engine.zones` checks that biomes look different |

Step tests that pin a behaviour round 4 changes on purpose (read from their first lines, not run against a changed build). Each
leaves the gate in the step that changes the behaviour, as round 3 did for chunk-44 and chunk-45:

| Test | Pins | Changed by | Then measured by |
|---|---|---|---|
| chunk-25 | the end card is up while the last talk is open and goes when it closes; pages cut at 78 letters | the ending (step 8), text fit (step 9) | `story.ending.*`, `story.pages.*` |
| chunk-26 | chapter 1 through the old actor, "You also get 25 gp and 300 XP" | the reward pass (step 6) | `story.main.1`, `story.rewards` |
| chunk-28, 29, 35 | A in the shop buys at once | shop confirm and sell (step 10) | `ui.shop.*` |
| chunk-48 | the Items page shows five rows | the Items page (step 2) | `ui.items.*` |
| chunk-53 | the title; any read of `window.__game` skips it | Continue on the title (step 8) | `ui.title.*` |
| chunk-05, 51, `r4-fix3` chunk-68 to 71 | a drink is free; the strip; the three defeat outcomes | rest and defeat (step 3), if it changes them | `ui.battle.*`, `ui.defeat.price`, `ui.status.*` |

Step tests of round 3 that pin what the author's notes on v0.6 (`feedback/round4-author.md`) ask to change:

| Test | Pins | Asked | Then measured by |
|---|---|---|---|
| `r4-fix3` chunk-61 | the foe stands on a dark stage (`FoeStage`) | "monsters are now with black background; that is a mistake" | `ui.battle.nobox` |
| `r4-fix3` chunk-71, `r4-fix2` chunk-51 | the status bar is drawn always | on the map only, not in battle or on the title | `ui.status.maponly`, `ui.title.nostatus` |
| `r4-fix2` chunk-50, `r4-fix` chunk-36, 37 | the wording and boxes of the battle log and dice row | narration; no bare "?", "-", "d8" | `ui.battle.narration`, `ui.battle.controls`, `ui.layout.battle` |
| `r4-chunks` chunk-21, 33 | quest foes on the map use the monster's old frame | their picture of `sprites.json` | `ui.map.foes` |

## 4. How round 4's plan treats them

- **The gate** of round 4 is: `node tests/run.mjs <build>` (this suite, which holds the rounds 1-3 replay as `engine.replay.*`
  and the engine check as `engine.r4`). It replaces "every old step test again, then `check.py R4` on the game's data".
- **A step is done** when its own tests pass: `node tests/run.mjs <build> --only <ids> --must <ids>`. The step removes those ids
  from `expected-failures.json`. The last step runs the suite with `--strict`.
- **Regression between steps:** the fast part of the suite (`--fast`), not `FACTS`. Old step tests of sections 2 and 3 are left
  out; the others (engine, world, sprites, round 3) may stay in the gate's list for as long as they pass.
- **Content changes are data steps** with no test of their own beyond the suite: the full story outline, boss numbers, rewards,
  inns. The suite reads whatever the data says.
- **Balance levers come from the data** and default to the plain rules when the data has none (a `defeat` step with no scaling
  of its own puts the SRD monster in the fight as it is). That keeps `engine.r4` at 24 or more on the kit's data.
