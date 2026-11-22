# The Cinder King: provenance ledger

Every part of the game, who made it, local or cloud, and the evidence. One row per part; add rows as rounds land, never edit the
history column of an old row (append a new row when a part is replaced). **Local** = produced by a model on the Mac Pro's GPUs.
**Cloud** = produced by a cloud model. **Human** = the operator. **Third party** = existing licensed work.

## The claim (draft)
"The game, its plan, all its code and every fix were produced by local AI on a home server. The tools it runs in (harness, checker,
archetype) were built with cloud AI, the way a studio buys its tools." Rows marked *production* must all be Local, Human or Third
party before the claim is made.

## Production (what ends up in the game)

| Part | Made by | Local / cloud | When | Evidence |
|---|---|---|---|---|
| Base game, rounds 1-3 (town, house, battle, crypt quest) | Qwen3.6-35B-A3B in Pi, from briefs + plans written by Fable; R3 had an Opus review between passes | Local code; cloud plans and review | 20-21 Nov | bench/coding-semi/runs/R3/qwen3635ba3b (start build of every R4 round) |
| World data: 36 zones, 52 people, quests, campaign skeleton (world.json) | Claude (Fable) with the R4 kit | **Cloud** | 21 Nov | commit a6198d4 (task-r4/) |
| Monsters, items, rules (srd/*.json) | SRD 5.1, Wizards of the Coast | Third party (CC-BY-4.0) | — | task-r4/data/srd/ATTRIBUTION.md (credit shown in the game) |
| Engine | Phaser 3 | Third party (MIT) | — | task/lib/ |
| Tiles and current sprites | Kenney Tiny Dungeon | Third party (CC0) | — | task/assets/dungeon.png, docs/designs/sprite-bakeoff/packs/ |
| Sprites for all monsters and items (chosen) | DawnLike v1.81 (DragonDePlatino, DawnBringer) + Kenney Tiny Dungeon; choice by the operator, blind | Third party (CC-BY-4.0 / CC0); Human choice | 22 Nov | docs/designs/sprite-bakeoff/BAKEOFF.md (17/20 free packs) |
| Sprite matching (which frame for which monster/item) | gemma-4-12B with vision, on the T4 | Local | queued 22 Nov | bench/coding-semi/sprite_match.py → docs/designs/sprite-bakeoff/sprites.json |
| Plan A, one session (18 steps) | Qwen3.6-35B-A3B in Pi + game archetype | Local ($0 cloud) | 22 Nov 11:54-12:37 | plans/r4a-local/, runs/R4L/planner.json |
| Plan B, staged (26 steps + 9 harness gates) | Qwen3.6-35B-A3B in Pi, stage by stage + archetype; gates inserted by the harness | Local ($0 cloud) | 22 Nov 12:37- | plans/r4a-staged/, runs/R4T/planner.json |
| Game code, round 4 | (pending: the build of the chosen local plan) | Local | — | runs/R4L or R4T |
| Story direction (outline, structure) | Claude research agent, approved by the operator ("story is solid") | **Cloud** (direction, like feedback) | 22 Nov | story/STORY-RESEARCH.md |
| In-game story text (dialogue, quest lines, world.json changes) | (planned: Qwen3.6-35B writes it from the approved outline in feedback round 1) | Local | — | runs/R4LF1/ |
| Fix rounds from the operator's feedback | (planned: feedback by the operator, fix plans and code by Qwen3.6-35B) | Human + Local | — | runs/R4LF<n>/feedback.md, planner.json |
| Box cover art | Gemini 3.1 Flash Image via OpenRouter ($0.07) | **Cloud** | 22 Nov | story/art/ (credit it, or replace with a local image model later) |
| Back-cover text | Claude (the coordinator session) | **Cloud** | 22 Nov | story/BACK-COVER.md |

## Tools (not in the game)

| Part | Made by | Local / cloud | Evidence |
|---|---|---|---|
| Game archetype (skeleton, testkit, planning guide) | Fable | Cloud | archetypes/game-phaser/ |
| Harness gates (rounds 1-3 replay, drawing, zone looks) | Opus agent | Cloud | archetypes/game-phaser/testkit/gate.mjs |
| Planners, feeder, feedback tool, coverage script | Claude sessions and agents | Cloud | bench/coding-semi/plan_local.py, plan_staged.py, feed_chunks.py, feedback_local.py, plan_coverage.py |
| Checker (25 checks) | Fable (R4 kit) | Cloud | bench/coding-semi/check_game.mjs |
| Visual grade | Claude Opus, blind, screenshots only | Cloud (measurement) | bench/coding-semi/judge_visual.py |

## Open items before the claim
- world.json (zones, people, campaign skeleton) was written by Fable: replace or rewrite its text locally in the story round, or
  state it in the claim as given data like the SRD.
- Rounds 1-3 code is local but its plans and one review were cloud: state it, or treat rounds 1-3 as the starting kit.
- Cover and back-cover text are cloud: credit, or redo locally.
