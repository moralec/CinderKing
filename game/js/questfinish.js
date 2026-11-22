// js/questfinish.js — chunk 22: Tales.finish(q, k, speaker) does a step

Tales.finish = (q, k, speaker) => {
  const step = q.steps[k];

  // Take items from bag
  if (step.takes) {
    for (const id of step.takes) {
      Bag.drop(Tales.nameOf(id));
    }
  }

  // Give items to bag
  if (step.gives) {
    for (const id of step.gives) {
      Bag.add(Tales.nameOf(id));
    }
  }

  // Advance stage
  if (Tales.isFirst(q)) {
    G.quest.stage = k + 1;
  } else {
    G.quests[q.id] = k + 1;
  }

  // Build pages
  const pages = [];
  if (step.pages) {
    for (const page of step.pages) {
      pages.push(speaker ? speaker + ': ' + page : page);
    }
  } else {
    pages.push(speaker ? speaker + ': ' + step.as + ' is defeated.' : step.as + ' is defeated.');
  }

  // "You got: <name>." for each gift
  if (step.gives) {
    for (const id of step.gives) {
      pages.push('You got: ' + Tales.nameOf(id) + '.');
    }
  }

  // If last step, pay reward
  if (k === q.steps.length - 1) {
    const reward = q.reward;
    G.gold += reward.gold || 0;
    if (reward.items) {
      for (const id of reward.items) {
        Bag.add(Tales.nameOf(id));
      }
    }

    pages.push('Quest complete: ' + q.name + '. ' + (reward.xp || 0) + ' XP, ' + (reward.gold || 0) + ' gp.');
    if (reward.items) {
      for (const id of reward.items) {
        pages.push('You got: ' + Tales.nameOf(id) + '.');
      }
    }
    const xpMsgs = Rules.grantXp(reward.xp || 0);
    for (const m of xpMsgs) {
      pages.push(m);
    }

    if (q.final) {
      G.won = true;
      G.ending = true;
      pages.push('The Cinder King is slain. Aldermoor is free.');
    }
  }

  World.refresh();
  return pages;
};
