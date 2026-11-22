// js/questspots.js - chunk 21: where every quest step is pressed; things and foes as actors; window.__game.quests

Tales.press = (q, k) => {
  const step = q.steps[k];
  say([(step.name || step.as) + ': not now.']);
};

SETUP.push(function questspots() {
  for (const q of Tales.all()) {
    const stepLocs = q.steps.map((s, k) => {
      let at;

      // First quest: use the round 3 landmarks in order
      if (Tales.isFirst(q)) {
        const lm = [
          hook.landmarks.giver,
          hook.landmarks.keeper,
          hook.landmarks.chest,
          hook.landmarks.crypt,
          hook.landmarks.boss,
          hook.landmarks.giver,
        ][k];
        at = { map: lm.map, x: lm.x, y: lm.y };
      } else if (s.type === 'talk') {
        // Talk steps: use the NPC's position
        at = Folk.place[s.npc];
      } else {
        // Fetch / open / defeat: take a free slot on the zone's map
        const map = mapOf(s.zone);
        at = Folk.takeSlot(map);
      }

      // For non-talk steps, create an actor on the map
      if (s.type !== 'talk') {
        const frame = s.sprite ? 0 : DB.mon[s.monster].sprite.frame;
        const tint = s.monster ? DB.mon[s.monster].sprite.tint : undefined;
        const sheet = s.sprite && s.sprite[0] === 'd' ? 'dun' : 'town';
        ACTORS.push({
          map: at.map,
          x: at.x,
          y: at.y,
          sheet: sheet,
          tint: tint,
          f: () => Tales.stage(q) <= k ? frame : -1,
          talk: () => Tales.press(q, k),
        });
      }

      return at;
    });

    // Tales.at[q.id][k] = { map, x, y } — just the location
    Tales.at[q.id] = stepLocs;
  }
});

expose('quests', () => {
  if (!DB.world) return { main: [], side: [] };
  const view = (q) => {
    const gq = G.quests[q.id];
    const stage = Tales.isFirst(q) ? G.quest.stage : (gq || 0);
    return {
      id: q.id,
      name: q.name,
      status: Tales.status(q),
      stage: stage,
      steps: q.steps.map((s, k) => ({
        type: s.type,
        at: Tales.at[q.id][k],
      })),
      reward: {
        xp: q.reward.xp,
        gold: q.reward.gold,
        items: q.reward.items.map(Tales.nameOf),
      },
    };
  };
  return {
    main: DB.world.quests.main.map(view),
    side: DB.world.quests.side.map(view),
  };
});
