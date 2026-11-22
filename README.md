# The Cinder King

<p align="center"><img src="story/art/cinder-king-cover.png" alt="The Cinder King cover" width="360"></p>

> **Every night, a bell tolls beneath the grave of Brindlemere.** Nobody in the village rang it. Nobody alive, anyway.

A Game Boy-style fantasy RPG (Phaser 3, SRD 5.1 monsters and items) that I am building using local AI agents. The plan, every line
of code and every fix are written by models running on a home server in my office, not in the cloud. I drive the vision, play
each build, write what is wrong or missing, and the local agents turn that into the next round.

## Why

Frontier models can build this in one go. I wanted to know whether I could get to the same place with models I run
myself: more rounds, more time and more of my own feedback, but no dependence on a cloud service that may get more expensive or
harder to reach. This game is the test. The goal is a complete game I can honestly say was made 100 % with local AI.

## How it is made

- **Hardware:** a Mac Pro (2012) with two NVIDIA cards, a Tesla T4 (16 GB) and a Quadro RTX 4000 (8 GB), running llama.cpp.
- **The builder:** Qwen3.6-35B-A3B (3B active parameters, about 80 tokens a second on both cards), driven by the
  Pi coding agent.
- **Plans in small steps:** the local model writes the plan itself, feature by feature, with one test per step. Then it builds the
  game one step at a time, each step in a fresh session, and a step only counts when its test passes. Fixed checks after every
  feature make sure the earlier parts still work and that the maps are actually drawn.
- **My feedback rounds:** after each build I play it and write notes. The local model turns the notes into small fix steps with
  tests and builds them. Repeat until the game is good.
- **Art:** free pixel-art packs (Kenney Tiny Dungeon, DawnLike), chosen in a blind test against AI-generated sprites. A local vision
  model matches each monster and item to its sprite.
- **Story:** "The Cinder King", an original story in three acts and eight chapters: a haunted crypt, a cult that sings to wake a
  dragon, a broken blade to reforge, and a villain who has been waiting three hundred years. The outline is in `story/`.

`PROVENANCE.md` records who made each part, local or cloud, and when. Some of the tools around the game (the test harness, the
starting skeleton, the story outline and the cover) were made with cloud AI; the ledger says exactly which, so the claim can be
checked line by line.

## Play

Serve the `game/` folder with any static web server and open `index.html`, for example `python3 -m http.server -d game 8000`.

Controls: arrows move, Z or Space is A, X is B, Enter is Start (menu). The on-screen buttons work on a phone. I'm also planning a
version for an ANBERNIC RG40XXV handheld.

## Progress

The first commit (`v0.3-starting-kit`) is where the local agents start: a small town, a house, battles and a crypt quest from
earlier rounds, plus the data for the full world (36 lands, 52 people, 83 monsters, 87 items). Every later commit is one round of
local work, tagged and recorded in `PROVENANCE.md`.

| Where | What |
|---|---|
| `game/` | the playable game, at its latest round |
| `story/` | the story outline, the back-cover text and the cover art |
| `PROVENANCE.md` | who made each part, local or cloud |
| `CREDITS.md` | the open works the game uses and their licences |

## Licence

Open source. The game's code is under the **MIT licence** (`LICENSE`). The original story, text, world data and cover art are under
**CC BY 4.0** (`LICENSE-CONTENT`). Third-party works keep their own licences, listed in `CREDITS.md`: SRD 5.1 (CC BY 4.0), Phaser
and rexUI (MIT), Press Start 2P (OFL), Kenney Tiny Dungeon (CC0) and DawnLike (CC BY 4.0).
