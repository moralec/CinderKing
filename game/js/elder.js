// js/elder.js — chunk 26: the elder's talk, chapter 1 reward + chapter 2+ steps through her

SETUP.push(function elder() {
  var first = DB.world.quests.main[0];
  var g = hook.landmarks.giver;
  var actor = ACTORS.find(function(a) { return a.map === g.map && a.x === g.x && a.y === g.y; });
  var npc = DB.world.npcs.find(function(n) { return n.id === first.giver; });
  wrap(actor, 'talk', function(old) {
    return function() {
      var was = Tales.status(first);
      if (was === 'done' && Tales.talk(npc)) return;
      old.call(actor);
      if (was !== 'done' && Tales.status(first) === 'done') {
        G.gold += first.reward.gold;
        uiScene().showDialogue([].concat(uiScene().pages, 'You also get ' + first.reward.gold + ' gp and ' + first.reward.xp + ' XP.', Rules.grantXp(first.reward.xp)));
      }
    };
  });
});
