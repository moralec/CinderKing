# The Cinder King: the game's own tests

These tests answer one question: **can a player finish this game, and is it fair?** They play the build the way a player does,
with real key presses in a headless browser, and they take the build's own `data/world.json` as the truth. They replace the old
round-4 checker as the measure of the game; that checker stays as one test here (`engine.r4`), where it measures only whether the
engine can still run another world from data.

## Run

```
node tests/run.mjs                       # the game in ../game, every part (about 17 minutes, 9 of them the engine check)
node tests/run.mjs <game dir> --fast     # without the engine check, 120 fights a boss (about 6 minutes)
node tests/run.mjs <game dir> --only story,ui
node tests/run.mjs <game dir> --only ui.items --must ui.items     # the gate of the step that builds the Items page
node tests/run.mjs <game dir> --strict   # the gate of a finished round: nothing may fail, expected or not
node tests/run.mjs --list                # every test, with the ones expected to fail today
```

It needs Node 22 or newer and Chromium (`/usr/bin/chromium`, or the env `Q1_CHROMIUM`). Nothing else: the runner serves the folder
itself on a free local port and closes the browser when it ends. Other options: `--skip id,id`, `--fights N` (default 400),
`--json FILE` (every result, with the balance table), `--shots DIR` (a screenshot when a test fails), `--checker DIR`.
On a machine that suspends when idle, hold a sleep inhibitor for a full run (`systemd-inhibit --what=idle:sleep node tests/run.mjs ...`):
a suspend in the middle closes the browser and fails the test that was running.

One line a test: `PASS`, `FAIL`, `XFAIL` (it fails, and `expected-failures.json` says why and which step fixes it), `XPASS` (listed
there but it passes now: remove the entry) or `SKIP`. The exit code is 0 when nothing failed unexpectedly. The last line is
`SUMMARY {json}`.

## The parts

| Part | What it asks | How |
|---|---|---|
| `story.mjs` | Can every chapter and every side quest be played to its end, in order? Does the ending play and return to the title? | Each step with the keys: turn to the person or thing, A, read every page with A, fight with A. |
| `balance.mjs` | Can a player who plays the story straight win its boss fights? Do rewards and levels make sense? | The game's own battle code fights each boss 400 times. |
| `ui.mjs` | Do the screens work with keys alone: Items (list, drink, wear, take off), shop (buy, confirm, sell), rest, running, a drink's cost, defeat, the title, the status bar? Is every screen drawn clean? | Keys only. |
| `data.mjs` | Is `data/` whole: ids resolve, every quest step has what it needs, rewards, no orphans, a picture for every creature and item, everything placed and reachable on foot? | Reads the files; walks the maps in the game. |
| `credits.mjs` | Do the on-screen credits carry what the licences ask? | Opens the Credits page and reads it. |
| `engine.mjs` | Does the engine still do what earlier rounds built? | The rounds 1-3 replay; the R4 checker on a copy with the kit's data. |

`lib/` holds what they share: `harness.mjs` (server, browser, keys, the in-page helpers), `driver.mjs` (the Chrome DevTools
driver), `adapter.mjs`, `gate.mjs` and `replay-rpg.mjs` (the build kit's rounds 1-3 replay), `review-v0.5.json` (calibration).

## The rules of a test

1. **A player's fingers do the thing under test.** Arrows, Space (A), Escape (B), Enter (START), sent as real key events.
2. **The hook only sets up and reads.** `window.__game.actions.travel / addItem / addGold / grantXp / forceBattle / save` put the
   hero in a state; `equip()`, `useItem()`, `buy()`, `sell()` and `winBattle()` are never the thing a test passes on. (Where a
   test says "set-up", it may use them: `balance.mjs` wins the fights *before* the boss it measures with `winBattle()`.)
3. **The data is the truth.** Quest shapes, rewards, names and numbers are read from the build's `data/`. No test holds a copy.
4. **What is drawn counts.** A test reads the texts Phaser draws (with their boxes), not internal flags: "the title is up" means
   a drawn line is `Press START`, `Continue` or `New game`; "the end card is up" means a drawn line is `THE END`.
5. **Internals live in one file.** `lib/adapter.mjs` is the only place that names a variable of the game that is not on the hook
   (`G.scene`, `G.busy`, `DB.ready`, and `G.hero` as a fallback). A round that renames them changes that file only.
6. **Story fights test the story, not the odds.** In `story.mjs` the hero cannot die (his HP is set very high before the first
   blow); the foe keeps its numbers and falls to real blows. Whether a real hero wins is `balance.mjs`'s question.

### What the suite expects of a screen it drives

- **Lists** (Start menu, Items, shop, battle items): the row under the cursor starts with `>`; ArrowUp and ArrowDown move it; a row
  shows at least the first 10 letters of the thing's name.
- **Items page:** A on `Items` puts the cursor into the list of the bag. A on a row drinks a potion, wears a piece of gear, or
  takes off gear that is worn (worn gear is in the list too). The weapon and armour worn are named on the Party or Items page.
- **Shop:** the first A on a ware asks, the second buys, B takes it back. ArrowRight shows the Sell list (the word "Sell" is on
  the screen); A sells for half the price.
- **Rest:** A through an innkeeper's talk restores all HP (a fee is allowed; the answer defaults to yes). The bed in the house is
  `window.__game.landmarks.bed`.
- **Battle:** START drinks or opens a list of the bag (A takes the row). A drink costs the turn. B can fail, often enough to be
  seen in 30 tries and not always (a chance between about 15 % and 85 %); it never works on a story boss.
- **Saves:** the hook's `save()` and `load()` stay quick and ask nothing: the simulation loads a save before each of its fights.
  After the ending the game keeps the won state, so that Continue on the title returns to it.
- **Ending:** the end card comes after the last line and stays; START rolls the credits (A turns pages); then the title, where
  START on `Continue` returns to the won game.
- **Title:** with a save, `Continue` is the entry START takes.

### What the suite expects of the data

- A person offers a rest when they have a `rest` field, or their `title` says innkeeper. A zone is a settlement when it has
  `"settlement": true`.
- A boss speaks before the fight through `intro` pages on its `defeat` step; a long boss name may have a `short` battle name.
- Everything else is the format the game already reads.

## The bands and why

**A chapter boss is won in 40 % to 85 % of the fights, without potions**, by the hero as the story delivers him: the XP of the
main quests and their bosses only (no side quests, no grinding), wearing the story's rewards, at full HP.

- *Below 40 %* a player needs three or more tries on average and feels the game is broken, not hard. In v0.5 five bosses were
  under 5 %: the campaign could not be finished.
- *Above 85 %* the boss is not a boss. In v0.5 the chapter 7 boss was won 100 % of the time.
- *No potions* is the number that is checked, because it does not depend on how a drink works. The rate with 3 Potions of Healing
  (drunk at 35 % HP or less) is reported beside it: it shows what preparation buys.
- At 400 fights the number moves about 2.5 points from run to run (about 4.5 with `--fast`). Aim a boss at 50-75 %, not at
  the edge of the band.
- The hero is the game's own when a new game always gives the same one. While the game still rolls a new hero each time, the
  simulation uses the review's typical roll (STR 12, DEX 14, CON 11) so that runs can be compared.

**Rewards:** each chapter pays at least as much as the one before and at most 3 times as much (XP and gold; the last chapter is
left out, it ends the game). No side quest pays more than twice the best-paid chapter before the last. In v0.5 one side quest
paid 10,000 XP against a best chapter of 2,900.

**Levels:** with every side quest done, the hero meets the last boss at level 8 to 10 (the review's target); the level by the
story alone is reported. Hit points follow `data/srd/rules.json`: the class's hit die at level 1, then its average rounded up,
plus the CON modifier.

The numbers are constants at the top of `balance.mjs` (`BAND`, `CURVE`).

## Expected failures

`expected-failures.json` is the to-do list a machine can check: every test the starting build of round 4 fails, why, the item of
`REVIEW-v0.5.md` it comes from, and the round-4 step that fixes it. A step is done when its tests pass under `--must`; its
entries are then removed. A finished round passes `--strict` with the list empty (or holding only what was put off, by decision).

## Calibration

`node tests/run.mjs <v0.5 build> --only balance.calibration --calibrate` runs the simulation with the levels and gear of the
review's balance table (`lib/review-v0.5.json`) and passes when every win rate is within 5 points of the review's. It is the
proof that this simulation is the review's method. Two differences between that table and what `balance.boss.*` measures, both
found by playing the story step by step:

- The review's table has the hero at level 2 for chapter 1 and level 3 for chapter 2. The story gives level 1 and level 2: no XP
  is paid before the first boss.
- The review's hero carried a shield from chapter 2 on (10 gp at the first shop). The suite's hero wears only what the story's
  rewards give.

So `balance.boss.*` is a little stricter than the review, and says so in each line (level, HP, AC, attack).

## The engine check

`engine.r4` copies the build, replaces `data/world.json` and `data/srd/` in the copy with the build kit's, and runs the round-4
checker on it. It passes at 24 of 25 or more. It needs the checker, which is not part of this repository (`--checker DIR`, the
env `CINDER_CHECKER`, or `bench/coding-semi` beside the repo); without it the test is skipped. For it to keep passing, every
balance lever must come from the game's data and default to the plain rules when the data does not name it: the kit's world
has no boss scaling, no `intro`, no `rest`.
