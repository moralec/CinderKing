# The Cinder King

<p align="center"><img src="story/art/cinder-king-cover.png" alt="The Cinder King cover" width="360"></p>

> **Every night, a bell tolls beneath the grave of Brindlemere.** Nobody in the village rang it. Nobody alive, anyway.

A Game Boy-style fantasy RPG (Phaser 3, SRD 5.1 monsters and items) that LocalAI is finishing with local AI only: the plan, every
line of code and every fix round are produced by local models on a home server (a Mac Pro with a Tesla T4 and a Quadro RTX 4000; Qwen3.6-35B-A3B driven by the Pi coding agent), from the operator's feedback.
Operator, 22 Nov 2026: "We will iterate, give it feedback and continue until we get to a full game so we can claim that was done 100%
using local AI."

| Where | What |
|---|---|
| `PROVENANCE.md` | who made each part, local or cloud, when, with evidence: the record behind the "100 % local" claim |
| `story/` | the story research and the approved outline (STORY-RESEARCH.md), back-cover text, cover art |
| `game/` | the playable game (current round) |
| `CREDITS.md` | licences of the open works it uses |
| LocalAI: `bench/coding-semi/plans/r4a-local/`, `r4a-staged/` | the two local plans (one session; staged) |
| LocalAI: `bench/coding-semi/runs/R4L/`, `R4T/`, `R4LF<n>/` | builds and feedback rounds (names in bench/coding-semi/RUN-NAMES.md) |
| LocalAI: `docs/designs/sprite-bakeoff/` | the sprite decision (free packs 17/20), packs with licences, sprites.json (gemma vision matching) |

## Play

Serve the `game/` folder with any static web server and open `index.html` (e.g. `python3 -m http.server -d game 8000`).
Controls: arrows move, Z or Space = A, X = B, Enter = Start (menu). On-screen buttons work on a phone.

## This repository

`game/` is the playable game. Its history is the history of the claim: the first commit is the starting kit (rounds 1-3, built by a
local model, plus the round-4 world data); every later commit is a round made by local AI (plan, build, fix rounds from the
operator's feedback), recorded in PROVENANCE.md. The tools it was made with (planner, feeder, checker) live in the LocalAI repo
(LocalAI, bench/coding-semi/), not here.

## Licence

Open source. The code (`game/js/`, `game/index.html`, scripts) is under the **MIT licence** (`LICENSE`). The original story, text,
world data and cover art are under **CC BY 4.0** (`LICENSE-CONTENT`). Third-party works keep their own licences, listed in
`CREDITS.md` (SRD 5.1 CC-BY-4.0, Phaser and rexUI MIT, Press Start 2P OFL, Kenney Tiny Dungeon CC0, DawnLike CC-BY-4.0).
