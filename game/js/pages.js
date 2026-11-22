// js/pages.js - Start menu: Map and Credits entries, the Quest page

// Add Map and Credits entries before Save
MENU_OPTS.splice(MENU_OPTS.indexOf('Save'), 0, 'Map', 'Credits');

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
    }
    lines.push('SIDE:');
    const activeSide = quests.side.filter(function(q) { return Tales.status(q) === 'active'; });
    if (activeSide.length === 0) {
      lines.push('(none yet)');
    } else {
      for (const q of activeSide) {
        lines.push(q.name);
      }
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
    return fit('CREDITS\nRules, monsters, items: System Reference Document 5.1, Wizards of the Coast LLC, CC-BY-4.0.\nWorld and story: original.');
  }
  if (o === 'Party') {
    return fit(old() + '\nGold ' + G.gold + ' gp');
  }
  return fit(old());
});

// Wrap Menu.select: A on Quest, Map, Credits does nothing
wrap(Menu, 'select', old => () => {
  const o = MENU_OPTS[Menu.i];
  if (o === 'Quest' || o === 'Map' || o === 'Credits') return;
  old();
});

// UI_BUILD: panel and word wrap
UI_BUILD.push(function() {
  panel(Menu.box.list[0], 172, 4, 80, 126);
  Menu.body.setWordWrapWidth(150);
});
