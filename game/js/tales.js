// js/tales.js — quest state: stage, status, current step
const Tales = {
  at: {},

  all() {
    return [...DB.world.quests.main, ...DB.world.quests.side];
  },

  isFirst(q) {
    return q === DB.world.quests.main[0];
  },

  stage(q) {
    return Tales.isFirst(q) ? G.quest.stage : (G.quests[q.id] || 0);
  },

  status(q) {
    const s = Tales.stage(q);
    if (s >= q.steps.length) return 'done';
    if (!Tales.isFirst(q) && DB.world.quests.main.includes(q)) {
      const idx = DB.world.quests.main.indexOf(q);
      const prev = DB.world.quests.main[idx - 1];
      if (Tales.stage(prev) < prev.steps.length) return 'locked';
    }
    if (s > 0) return 'active';
    return 'available';
  },

  current(q) {
    if (Tales.isFirst(q)) return null;
    if (Tales.status(q) === 'locked' || Tales.status(q) === 'done') return null;
    return q.steps[Tales.stage(q)];
  },

  nameOf(id) {
    return DB.thing[id] ? DB.thing[id].name : id;
  },
};

SETUP.push(function tales() {
  if (!G.quests) G.quests = {};
  if (G.won == null) G.won = false;
});

expose('won', () => !!G.won);
