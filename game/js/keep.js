// js/keep.js — chunk 30: save/load integration with gold, quests, visited, won
wrap(Save, 'save', old => () => {
  const ok = old();
  const s = JSON.parse(localStorage.getItem('brindlemere'));
  s.gold = G.gold;
  s.quests = G.quests;
  s.visited = G.visited;
  s.won = G.won;
  localStorage.setItem('brindlemere', JSON.stringify(s));
  return ok;
});
wrap(Save, 'load', old => () => {
  if (!old()) return false;
  G.shop = null;
  G.ending = false;
  Hero.refresh();
  World.refresh();
  return true;
});
