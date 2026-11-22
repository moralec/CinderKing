// js/questtalk.js — chunk 23: talk -> quest

Tales.talk = npc => {
  const q = Tales.all().find(q => {
    const s = Tales.current(q);
    return s && s.type === 'talk' && s.npc === npc.id;
  });
  if (!q) return false;
  say(Tales.finish(q, Tales.stage(q), npc.name));
  return true;
};
TALK.unshift(Tales.talk);
