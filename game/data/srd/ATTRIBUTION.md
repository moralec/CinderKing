# Attribution (must stay with the game)

The monsters in `monsters.json`, the weapons, armour, adventuring gear, potions and magic items in `items.json` and the rules in
`rules.json` are taken from the System Reference Document 5.1. The required credit, which the game must also show in its credits:

> This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at
> https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0
> International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

Notes:

- The numbers (armour class, hit points, hit dice, speed, ability scores, attack bonuses, damage dice, challenge rating, XP, costs,
  weights, armour values, rarity) are the SRD's, trimmed to the fields a game needs. The wording in `desc` is SRD text, shortened.
- The JSON form was derived from the open `5e-bits/5e-database` project (https://github.com/5e-bits/5e-database, `src/2014/en`,
  commit a6212be, MIT licence for the database's own work), which transcribes the SRD 5.1.
- Kit additions that are NOT SRD content: the `sprite`, `slot`, `effect` and `base` fields, and the ids `longsword-plus-1`,
  `shortbow-plus-1`, `greataxe-plus-2`, `chain-mail-plus-1`, `leather-armor-plus-1` (the SRD's "Weapon, +1, +2, or +3" and
  "Armor, +1, +2, or +3" applied to one base item each).
- The world, its places, people, story and quests in `../world.json` are original to this project (the campaign "The Cinder King" in
  the land of Aldermoor). They use no setting, story, character or place of Wizards of the Coast or of anyone else.
- "Dungeons & Dragons" and "D&D" are trademarks of Wizards of the Coast LLC. This game is not affiliated with, endorsed, sponsored or
  approved by Wizards of the Coast. Do not use those names or any Wizards of the Coast setting in the game.
