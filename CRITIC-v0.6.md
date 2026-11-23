# The Cinder King (v0.6): a critic's play-through

Build played: `bench/coding-semi/runs/R4F3/qwen3635ba3b/work/`, served from a copy and played in headless Chromium at 800x720 (internal resolution 256x192). Screenshots are in `review/critic-v0.6/`. File names below refer to that folder.

## How I played, and where I used the debug hooks

- **By hand, with real key presses:** title, Brindlemere (every NPC, the shop, the fishing pond, the three "lost treasures", the one interior), Thornwood, the side quest "Rats in the Kettle", 13 battles (3 of them lost), the cemetery, the chest, the crypt, and the chapter 1 boss. I finished chapter 1. I also walked to Highmarrow, Gallows Heath, Thornreach Ruins and Glasswind Dunes, saved, reloaded and loaded.
- **Debug hooks (`window.__game`), used only where I could not get further in reasonable time:**
  - `grantXp(170)` once, to get from 125 XP to just under level 2. That came after about 20 minutes of 10-XP town fights and two defeats. The level-up itself came from a real fight.
  - `setEncounters(false)` while crossing zones after Gallows Heath.
  - `travel()` to look at Frostfang Shore, Mount Cindermaw, Blackmire and Karn Doruhl.
  - For chapters 2 to 8, `travel()` to each quest step and `winBattle()` for every boss, after I had tried the chapter 2 boss honestly, run away once and lost once. All dialogue in those chapters was still advanced by pressing A, and I read all of it, including the ending.
- I read the game's own JavaScript only to drive it, and to confirm two behaviours I could not trigger by hand: the touch zones and when the ending card appears. I did not read any reviews, plans, feedback, tests or design notes.
- **Audio was muted** (headless Chromium). Sound and music are not judged here.

## Verdict

The Cinder King has a real writer's voice and almost none of the systems that let an RPG work. Its lines are short, specific and often funny ("Something the size of a dog is in my cellar. It ate a ham."). Its eight-chapter plot builds a clean mystery: a ring of ash stamped on a crate, a three-hundred-year-old silver coin, a voice that "has no breath". That puts it closer to Dragon Quest's terseness and EarthBound's wit than most hobby RPGs get. Around that script, the machinery is broken.

- Gear you buy or earn **cannot be equipped**. My hero wore the same leather armour (AC 11) from level 1 to level 8, with a Breastplate, Red Dragon Scale Mail and the legendary Winter's Tooth sitting unused in the bag.
- The Potion of Healing **cannot be drunk**.
- Fights pay **no gold**.
- The bosses climb from 22 HP to 256 HP, AC 19, +14 to hit, against a hero whose attack bonus moves from +2 to +3. Past chapter 1 the game cannot be won without the debug hooks.

The surface has its own problems. Trees render as empty outlines, the boss markers are a sliver, an opaque square and a door, the battle portraits are often colour noise, and the hero has no walk cycle or facing. The item list overflows its panel.

Someone can see the shape of a good handheld RPG here, especially in the writing and the dice-transparent battles. As shipped, it is a well-written chapter 1 followed by a wall.

## Scores

| | Score | Why, against the genre |
|---|---|---|
| **Content** | **4 / 10** | The writing is above the genre's hobby average and the main plot holds together. But the quests follow one template seven times, the world is 36 mostly empty generated zones, combat is Attack / Run, the economy and progression do not function, and the ending drops the real villain. Dragon Quest I is thinner on story, but its gold → gear → level loop works from the first slime. |
| **Visuals** | **4 / 10** | A clean 16 px tile base, a good dialogue box, a pleasant cemetery and striking title art. Against that: hollow trees, broken boss markers, noisy portraits, no character animation, a status strip that eats 25 % of the screen, and truncated or overflowing text in the item list, the shop and the final battle. Link's Awakening's sprites say more with 4 colours than these do with 20. |
| **Feel** | **4 / 10** | Grid movement is quick and crisp, menus are instant, you can save anywhere, and defeat is gentle. But battles resolve in a single frame with no hit feedback, pickups and purchases are silent, Start on the title drops you into the pause menu, there is no Continue, and the Items menu has no cursor. Pokémon Red's battles have far less going on mechanically, yet every hit lands with a flash, a shake and a pause. |
| **Overall** | **3.5 / 10** | A player gets a charming 30 to 45 minutes. Then they hit a boss they cannot beat with gear they cannot equip, and the game gives them no lever to change that. The script deserves better systems. |

## Good

1. **The writing is the best thing here.** NPC lines are one or two sentences, concrete and characterful (`05-dialogue-pella.png`). The plot plants and pays off clues across chapters:
   - the rat's crate is "stamped with a ring of ash", which becomes the cult's mark;
   - the bandit ledger's coin is "Thornreach mint. Nobody has struck that in three hundred years";
   - the Moon Stone carries a second voice "with no breath" asking "When will the sky go dark?", which is later revealed as the vampire countess who wants the dragon's ash cloud "dark enough to walk under".

   This is Dragon Quest economy with a dash of Mother/EarthBound humour ("Do not sing back"). Most pixel-RPG scripts are either generic fantasy or overwritten. This one is neither.
2. **The battles show their dice.** Each round shows your d20 and damage die and the foe's, with the sum ("You roll 14+2=16 HIT"; `17-battle-goblin-hits-7.png`). For a game built on D&D 5e numbers, this is a distinctive idea: you can see *why* you missed. Golden Sun and Pokémon hide their maths. Here the maths is the spectacle, and it suits the tabletop heritage.
3. **Defeat is a story beat, not a reset.** Losing shows a dark veil ("Your knees give way. The world goes dark."), then a local character carries you to a town for a small fee, or thieves take some coin and items (`30-defeat-veil.png`, `31-defeat-rescue.png`). It is kinder and more characterful than Pokémon's "blacked out" warp, and it keeps a beginner playing.
4. **A clean base tile set and a readable dialogue box.** The early areas (Brindlemere, Thornwood, the cemetery) use a consistent 16 px tile set with dark outlines. The dialogue font is large and legible and the box has a proper ▼ prompt (`24-cemetery.png`, `05-dialogue-pella.png`). The cemetery's iron fence, rows of headstones, stepping-stone path and crypt mouth form the one real set-piece landmark in the game.
5. **Movement and menus respond immediately.** Holding a direction moves about 7 tiles a second with no input lag, faster than Pokémon's walk. Menus open in a frame. You can save anywhere from the menu ("Game saved.", `29-save-anywhere.png`), which is right for a browser game played in short sessions.
6. **The title art is striking.** A painted volcano, a sleeping red dragon and a watcher on a tower (`01-title-hud-bleed.png`). It sets a mood the game's own art never reaches.
7. **The biomes read at a glance.** Desert (ripples and cacti), volcano (lava and basalt) and swamp (murky pools) each have their own palette (`36-glasswind-dunes.png`, `38-mount-cindermaw.png`, `39-blackmire.png`). From a distance, the 6x6 world map shows the colour bands of a varied continent (`45-world-map.png`).
8. **The main quest always says where to go next.** The quest log and NPCs name the next place ("Find Brother Tobin at the cemetery, east through the gate"). There is no Dragon Quest II-style wandering in search of the one NPC who matters.

## Bad (broken: these stop or mislead a player)

1. **Equipment cannot be changed.**
   - The Party screen does not even list weapon or armour (`11-party-no-equipment.png`).
   - The Dagger I bought never replaced my rapier. The Oak Shield I found, and the quest rewards (Chain Shirt, Breastplate, Cloak and Ring of Protection, Red Dragon Scale Mail, Frost Brand), pile up in the bag.
   - At level 5 the hero still has AC 11 (`43-party-lv5-ac11.png`, `42-items-gear-unusable.png`).
   - The story's climax is forging the legendary Winter's Tooth. The player never wields it.

   Every genre reference turns new gear into visible numbers. In Dragon Quest the shop even shows ↑↓ arrows as you browse. Without this there is no reason to shop, loot or do side quests.
2. **Most consumables cannot be used.**
   - Start in battle drinks only a "Healing Draught", of which the game hands out three.
   - The Potion of Healing (the shop's 50 gp item and a common quest reward) cannot be drunk in battle. The "START: Heal" hint vanishes when you only hold Potions of Healing. In the chapter 1 boss fight, I pressed Start repeatedly at 2 HP with a Potion of Healing in the bag and nothing happened.
   - In the menu, A on Items always answers "No Healing Draught in the bag." even with three Potions of Healing listed (`41-hud-text-dropout.png`).
   - The Moonpetal Potion, Brass Key and Oak Shield from the "three lost treasures" do nothing.
3. **The difficulty curve cannot be beaten.**

   | Fight | Level | What happened |
   |---|---|---|
   | First Thornwood goblin | 1 | Hit me for 7 of my 8 HP in one round (`17-battle-goblin-hits-7.png`). |
   | Brindlemere's tall grass | 1 | Mixes 1 HP bats with an 18 HP Giant Frog that killed me (`19-battle-giant-frog-town.png`). |
   | Chapter 1 boss | 2 | 22 HP. I won with 2 HP left. |
   | Chapter 2 boss | 3 | 65 HP, AC 15, +5 to hit (`34-garrick-65hp.png`). |
   | Later bosses | – | 85, 133 and 256 HP. The final dragon has AC 19, +14 to hit and 2d10+8 damage (`47-final-boss-truncated.png`). |

   Against that, the hero gains 8 HP per level, goes from +2 to +3 to hit by level 5, and stays at AC 11 because of Bad 1. A fight the player cannot win by grinding or shopping is a dead end. Dragon Quest I is grindy, but grinding always works there.
4. **The economy does not function.**
   - Monsters drop no gold. My gold stayed at 25 across a Cultist fight and at 10 across three bats.
   - Prices come straight from the D&D source tables: a Torch is 0.01 gp, a Club 0.1 gp, a Potion of Healing 50 gp against 15 gp starting money (`10-shop-srd-prices-truncation.png`).
   - Purchases give no confirmation.
   - There is no inn. Dying, at a 2 gp fee, is the cheapest full heal.
   - By the end I held 6,353 gp with nothing to spend it on.
5. **The Items screen is broken** (`12-items-list-broken.png`, `42-items-gear-unusable.png`).
   - Each item prints twice ("Dagger / A: Dagger"), and long names wrap into a third line.
   - Icons sit one row off from their items: the bell gets a potion icon.
   - The list runs off the bottom of the panel with no scroll mark.
   - There is no cursor inside the list, so Down moves the main menu instead.
6. **Text does not fit the boxes it is given.**
   - Shop: "Rope, hempen (50 feet 1 gp" (`10-...`).
   - Items: "Gravecaller's Bel", "Cloak of Protecti".
   - Final battle: the boss name shows as "Vharaxis, the Ci" and the opening line as "...the Cinder King atta" (`47-final-boss-truncated.png`).
   - Dialogue pages split mid-sentence and leave one word alone in a box ("year.", `06-orphan-page.png`).
   - Names starting with "the" stay lower case at the start of a sentence ("the Ham Thief attacks!", `21-ham-thief-lowercase.png`).
   - The status strip text loses pixels whenever the menu is open ("H:llow Cr:ypt", `z-zoom-hud.png`, `41-hud-text-dropout.png`).
   - The font substitutes a narrow "ﬁ" ligature in "finds" (`31-defeat-rescue.png`).
7. **Sprite and tile bugs.**
   - Conifers are drawn with a fill the same green as the grass, so they read as empty outlines. Highmarrow becomes a forest of hollow shapes (`15-highmarrow-hollow-trees.png`, `z-zoom-hollow.png`).
   - Quest foes on the map are wrong:
     - the "Ham Thief" is a narrow grey sliver (`20-quest-foe-sliver-sprite.png`, `z-zoom-rat.png`);
     - the Gravecaller is an opaque pink square that disappears into the red crypt floor (`26-boss-sprite-on-red-floor.png`, `z-zoom-boss.png`);
     - Garrick Redcap, bandit captain, is a small wooden door (`33-garrick-is-a-door.png`).
8. **There is no character animation and no feedback in battle.**
   - Characters have one front-facing frame. The hero faces the camera while walking left or while talking to someone beside them (`z-walk-frames.png`; in `24-cemetery.png` the hero faces the camera while Brother Tobin stands to their right).
   - A battle round resolves in a single frame: no hit flash, no shake, no damage number, no pause between your swing and the foe's. HP bars jump.
   - A beaten foe stays on screen at 0 HP, and the victory box covers half the dice row (`22-victory-box-overlap.png`).

   The genre references move their sprites constantly, even Pokémon Red, which only bobs.
9. **The title flow loses the player's save and their bearings.**
   - The status strip ("Brindlemere, HP 9/9, Lv 1, 15 gp, START: menu") is drawn over the title screen (`01-title-hud-bleed.png`).
   - Pressing START, as the title asks, carries through and opens the pause menu over the town before you have seen it (`03-start-opens-menu.png`).
   - There is no New / Continue choice. With a save present, START silently begins a new level 1 game (`02-title-start-new-game-over-save.png`), and you must know to open the menu and pick Load.
10. **The ending drops its own twist.** Chapter 7 reveals that a vampire countess "wrote the song" and wants the dragon's ash for herself, and that "Ser Aldric hunts her". The finale is the dragon, and she never appears again. The dragon gets one line *after* it has been beaten (`48-final-boss-line-after-defeat.png`). The ending is a plain card ("THE CINDER KING IS SLAIN / THE END") behind the last dialogue line. It disappears when the box closes and leaves you standing in Brindlemere (`49-ending-card.png`). Even Dragon Quest I gives you a walk back to the castle and a parade of credits.

## Weak (working, but thin compared with the genre)

1. **The opening has no hook.** You are dropped onto a field as "Rowan, Ranger", a character with randomly rolled stats who is never introduced, and nobody tells you what to do (`04-town-first-view.png`). The quest-giver stands on the far east side of town. Pokémon opens with a mentor and a name. Link's Awakening opens with a shipwreck and someone who found you. Dragon Quest opens with a king and a mission. Here the first goal is something you stumble on.
2. **Every quest after chapter 1 follows one template.** Talk to A, talk to B, beat a boss standing at the same map coordinate, pick up an item at another fixed coordinate, talk to A. That is seven chapters in a row. The one flourish in chapter 1, "pull the red cord" at a fork, turns out to be flavour text printed when you open the chest. Compare Link's Awakening, where each dungeon introduces a new tool and the overworld changes because of it.
3. **The world is wide but empty.**
   - There are 36 zones, all generated, and the NPCs stand at the same four corner spots in each (`40-karn-doruhl.png`).
   - Signs cannot be read. Doors other than "The house" are painted on. The chests and dressers in "The house" (that is its real name) do nothing (`13-the-house.png`).
   - There are no secrets, shortcuts or optional caves.
   - Pokémon towns put a person and often an item in every house. Link's Awakening gives every screen something to find.
4. **Places don't look like their names.**
   - "Gallows Heath", a bandit moor, is a cheerful orange flower meadow with no gallows (`32-gallows-heath-flowers.png`).
   - "Thornreach Ruins", a city that "fell in a single night of fire", is flat grey blocks and grass rectangles with no scorch or ash (`35-thornreach-ruins.png`).
   - Karn Doruhl, the dwarf hold, uses the same grey-block template (`40-karn-doruhl.png`).
   - Frostfang Shore is pale blue ground scattered with red mushrooms (`37-frostfang-shore.png`).
   - Ponds and lava pools are hard rectangles with no shoreline tiles.
5. **Combat has one decision.** The only choices are A Attack and B Run (which always works), plus the Start-heal shortcut (`16-battle-goblin.png`). The Ranger has no bow, no skill and no defend. Dragon Quest I's Fight / Spell / Item / Run, and Pokémon's four moves with types, both give more to think about per turn. The free-action heal (the foe does not act while you drink, `18-battle-free-heal.png`) further flattens what tension there is.
6. **The battle portraits are small and often unreadable.**
   - The goblin, the Giant Frog, the black wyrmling and the final dragon are speckled colour noise in a 56 px box (`z-zoom-goblin.png`, `z-boss-portraits.png`).
   - The chapter 1 boss is the common Cultist tinted red (`28-cultist-same-portrait.png`).
   - The cult's High Cantor shares the purple-robed, white-bearded sprite used for Orwyn, Brindlemere's friendly pond warden.
   - Bosses get the same screen as a bat: no special backdrop, no pre-fight confrontation (`27-gravecaller-battle.png`).
7. **The only dungeon is a single room.** The Hollow Crypt is one 17x12 screen with side alcoves, a potion and a boss (`25-crypt-one-room.png`). It has no rooms, keys or switches. Link's Awakening's first dungeon already has rooms, keys, a mini-boss and a new tool.
8. **Pickups and purchases are silent.** Walking onto the Moonpetal Potion, Oak Shield or Brass Key adds them to the bag with no message (`07-silent-pickup.png`). Buying from the shop gives no confirmation, though a failed purchase does say "Not enough gold." Zelda's item-get pose and Pokémon's "Found POTION!" box exist because the player needs to know.
9. **The hero looks like the villagers.** Same size, same style, a similar palette, and no facing or animation. In a crowd it is hard to tell which one you control (`09-hero-looks-like-villagers.png`).
10. **The status strip is permanent and large.** It takes 48 of 192 pixel rows on every screen. When a dialogue box opens, the map shrinks to a strip (`05-dialogue-pella.png`). Link's Awakening's HUD is 16 px. Pokémon has none outside menus.
11. **Level-ups are a single line.** "Level up! Rowan is now level 2. Max HP 16." The panel has already updated before the line appears (`23-levelup-text-only.png`). There is no stat screen, no new ability and no jingle to see.
12. **Side features lead nowhere.**
    - Fishing is a text line ("A silver minnow! You let it go."). It gives no reward and has no mini-game (`08-fishing-text-only.png`).
    - Orwyn still says "Three lost treasures lie about town" after you have found all three.
    - The side-quest log names a quest but not where to go (`44-quest-log.png`).
13. **The world map is abstract.** Coloured cells show biomes, with no names, roads or quest markers (`45-world-map.png`).
14. **Defeat messages contradict themselves.** After my first defeat the battle log said "Orwyn carries you out of the grass. HP restored." The final page said "You wake sore, at half strength. Your 3 gp are gone." I woke in Highmarrow, a town I had never visited, with 4 of 8 HP. During the defeat veil, the status strip already shows where you will wake and with how much HP (`30-defeat-veil.png`).
15. **Set pieces happen in text only.** "The black gate grinds open on a road of ash", but you are facing a tile among gravestones and nothing on the map moves (`46-cindergate.png`). The chest's "red cord" is the same kind of thing.
16. **The title art and the game art don't match.** The detailed painted key art (`01-...`) is in a different style from the flat in-game tiles, and the in-game dragon is a blob that looks nothing like it (`47-...`).

## The 10 changes that would most improve it, ranked by impact on a player

1. **Make gear work.**
   - Add an Equip screen (Party → Equip) with ↑↓ stat comparison.
   - Offer "Equip now?" on purchase and on quest reward.
   - Show weapon, armour, shield, attack and AC on the Party screen.
   - Let the player actually wield Winter's Tooth.

   This one change switches on shopping, loot, side quests and the story's payoff.
2. **Balance the curve for one hero.**
   - Tune every boss so it is winnable at the level and gear a player will have when they reach it.
   - Keep level-1 grass to level-1 threats: no 18 HP frogs.
   - Make the first forest fight survivable.
   - Make levels add to-hit and damage, not just HP.

   Aim for roughly 3 to 6 rounds per normal fight and 8 to 12 per boss, and test each chapter by hand.
3. **Fix items.**
   - Give the item list a real cursor, with A using or equipping the highlighted item.
   - Make any healing potion work with Start in battle, at the cost of the turn.
   - Show one line per item with "x3" counts, aligned icons and a scroll mark.
   - Make every key item do something or say why it can't.
4. **Build an economy.**
   - Monsters drop gold.
   - Prices fit the game's scale: no 0.01 gp, and the first potion affordable within a few fights.
   - Put an inn in every town.
   - Give the late-game gold something to buy.
5. **Give combat feedback and choices.**
   - Sequence each round: your roll, then a hit flash, shake and damage number, a pause, then the foe's turn.
   - Fade the foe out on defeat.
   - Add two or three class actions (for a Ranger: an aimed shot, a defend) and an Item command.
   - Fix the foe's dice labels (the box says d8 under a 1d6+2 or 1d4+2 roll).
   - Keep the dice display: it is the game's signature.
6. **Fix the title and give the game an opening.**
   - Offer New and Continue on the title, with Continue as the default when a save exists.
   - Hide the status strip on the title.
   - Stop the START press from opening the pause menu.
   - Add a short intro that introduces Rowan and puts Elder Maren within sight, so the hook comes in the first minute.
7. **Animate the characters.**
   - Draw four-direction sprites with a two-frame walk cycle.
   - Have NPCs turn to face the hero when spoken to and idle-bob while waiting.
   - Give the hero a distinct palette or outline so they stand out from the villagers.
8. **Fix the sprite and tile bugs and give bosses a presence.**
   - Fill the hollow conifers.
   - Replace the sliver, the opaque square and the door with readable boss figures on the map.
   - Give each boss a clean, larger battle portrait and a line or two of confrontation *before* the fight.
   - Add shoreline and edge tiles for water and lava.
9. **Do a text and layout pass.**
   - No truncation in the shop, items or battle names.
   - No one-word pages.
   - Capital "The" at the start of a sentence.
   - Fix the status-strip pixel dropout and the "ﬁ" ligature.
   - Shrink the status strip, or hide it outside menus and battles, to give the map its screen back.
10. **Make places and quests distinct.**
    - Break the talk–talk–boss–fetch template with a switch puzzle (make the red cord real), a multi-room dungeon or an escort.
    - Hand-place one landmark per region that matches its name: gallows on the heath, scorched walls in Thornreach.
    - Make signs readable and some doors enterable.
    - Move NPCs off the fixed corner spots.
    - Bring the countess into the finale so the twist pays off.
