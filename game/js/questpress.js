// js/questpress.js — chunk 24: press on quest things and foes

Tales.press = (q, k) => {
  const step = q.steps[k];
  const label = step.name || step.as;

  // Not the current step: short message, no battle, no progress
  if (Tales.current(q) !== step) {
    say([label + ': not now.']);
    return;
  }

  if (step.type === 'defeat') {
    Battle.start(step.monster, { name: step.as, onWin: () => say([...uiScene().pages, ...Tales.finish(q, k)]), boss: DB.world.quests.main.includes(q) ? 1 : 0 });
    return;
  }

  if (step.type === 'open') {
    const needed = Tales.nameOf(step.needs);
    if (!Bag.drop(needed)) {
      say([label + ' is locked. You need the ' + needed + '.']);
      return;
    }
    // key was used up, fall through to completion
  }

  // fetch, or open with the key
  say(Tales.finish(q, k));
};
