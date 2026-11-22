// js/pages.js - Start menu: Map and Credits entries, the Quest page

// Add Map and Credits entries before Save
MENU_OPTS.splice(MENU_OPTS.indexOf('Save'), 0, 'Map', 'Credits');

// Credits pages
Menu.cred = 0;
Menu.credits = [
  'Rules, monsters,\nitems: System\nReference Document\n5.1, Wizards of\nthe Coast LLC,\nCC-BY-4.0.',
  'Sprites: DawnLike\nv1.81 by\nDragonDePlatino.\nPalette by\nDawnBringer.\nCC-BY 4.0.',
  'Tiles: Tiny Town\nand Tiny Dungeon\nby Kenney, CC0.\nFont: Press Start\n2P, OFL 1.1.\nEngine: Phaser 3,\nMIT.',
  'World and story:\noriginal.\nCode written by a\nlocal model\n(Qwen3.6-35B-A3B);\nplans and reviews\nby Claude.\nCover: Gemini 3.1\nFlash Image.'
];

// Fit text to 10 lines of 18 chars
function fit(text) {
  return Menu.body.getWrappedText(text).slice(0, 10).join('\n');
}

// Wrap Menu.text for Quest, Map, Credits, Party
wrap(Menu, 'text', old => () => {
  const o = MENU_OPTS[Menu.i];
  if (o === 'Quest') {
    const quests = __game.quests;
    // Find the first main quest that is not done (use DB for chapter info)
    let mainQuest = null;
    for (const q of DB.world.quests.main) {
      if (Tales.status(q) !== 'done') { mainQuest = q; break; }
    }
    let lines = ['QUESTS'];
    if (mainQuest) {
      lines.push('Ch ' + mainQuest.chapter + ': ' + mainQuest.name);
      // Log of the step at Tales.stage
      const stage = Tales.stage(mainQuest);
      if (stage >= mainQuest.steps.length) {
        lines.push('The Cinder King is slain.');
      } else {
        const step = mainQuest.steps[stage];
        lines.push(step.log || '');
      }
    } else {
      lines.push('All ' + DB.world.quests.main.length + ' chapters done.');
    }
    // Count done side quests
    let doneSide = 0;
    for (const q of quests.side) {
      if (Tales.status(q) === 'done') doneSide++;
    }
    lines.push('SIDE ' + doneSide + '/' + quests.side.length + ' done');
    const activeSide = quests.side.filter(function(q) { return Tales.status(q) === 'active'; });
    for (const q of activeSide) {
      lines.push(q.name);
    }
    return fit(lines.join('\n'));
  }
  if (o === 'Map') {
    const zone = zoneOf(G.map);
    const zoneName = zone ? zone.name : G.map;
    const totalZones = DB.world.zones.length;
    const visitedCount = G.visited.length;
    return fit('MAP\n\n\n\n\n\n\n\n' + zoneName + '\n' + visitedCount + ' of ' + totalZones + ' seen');
  }
  if (o === 'Credits') {
    return fit('CREDITS ' + (Menu.cred + 1) + '/' + Menu.credits.length + '\n' + Menu.credits[Menu.cred]);
  }
  if (o === 'Party') {
    return fit(old() + '\nGold ' + G.gold + ' gp');
  }
  return fit(old());
});

// Wrap Menu.select: A on Quest, Map does nothing; A on Credits cycles pages
wrap(Menu, 'select', old => () => {
  const o = MENU_OPTS[Menu.i];
  if (o === 'Quest' || o === 'Map') return;
  if (o === 'Credits') { Menu.cred = (Menu.cred + 1) % Menu.credits.length; Menu.draw(); return; }
  old();
});

// UI_BUILD: panel and word wrap
UI_BUILD.push(function() {
  panel(Menu.box.list[0], 172, 4, 80, 126);
  Menu.body.setWordWrapWidth(150);
});

// SETUP: add credits pages to the hook
SETUP.push(function() {
  hook.credits += '\n' + Menu.credits.join('\n').replace(/\n/g, ' ');
});
