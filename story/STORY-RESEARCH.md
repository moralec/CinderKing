# Story research: a tried-and-tested shape for "The Cinder King"

Date: 2026-11-22. Prepared for the first feedback round on the R4 game (`bench/coding-semi/task-r4/`).
Operator's ask: *"run some research on D&D books, novels, campaigns. Maybe we can write the story to follow a tried and
tested storyline."*

**The IP rule this follows.** We take three kinds of thing: (a) structures and techniques; (b) open-licensed text, with its
licence named; (c) public-domain myths and old literature. From famous published adventures and novels we take only
high-level lessons, written in our own words. We take no text, names, places or plot from them. The R4 brief adds one more
rule: the game must not name "Dungeons & Dragons" or "D&D", or any place, person or story from a published setting.

**The game's limits.** The game is built from `data/world.json`. A quest step can only be `talk`, `fetch`, `open` or
`defeat`. A dialogue box holds a few short lines. The data has 8 main quests that unlock in order (brief requirement 30), and
chapter 1, *The Restless Crypt*, must not change. Every proposal below keeps to all of this: it uses the 36 zones and 52
people that already exist, and monsters from `data/srd/monsters.json`.

---

## 1. Sources and templates: what to take from each, and its IP status

| # | Source / template | What it is | What to take for this game | IP status |
|---|---|---|---|---|
| 1 | *Lost Mine of Phandelver* (WotC starter) | Starter adventure built around one frontier town | A **hub town** that is safe, full of rumours and in danger, so players come to care about it. Local thugs are the first problem. Behind them is a hidden boss, and behind the boss a bigger one: the **villain in layers**. Sites get harder as the hero levels. | Published, copyrighted. **Lesson only.** No names (town, gang, villains, mine) and no plot. |
| 2 | *Keep on the Borderlands* (B2) | A keep plus a cave complex | The **home base** is where you shop, rest and hear rumours. Danger rises as you go further from it. | Published. **Lesson only.** |
| 3 | *Village of Hommlet* (T1) | A detailed village, a ruin nearby, and a temple beyond | The first "home base + adventure" module. Every villager has a name and a place, and **the evil has agents and money inside the village**. The small ruin leads on to the big temple, so the chain escalates. | Published. **Lesson only.** |
| 4 | *Dragon of Icespire Peak* | Starter built on a job board | Quests come in **tiers**: finish 2 and 3 more appear, finish 2 of those and 3 final ones appear. **Side quests count toward levels.** The dragon at the end is something the players hear about all along. | Published. **Lesson only.** |
| 5 | *Curse of Strahd* | Gothic campaign with a central villain | **The villain is present from the start**: he expects the heroes and the land works for him. A reading at the start sets where the key items are. Warning from players: if you level up every chapter, the final boss ends up too weak. | Published. **Lesson only.** Note: our "Countess who invites guests to dinner" sits close to this book's best-known scene. Reword it (section 4). |
| 6 | **Five-Room Dungeon** (Johnn Four, ~2006) | Five-beat dungeon template | Each chapter runs **entrance/guardian → puzzle or talk → setback/trick → climax → reward/twist**. The template also works for a whole chapter spread over several zones, not just a dungeon. | A free technique. Structures are not copyrightable. **Free to use.** |
| 7 | **Three Clue Rule** (Justin Alexander, *The Alexandrian*) | Mystery and node design | **Every conclusion gets at least 3 clues**, spread across people, things and places. Inverted: if a node holds 3 clues to other nodes, players will reach at least one of them. We use it so the twist is *earned*: three or more pointers to the true villain before the reveal. | Technique, described in our own words. **Free to use.** |
| 8 | **Node-based scenario design** (*The Alexandrian*) | Hubs and nodes instead of a fixed plot | The side quests act as **nodes that point back into the main chain**. That way the open world feeds the story instead of padding it. | Technique. **Free to use.** |
| 9 | **Lazy GM prep** (Michael E. Shea, Sly Flourish; *Lazy GM's Resource Document*) | 8 prep steps: strong start, secrets and clues, fantastic locations, NPCs, monsters, rewards | **Strong start** (start in the action; the tolling bell already does this). **Secrets and clues**: about 10 one-line secrets, not tied to a place, dropped wherever they fit. One **fantastic location** per chapter. | The *Lazy GM's Resource Document* is **CC-BY 4.0**, with a required attribution. We take only the technique, not its text, so no credit is needed. If we ever quote it, add the credit. |
| 10 | **Fronts** (*Dungeon World*, Sage LaTorra and Adam Koebel) | A villain's plan as a list of **grim portents** that lead to an **impending doom**, plus stakes questions | The Ashen Choir is a front. Its 5 portents (ash falling ever closer) show up in quest pages, chapter by chapter. Campaign fronts have 3–5 portents; ours has 5. | *Dungeon World* text is **CC-BY 3.0 Unported**. We use the idea only, so no credit is needed. Credit it if we quote it. |
| 11 | **Hero's journey / Save the Cat beats** | Story beat sheets | Three acts: **midpoint** (a false victory or defeat), **All Is Lost** and **finale**. Save the Cat's own game analysis says games struggle to take everything away at the low point. Our answer is to make the loss narrative (the song already worked; the dragon wakes) rather than taking items away. | Generic structure. **Free to use.** |
| 12 | *Dragon Quest I* | Early console RPG | **Hub-and-spoke** world. Rest towns along the way. Key items open locked doors. Short battles. Each level-up opens a further ring of the map. The design guides the player by gating. | Published game. **Lesson only.** |
| 13 | *Zelda: A Link to the Past* | Action RPG | **Collect the parts in a fixed order, get the legendary blade, then the world turns over** (a second act). The map's gates match the story's gates. | Published game. **Lesson only.** |
| 14 | *Final Fantasy* / *Dragon Quest III* (pattern) | JRPG "false final boss" | Defeating the apparent leader shows a power behind them. This is a cheap, reliable twist when it is set up in advance. | Common trope, not owned. **Free to use**, but say it in our own words. |
| 15 | *Baldur's Gate* (pattern) | CRPG with chapters | **Chapters end on a revelation.** The investigation goes from a local symptom (bandits, shortages) to the organisation, then to its leader. The hub city appears late. | Published game. **Lesson only.** |
| 16 | **Volsunga saga** (13th c.; Morris and Magnússon translation, 1870/1888, Project Gutenberg #1152) | A broken ancestral sword is **welded again from its shards** and the hero slays the dragon Fafnir with it | This is the backbone of chapters 4–6 (Winter's Tooth broken, reforged, then used on the dragon). The world already has it. Our myth source for "the reforged blade" is the saga itself, not Tolkien's later echo of it. | **Public domain** (medieval text; the 1888 translation is PD). |
| 17 | **Beowulf** (Old English; Gummere 1910 translation PD) | Three monsters, each larger than the last. The last is a dragon woken by **the theft of one cup** from its hoard. | **Escalation in threes** and the **small cause of a great disaster**: a single bell in a village grave wakes a dragon. A sword found in the foe's lair beats the foe. | **Public domain.** |
| 18 | **Grettis saga** (ch. 18; Morris and Magnússon 1869 translation PD) | Grettir breaks into the mound of **Kárr the Old**, a barrow-dweller guarding treasure, and wins a sword | The model for **the Barrow King** side quest (Oldking Barrows) and the haunted-crypt tone of chapter 1. The undead king guards what he was buried with. | **Public domain.** |
| 19 | **Shahnameh**: Zahhāk and Kāveh (Ferdowsi, c. 1010; Warner and Warner translation 1905–25) | A usurper-tyrant kept alive by serpents that must be fed. **A blacksmith** raises his leather apron as a banner and the people rise. The tyrant is **imprisoned under a mountain** rather than killed. | **The tyrant sealed in a mountain** (our Cindergate). **The smith as a hero of the people** (Forgemaster Brakka). The idea that a tyrant who is only sealed away will one day stir. | Original **public domain**. The Warner translation is pre-1929 and **PD in the US** (check it outside the US before quoting). |
| 20 | **Prose Edda**: Surtr and Muspelheim (Snorri, 13th c.; Anderson 1879 and Brodeur 1916 translations PD) | The fire-giant at the border with a flaming sword, who will burn the world | Imagery for **Mount Cindermaw and the fire-giant guards** (the encounter list already has `fire-giant`). Ash as the sign of the end. | **Public domain.** |
| 21 | **Carmilla** (J. Sheridan Le Fanu, 1872) + the "blood countess" legend | The original pale aristocratic vampire lady | The source for **Countess Velda Mournshade, "the Pale Lady"**, so she comes from a public-domain origin rather than a published game villain. | **Public domain.** |
| 22 | **King-in-the-mountain** folk motif (Arthur, Barbarossa, Holger Danske) | A sleeping figure under a hill who will wake in the hour of need | **Inverted**: here it is a sleeping *tyrant* who will wake in the hour of *greed*. The Moon Stone's line, "He sleeps under Cindermaw", plays on it. | **Public domain** folklore. |
| 23 | **Redcap** (Border folklore) | A murderous goblin who dyes his cap in blood | Already used for the bandit gang's name. | **Public domain** folklore. |
| 24 | **SRD 5.1** (Wizards of the Coast) | Monsters, items, rules | Every foe and reward named here comes from `data/srd/`. | **CC-BY 4.0**. The credit is already in `data/srd/ATTRIBUTION.md` and must stay in the game's credits. |
| 25 | Tolkien (*The Hobbit*, *On Fairy-Stories*) | Novel and essay | The **eucatastrophe**: a sudden joyful turn at the end, which lands only because the dark came first. **There and back again**: the story ends at home, which has changed. A dragon is beaten by knowing its weak point, not by more force. | Copyrighted. **Lesson only.** No names, no Ring, no Andúril (our reforged-sword source is the Volsunga saga, row 16). |
| 26 | Ursula K. Le Guin (*A Wizard of Earthsea*) | Novel | **The hero's own act lets the danger in**, and the ending comes from facing that, not from escaping it. In our story the hero must open the Cindergate himself. | Copyrighted. **Lesson only.** |
| 27 | Terry Pratchett (*Guards! Guards!*) | Novel | **A secret society calls up a dragon to serve its own ends, and the dragon has other ideas.** In our story the Choir thinks it is waking a servant. The ordinary people (the watch, the town) matter. | Copyrighted. **Lesson only.** "A cult wakes a dragon" is a common trope, but avoid this book's satirical beats and its dragon-as-king plot. |
| 28 | *Dragonlance Chronicles* (Weis and Hickman) | Novels and modules | A **lost legendary weapon brought back** turns a war that seemed lost. An **old betrayal** becomes the new threat. Friends from the start come back at the end. | Copyrighted. **Lesson only.** No lances, no names. |
| 29 | *Forgotten Realms* novels (e.g. Salvatore) | Novels | Keep the cast small and give each important NPC one strong trait you can show in two lines. Rivals recur. | Copyrighted. **Lesson only.** |
| 30 | Tyranny-of-Dragons-type "cult frees a dragon" arcs | Published campaign pattern | Another sign that **a cult working step by step to free an ancient dragon** is a proven spine. It is generic enough to use, but every specific (masks, a dragon queen, named cult) is theirs. | Published. **Lesson only.** |

**What every proven source agrees on** (these become our design rules):

1. **A home worth saving, and a hub that changes.** Brindlemere is home and Highmarrow is the hub. The ending comes back home.
2. **The villain arrives in layers.** First a symptom (an undead bell), then the hirelings (bandits), then the organisation
   (the Choir), its face (the High Cantor), its hidden hand (the twist), and finally the real monster (the dragon).
3. **Escalate in threes** (Beowulf), and **show the plan advancing** (fronts) so the world feels like it moves without the player.
4. **Every chapter is one Five-Room arc**, ending on a revelation that points to the next (Baldur's Gate chapters).
5. **Three clues for anything that matters**, the twist above all.
6. **The legendary weapon is broken, then reforged**, and the dragon falls to the weak point the story set up (winter vs fire).
7. **Side quests feed the main arc**: each one leaves a clue, a portent or an ally, and pays toward the next level (Icespire).

---

## 2. Three structures that fit this game

What the world already has: Brindlemere (start) at 1,3. Highmarrow (crossroads, the Loremistress) at 2,2. Three
safe-settlement rest stops: Saltmere (west), Karn Doruhl (north), Sunspire Oasis (east). The danger gradient runs from
0–2 near home to 7–10 in the north-east. The finale is in the far north-east corner (Cindergate 5,1, Cindermaw 5,0). The
whole main chain is 8 chapters and 12 side quests over 52 people.

### Structure A: Hub and spokes with a villain in stages (the Hommlet / Phandelver model)

The hero lives in a home village with one hub nearby. Each spoke is a site that grows harder. Each site removes one layer of
the villain.

| Role | Zone(s) | Chapter |
|---|---|---|
| Home (start + ending) | Brindlemere 1,3 | 1, 8 |
| Hub (quest giver, rumours, armourer) | Highmarrow 2,2 (Ilsabet Quill) | 2–5, 7 |
| Spoke 1: local symptom | Thornwood + Hollow Crypt 2,3 | 1 |
| Spoke 2: the hirelings | Gallows Heath 3,2 | 2 |
| Spoke 3: the organisation's traffic | Saltmere 0,2 → Wrecker's Coast 0,3 | 3 |
| Spoke 4: **the reveal** (what they want) | Willowfen 1,4 → Drowned Shrine 0,5 | 4 (midpoint) |
| Spoke 5: the remedy | Karn Doruhl 2,0 → Stonejaw 3,0 → Frostfang 0,0 → Rimewater 1,0 | 5–6 |
| Spoke 6: the organisation's heart | Sunspire Oasis 4,3 → Sepulchre of Sand 5,3 | 7 |
| Finale | The Cindergate 5,1 → Mount Cindermaw 5,0 | 8 |

*Pros:* it matches today's `world.json` almost one to one, so it costs the least. It is the model most proven with new
players. *Weakness:* the hero goes back to Quill again and again ("return to Quill" happens 9 times). *Fix:* pass the giver
role along, from Quill to Brakka (north) to Zafira (east), as the data already partly does. Also make the return trips carry
a revelation each time.

### Structure B: Three-act forge quest (Volsunga saga + hero's journey + Zelda's "parts, then the blade, then the world turns")

The acts follow the map. Act I is the near west and south (danger 0–6), Act II the north (ice and mountain, 3–8), Act III the
east (desert and fire, 5–10).

| Beat | Zone(s) | Chapter |
|---|---|---|
| Ordinary world + call to adventure (the bell) | Brindlemere, Thornwood | 1 |
| Threshold + mentor | Highmarrow (Quill) | 2 |
| Tests and allies | Gallows Heath, Saltmere, Wrecker's Coast | 2–3 |
| **Midpoint**: the truth (Vharaxis; the blade is broken) | Drowned Shrine | 4 |
| Part 1: star-iron | Stonejaw Pass | 5 |
| Part 2: true cold | Rimewater Glacier | 6 |
| Part 3: the key | Sepulchre of Sand | 7 |
| **All Is Lost** ("the song was sung too long") | Sunspire Oasis | 7 |
| Ordeal + finale | Cindergate, Cindermaw | 8 |
| Return with the elixir | Brindlemere | 8 |

*Pros:* a clear sense of progress (three parts, then the gate) and strong mythic roots that are public domain. *Weakness:*
the story is about objects, so the villain can fade into the background between the midpoint and the end.

### Structure C: A front-driven web (Dungeon World fronts + Alexandrian nodes + Icespire tiers)

The Choir is a **front** with 5 grim portents. The side quests act as **nodes**, each holding a clue that points to a
main-chain place. Side quests open in **tiers** by region.

| Element | Where |
|---|---|
| Front: "The Ashen Choir", impulse *to wake the king and darken the sky*, doom *Destruction* | Whole map |
| Portents 1–5 | Bell under Thornwood (ch1) → ash on the north fields (ch2) → ash in the flour, Larkspur (ch4) → the forge burns red without coal, Karn Doruhl (ch5–6) → ash falls on Brindlemere's pond (ch8) |
| Tier 1 sides (danger ≤ 3): near home | Rats in the Kettle, Missing Shepherd, Greymaw, Dark Lighthouse, Goblin Toll |
| Tier 2 sides (4–6) | Barrow King, A Drop of Venom, Troll Bridge |
| Tier 3 sides (7+) | Stone Garden, Sun-King's Rest, Giant's Ransom, the Last Knight |
| Stakes questions | Will Brindlemere still stand? Will the Last Warden's gate hold? Will Thornreach be avenged? |

*Pros:* the world feels alive, and an open map that wants exploring is rewarded. *Constraint:* the brief makes main quests
unlock strictly in order (req 30), so the node web can live only in the side quests and quest pages. **C works as an
overlay, not as the backbone.**

### The recommendation

**Use A as the skeleton, B to group it into three acts, and C as the overlay.** That gives: hub and spokes with the villain in
stages, in three acts by region, with the Choir advancing as a front, three clues behind the twist, and every side quest
tied back to the main arc. It is the cheapest change to the data (most steps stay) and it uses every proven lesson above.

---

## 3. The recommended original outline: "The Cinder King"

**Premise (own words).** Three hundred years ago Vharaxis burnt Thornreach in one night. Someone opened its gates from inside.
The dwarves' star-iron blade, Winter's Tooth, drove him under Mount Cindermaw and broke doing it, and the Cindergate was built
to keep him **in**. Now the Ashen Choir sings to wake him. They think they are calling a god. The hand behind them is older:
**Countess Velda Mournshade, the Pale Lady**, the traitor who opened Thornreach's gates. A vampire cannot walk under the sun,
and a sky choked with the dragon's ash would let her walk by day forever. She does not want a king. She wants **the night**.

**Villain in stages.** Gravecaller (ch1) → Garrick Redcap, paid by "the Choir" (ch2) → the Choir's black sloop and stolen
moon-sigil (ch3) → the Moon Stone: they want *Vharaxis*, and a breathless second voice asked *when the sky will go dark* (ch4)
→ High Cantor Sereth Vane (ch7) → **twist: the altar is bare; the Pale Lady has the key** (ch7) → Vharaxis (ch8).

**Twist.** The High Cantor is not the head of the Choir. He was only its voice. The Cinder Key is already gone, taken by the
Countess who betrayed Thornreach three centuries ago, and her motive is the ash itself. It is a fair-play twist with five
clues planted earlier (see the clue table). A second turn comes in ch8: **the hero must open the gate that holds the dragon**
(the Le Guin lesson), because the song has done its work and the gate will fail within days anyway.

**Ending (eucatastrophe + there and back again).** The dragon falls to the weak point the story set up, winter against fire.
The ash stops and the sky clears, which is the Countess's defeat confirmed for good. The hero walks home. The Gravecaller's
bell, the one that started it all, now hangs in Brother Tobin's chapel and rings for the living.

### Acts and chapters (8 main quests, as the brief requires; chapter 1 unchanged)

Five-Room beats per chapter in brackets: **E**ntrance/guardian, **P**uzzle/talk, **S**etback, **C**limax, **R**eward/revelation.
"(new)" marks a step that is not in today's data. "(text)" marks an existing step whose `pages` change.

#### ACT I: THE BELL (near home, danger 0–3)

**Ch1 The Restless Crypt** (Brindlemere, Thornwood, Hollow Crypt). **Unchanged** (round-3 contract, `quest.stage` 0–6).
Strong start: a bell tolls under the graveyard. Portent 1.
People: Elder Maren (giver), Brother Tobin (gravekeeper), Hale (helper). Foe: `cult-fanatic` as the Gravecaller.

**Ch2 The Bell's Maker** (Brindlemere → Highmarrow → Gallows Heath → Highmarrow)
1. talk `elder-maren`: the ash-ring mark. [E]
2. talk `ilsabet-quill`: names the Ashen Choir and sends you to the Redcaps. [P]
3. (new) talk `gibbet-jack` (Gallows Heath, lore): "Garrick keeps his ledger in his coat. Hooded ones pay him." [P]
4. defeat `bandit-captain` as Garrick Redcap. Gives the Ashen Ledger. [C]
5. (text) talk `ilsabet-quill`: "Paid in **pale silver**, old Thornreach coin. Cargo by sea." **Clue 1 to the Countess.**
   Portent 2 (Wick: ash on the north fields). [R]

**Ch3 Salt and Shadow** (Highmarrow → Saltmere → Wrecker's Coast → Highmarrow)
1. talk `ilsabet-quill`. [E]
2. talk `dunmore-pell`: a black sloop with a hooded crew. The Gullcry lamp went dark that same night. [P]
3. (new) talk `wrecker-lass` (Tilly Wrack): "Its crew wore hoods. The hag took the crates." [P]
4. defeat `sea-hag` as Old Mother Brine. [S/C]
5. fetch the sealed crate. Gives the Ashen Sigil. [C]
6. talk `ilsabet-quill`: "A moon, scratched out. Pried from the Moon Shrine." [R]

#### ACT II: THE BLADE (south-west, then north, danger 4–8)

**Ch4 The Drowned Shrine: MIDPOINT** (Highmarrow → Willowfen → Drowned Shrine → Highmarrow)
1. talk `ilsabet-quill`. [E]
2. talk `speaker-sszath`: the marsh folk and Mirefang. [P]
3. (new) talk `drowned-acolyte` (Acolyte Miren): "The Choir asked one question. Another asked a second." [P]
4. defeat `black-dragon-wyrmling` as Mirefang. [C]
5. (text) fetch the Moon Stone: "He sleeps under Cindermaw. The song will wake him." plus a new page: "A colder voice, with no
   breath, asked: *when will the sky go dark?*" **Clue 2.** [R]
6. (text) talk `ilsabet-quill`: Vharaxis. Fire cannot hurt him. Winter's Tooth did, and it is broken. *False defeat:
   the only weapon is gone.* Portent 3 (Joss: ash in the flour).

**Ch5 The Dwarven Road** (Highmarrow → Karn Doruhl → Stonejaw Pass → Karn Doruhl)
1. talk `ilsabet-quill`. Gives the Letter of Passage. [E]
2. talk `brakka-ironvein`: needs star-iron. [P]
3. defeat `ettin` as Grum-and-Gorl. [C]
4. fetch the star-iron vein. Gives the Star-iron Ingot. [R]
5. (text) talk `brakka-ironvein`: "Star-iron! … Mind you, my forge burns red without coal these days. He stirs." Portent 4.

**Ch6 Winter's Tooth** (Karn Doruhl → Frostfang Shore → Rimewater Glacier → Karn Doruhl)
1. talk `brakka-ironvein`. Gives the Unquenched Blade. [E]
2. talk `sigrun-frostmane`. [P]
3. defeat `young-white-dragon` as Hoarfang. Gives the Heart of Rime. [C]
4. talk `brakka-ironvein`: "Winter's Tooth bites again." Reward `frost-brand` = Winter's Tooth. [R]
   (The Volsunga beat: the shards welded again. Brakka's line hints at the Kāveh beat: a smith arms the land.)

#### ACT III: THE GATE (east, danger 5–10)

**Ch7 The Ashen Choir: TWIST** (Highmarrow → Sunspire Oasis → Sepulchre → Thornreach Ruins → Fallen Star Crater → Sunspire)
1. talk `ilsabet-quill`: "We strike first." [E]
2. talk `zafira`: the High Cantor wears the Cinder Key on a chain. [P]
3. (new) talk `tomb-guide-seti`: "The singing never stops. They bow to someone who never comes by day." **Clue 4.** [P]
4. defeat `mage` as High Cantor Sereth Vane. [C]
5. (text) fetch the Choir's altar. **No key now**: "The altar is bare. A note in a pale hand: *Bring it to me, Sereth.
   You are late. — V.*" [S]. **The reveal.**
6. (new) talk `ser-aldric-thorne`: "V. Velda. She opened our gates the night of the fire. She lives in the crater still."
   **Clue 5 / the turn.**
7. (new) defeat `vampire` as Countess Velda Mournshade at `fallen-star-crater`. Gives the `cinder-key`. [C]
8. (text) talk `zafira`: "You have it! But the song was sung too long. Ash is falling in the north." **All Is Lost.**

**Ch8 The Cinder King: FINALE** (Sunspire → Cindergate → Mount Cindermaw → Brindlemere)
1. talk `zafira`: "North, through the badlands." [E]
2. (new) talk `watcher-at-the-gate` (the Last Warden): "We built it to hold him IN. Open it, and you must finish him."
   The Le Guin beat. [P]
3. open the Cindergate with the `cinder-key`. [S]
4. defeat `adult-red-dragon` as Vharaxis, the Cinder King: "A blade of winter. I remember that sting." [C]
5. (text) talk `elder-maren`: the ash has stopped and the sky is blue. The bell now hangs in Tobin's chapel and rings for the
   living. **Eucatastrophe + homecoming.** [R]

**Count.** 8 main quests, 45 steps. 7 of them are new; the rest are today's steps, some with new text. The dragon is still the
final `defeat` and Elder Maren the final `talk`, so `won` and the ending work as now.

### Beat map: the 10 story beats players will remember

| # | Beat | Chapter / zone | Template |
|---|---|---|---|
| 1 | A bell tolls under the village grave | 1 · Thornwood | Strong start |
| 2 | "The Ashen Choir" is named | 2 · Highmarrow | Villain stage 2 |
| 3 | Pale silver in a bandit's ledger | 2 · Gallows Heath | Clue 1 |
| 4 | A black sloop, a stolen moon | 3 · Wrecker's Coast | Villain stage 3 |
| 5 | "He sleeps under Cindermaw", and a breathless voice | 4 · Drowned Shrine | **Midpoint** |
| 6 | The blade is broken / reforged | 5–6 · Karn Doruhl | Volsunga |
| 7 | The High Cantor falls, and the altar is bare | 7 · Sepulchre | False final boss |
| 8 | The Pale Lady of the crater | 7 · Fallen Star Crater | **Twist** |
| 9 | The hero opens the gate himself | 8 · Cindergate | All Is Lost / Le Guin |
| 10 | Winter beats fire; the bell rings for the living | 8 · Cindermaw → Brindlemere | Eucatastrophe, bookend |

### The twist's clues (Three Clue Rule: five clues, and three would be enough)

| Clue | Where | Already in data? |
|---|---|---|
| "A pale lady came to court the night before the fire." | Ser Aldric's idle line, Thornreach Ruins | Yes |
| The Countess keeps her shutters shut by day; ash suits her. | Mirelle Starwatch's idle line, Fallen Star Crater | Reword the existing line |
| Paid in pale silver, old Thornreach coin. | Ch2 ledger (Quill's pages) | New text |
| A breathless voice asked when the sky will go dark. | Ch4 Moon Stone | New page |
| "They bow to someone who never comes by day." / "The Cantor sings. Someone else writes the song." | Ch7 Old Seti; Corin Ashwalker's idle line | New step; reword one line |

### Side quests tied to the main arc (8 of the 12)

| Side quest | Giver · zone | Tie to the main arc | Change |
|---|---|---|---|
| **Rats in the Kettle** | Pella · Brindlemere | The rat nested in a crate stamped with the **ash-ring**: the Choir already had a foot in the home village (the Hommlet lesson). | Text in the last `talk` |
| **The Dark Lighthouse** | Old Corwin · Gullcry Cliffs | The lamp went dark the night the black sloop came in. With the lens back, "no hooded ship lands unseen again". Points to ch3. | Text |
| **Greymaw** | Greta Fenn · Pinewatch | The pack came south because "the north smells of smoke". Portent. Greta's reply to her sister Mabel ties two people together. | Text |
| **The Goblin Toll** | Bram Tolliver · Highmarrow | Chief Krug was paid in pale silver to close the dwarves' road. Points to ch5 and is a clue to the twist. | Text |
| **The Barrow King** | Sister Averil · Oldking Barrows | The seventh king rose **the night the Gravecaller's bell first rang** (Grettis saga barrow-dweller). Ties back to ch1. | Text |
| **A Drop of Venom** | Hakim Nour · Sunspire Oasis | "Choir pilgrims buy my cures and walk east. They never come back." Points to ch7. | Text |
| **The Giant's Ransom** | Durgan Kettlehelm · Karn Doruhl | Jarl Skaldi raids because Hoarfang drives the giants off the ice. Sets up ch6. | Text |
| **The Last Knight** (was *The Pale Lady*) | Ser Aldric · Thornreach Ruins | The Countess is now the ch7 boss, so Aldric's quest becomes the build-up to her: "The throne room holds my order's last oath-chest; a dead guard keeps it." | **Steps change** (below) |

The other four (Missing Shepherd, Stone Garden, Troll Bridge, Sun-King's Rest) stay as optional adventures. They are local
legends that give a broader world (the Icespire job-board lesson: side quests are XP toward the main path).

### Sample dialogue (the game's style: short sentences, 2–3 lines per box; each bullet is one `pages` entry)

Ch2, step 5, Ilsabet Quill:
- "Payments every month. Cargo by sea."
- "And look at the coin. Pale silver, Thornreach mint. Nobody has struck that in three hundred years."

Ch4, step 5, the Moon Stone:
- "Words rise in the stone: 'He sleeps under Cindermaw. The song will wake him.'"
- "Fainter words below: a second voice, with no breath. 'When will the sky go dark?'"

Ch5, step 5, Brakka Ironvein:
- "Star-iron! I have waited my whole life to work this."
- "Mind, my forge burns red without coal these days. Something under the mountain is breathing."

Ch7, step 5, the Choir's altar:
- "The altar is bare. Under a black candle lies a note."
- "'Bring it to me, Sereth. You are late. - V.'"

Ch7, step 6, Ser Aldric Thorne:
- "V. Velda Mournshade. She smiled at our king and opened our gates to the fire."
- "Three hundred years, and she still wants the sky dark. The crater. South-east."

Ch7, the Countess (step 7 has no pages; put these on the `defeat`'s `pages` or the win message):
- "Such a long walk in the sun, little hero."
- "One more song and I would never need to hide again."

Ch8, step 2, the Last Warden:
- "We built the gate to hold him IN. We held. We hold."
- "Open it, and you must finish him. Bring winter."

Ch8, step 5, Elder Maren:
- "Look up. The ash has stopped. The sky is blue."
- "Tobin hung the old bell in the chapel. Tonight it rings for the living."
- "Brindlemere will sing of you for three hundred years more."

### Balance notes (to check, not decided here)

- Ch7 now has two bosses, `mage` (CR 6) and `vampire` (CR 13), before the `adult-red-dragon` (CR 17). If the vampire is
  too hard at the level reached by then, field her with `vampire-spawn` (CR 5) and keep the name. Story first, numbers
  second.
- The *Curse of Strahd* warning: rewards that level the hero every chapter can make the final boss easy. The existing main
  XP (300 → 5000) plus the side XP (up to 10000) should be checked against the level-5 cap in `rules.json`.

---

## 4. What would have to change in `world.json` (a list, not edits)

**quests.main**
1. `the-restless-crypt`: **no change.**
2. `the-bells-maker`: add a `talk` step to `gibbet-jack` before the `defeat`. Rewrite the last step's `pages` (pale silver,
   Thornreach coin).
3. `salt-and-shadow`: add a `talk` step to `wrecker-lass` before the `defeat`. Add the dark-lamp line to the `dunmore-pell`
   pages.
4. `the-drowned-shrine`: add a `talk` step to `drowned-acolyte` before the `defeat`. Add the "breathless voice" page to the
   Moon Stone `fetch`. Make the last Quill pages say the blade is broken (the false defeat).
5. `the-dwarven-road`: add the forge-burns-red portent page to the last `brakka-ironvein` step.
6. `winters-tooth`: no step change. Optionally add a smith's line to the last page.
7. `the-ashen-choir`: add a `talk` to `tomb-guide-seti` before the `defeat`. Change the altar `fetch` so it gives no
   `cinder-key` and shows the pale-hand note instead (it could give a new `pale-note` quest item, or nothing). Add a `talk`
   to `ser-aldric-thorne`. Add a `defeat` of `vampire` as "Countess Velda Mournshade" at `fallen-star-crater` that
   `gives: ["cinder-key"]`. Keep the final `talk` to `zafira`.
8. `the-cinder-king`: add a `talk` to `watcher-at-the-gate` before the `open`. Rewrite the last `elder-maren` pages (sky
   clears, bell in the chapel).

**quests.side**
9. `the-pale-lady` → rework as **"The Last Knight"** (same giver). Steps: `talk ser-aldric-thorne` → `defeat animated-armor`
   as "the Faithless Guard" at `thornreach-ruins` → `fetch` "the oath-chest" (`thornreach-ruins`, sprite `d:89`) → `talk
   ser-aldric-thorne`. Keep the reward ids (`belt-of-giant-strength-hill`, `potion-of-healing-supreme`). Lower the XP to suit
   a tier-3 side quest. The id may stay, so nothing else that points at it breaks.
10. Rewrite `pages` (text only, no step changes) for `cellar-rats`, `the-dark-lighthouse`, `greymaw`, `goblin-toll`,
    `the-barrow-king`, `scorpion-venom` and `giants-ransom`, as in the side-quest table.

**npcs (`lines` only; no new people, still 52)**
11. `crater-astrologer` (Mirelle Starwatch): replace "The Countess invites guests to dinner. Decline." with an original line,
    e.g. "The Countess keeps her shutters shut by day. She says the ash suits her." This removes a close echo of a published
    villain's signature scene and plants a clue.
12. `ashwalker-corin`: replace or add a line, "The Cantor sings. Someone else writes the song."
13. Optional: `town-crier-wick` and `miller-joss` already carry portents. Leave them.

**quest_items**
14. Optional: add `pale-note` ("A note in a pale, old-fashioned hand, signed V.") if the altar step should give something.
    Otherwise none.

**meta**
15. `story`: optionally add a fourth sentence: "Someone opened Thornreach's gates that night. No one ever learned who." This
    plants the twist in the intro and the Credits page. The `goal` stays the same.

**Not changed:** zones, biomes, sites, monsters, items, the number of main quests (8), chapter 1, the final `defeat` and the
final `talk`. Note that the R4 grader runs on its own copy of the data. These edits are for the operator's finished game,
and they keep the same data shape, so an R4-compatible engine still runs them.

---

## 5. IP status of every borrowed element in the recommended outline

| Element in our story | Borrowed from | Status |
|---|---|---|
| Hub town + escalating spokes + villain in layers | Hommlet, Keep on the Borderlands, Phandelver (structure) | Structure only. Not protectable. Lesson in our words. |
| Side quests in tiers that count toward levels | Dragon of Icespire Peak (structure) | Structure only. |
| Five-beat chapter arcs | Five-Room Dungeon (Johnn Four) | Free technique. |
| Three-plus clues for the twist; side quests as nodes | The Alexandrian (technique) | Free technique, own words. |
| Strong start; secrets as one-liners | Lazy GM (Sly Flourish), *Lazy GM's Resource Document* CC-BY 4.0 | Technique only. No text copied, so no credit owed (credit it if quoted). |
| The Choir as a front with 5 portents | *Dungeon World*, CC-BY 3.0 | Idea only. No text copied (credit it if quoted). |
| Midpoint, All Is Lost, eucatastrophe | Save the Cat; Tolkien's essay | Generic structure / a concept, described in our words. |
| False final boss → hidden master | JRPG convention | Common trope. |
| A broken ancestral blade welded again to slay a dragon | Volsunga saga | Public domain. |
| A small act (a bell) wakes a dragon; escalation in threes | Beowulf | Public domain. |
| Barrow King guarding his circlet | Grettis saga (Kárr the Old) | Public domain. |
| Tyrant sealed under a mountain; the smith who arms the land | Shahnameh (Zahhāk, Kāveh) | Public domain (original). Warner translation PD in the US. |
| Fire-giant guards, ash as the end of the world | Prose Edda (Surtr, Muspelheim) | Public domain. |
| The Pale Lady (vampire countess) | Carmilla (1872); "blood countess" legend | Public domain. Our name, motive (the ash-darkened sky) and story are original. |
| A sleeping king under the mountain, inverted | King-in-the-mountain folklore | Public domain. |
| Redcap bandits | Border folklore | Public domain. |
| The hero's own act lets the danger out | Le Guin (lesson) | Lesson only. No content. |
| A cult that thinks it controls the dragon | Pratchett and others (common trope) | Generic trope. No content. |
| Every monster and item reward | SRD 5.1 | CC-BY 4.0. Credit already in `data/srd/ATTRIBUTION.md`. |
| All names (Aldermoor, Vharaxis, Velda Mournshade, Sereth Vane, Brindlemere …), every line of dialogue, the twist and its motive | Original to this project | Ours. |

Two risks to fix:

- Mirelle's "invites guests to dinner" line echoes a published villain's best-known scene. Item 11 rewrites it.
- "Redcaps": a road gang paid by a hidden villain is a common pattern. The name is folklore, so this is low risk, but avoid
  red cloaks plus a hideout under a manor, which would read as a copy.

## Sources consulted

- Phandalin as a hub: D&D Beyond, "Visit Phandalin" (https://www.dndbeyond.com/posts/1515-visit-phandalin-d-ds-most-popular-starter-town); Roll20 new-DM series (https://pages.roll20.net/dnd/lost-mine-phandelver-new-dm)
- Hommlet / Borderlands: Grognardia retrospective (https://grognardia.blogspot.com/2009/11/retrospective-secret-of-bone-hill.html); Black Gate on T1 (https://www.blackgate.com/2016/11/29/modular-a-brand-new-column-and-about-t1-the-village-of-hommlet/); Dragon Peak Publishing (https://buttondown.com/DragonPeakPublishing/archive/the-village-has-a-problem)
- Icespire job board: Goodreads/Sly Flourish "DMing Dragon of Icespire Peak" (https://www.goodreads.com/author_blog_posts/24254181-dming-dragon-of-icespire-peak---part-3)
- Curse of Strahd structure: Roll20 tips (https://pages.roll20.net/dnd/curse-of-strahd-tips-new-dm); Ravenloft wiki (https://ravenloft.fandom.com/wiki/Curse_of_Strahd)
- Five-Room Dungeon: Bestiarum Games (https://bestiarumgames.com/blogs/news/better-ttrpg-dungeon-design-with-five-room-dungeon); Burn After Running, 5-room non-dungeon (https://burnafterrunningrpg.com/2021/05/17/prep-techniques-the-5-room-non-dungeon/)
- Three Clue Rule / nodes: The Alexandrian (https://thealexandrian.net/?p=7985, read); Node-based design (https://thealexandrian.net/wordpress/8122/roleplaying-games/node-based-scenario-design-collectors-edition)
- Lazy GM: Sly Flourish, Lazy GM's Resource Document, CC-BY 4.0 (https://slyflourish.com/lazy_gm_resource_document.html, read); eight steps (https://slyflourish.com/eight_steps_2023.html)
- Fronts: Dungeon World on Roll20 (https://roll20.net/compendium/dw/Fronts, read); licence (https://roll20.net/compendium/dw/License); Sly Flourish, fronts in D&D (https://slyflourish.com/fronts_in_dnd.html)
- Save the Cat and games: https://savethecat.com/about-the-beats/an-interactive-arrangement-the-strengths-and-weaknesses-of-video-game-storytelling
- Dragon Quest gating: Automaton (https://automaton-media.com/en/column/not-so-obvious-things-that-make-games-fun-vol-1-breath-of-the-wild-and-dragon-quest-is-masterful-use-of-gating/); RPGamer (https://rpgamer.com/2020/05/jrpg-study-time-dragon-quest-i-provides-immersion-through-simplicity/)
- Zelda ALttP: Game Developer, "Overworld overload" (https://www.gamedeveloper.com/disciplines/overworld-overload-an-analysis-of-link-to-the-past-s-light-world-part-2)
- Volsunga saga, Morris and Magnússon: Project Gutenberg #1152 (https://gutenberg.org/files/1152/1152-h/1152-h.htm); ch. XV (https://www.marxists.org/archive/morris/works/1870/volsungs/chapters/chapter15.htm)
- Beowulf structure: SparkNotes (https://www.sparknotes.com/lit/beowulf/mini-essays/); Interesting Literature (https://interestingliterature.com/2015/01/what-happens-in-beowulf-an-interesting-summary/)
- Grettis saga: Wikipedia (https://www.wikipedia.org/wiki/Grettis_saga); text, Project Gutenberg #347 (https://gutenberg.org/ebooks/347)
- Shahnameh, Zahhāk and Kāveh: Wikipedia (https://www.Wikipedia.org/wiki/Zahak); Kaveh (https://godsandmonsters.info/kaveh-the-blacksmith/)
- Surtr: Wikipedia (https://en.wikipedia.org/wiki/Surtr)
- Eucatastrophe: Tolkien Gateway (https://tolkiengateway.net/wiki/Eucatastrophe)
- Guards! Guards!: Wikipedia (https://wikipedia.com/wiki/Guards!_Guards!)

Method note: three sources were read in full: the Three Clue Rule, the Lazy GM document and the Fronts page. The other
claims rest on search results and summaries of well-known works. The US public-domain status of the old translations (Warner
1905–25, Brodeur 1916) comes from publication dates before 1929, not from a checked register.
