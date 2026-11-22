// js/defeatrun.js — a lost battle has a price: one of three outcomes; the hero wakes somewhere safe

Defeat.last = null;

Defeat.move = function (p) {
  G.facing = 'down';
  if (p.map === G.map) {
    G.px = p.x;
    G.py = p.y;
    G.scene.player.setPosition(p.x * 16 + 8, p.y * 16 + 8);
    return;
  }
  var scene = G.scene;
  Object.assign(G, { map: p.map, px: p.x, py: p.y, busy: true, scene: null });
  scene.scene.start(MAPS[p.map].scene);
};

Defeat.run = function () {
  var d = Defeat.data, h = G.hero, outcome = Defeat.pick(), from = G.map;
  var place = Defeat.place(from), who = Defeat.finder(from);
  var had = Math.floor(G.gold || 0), fee = 0, lost = [];
  if (outcome === 'hand') {
    fee = Math.floor(had * d.fee);
    G.gold -= fee;
    h.hp = h.maxHp;
  } else if (outcome === 'robbed') {
    lost = Defeat.loot();
    for (var i = 0; i < lost.length; i++) Bag.drop(lost[i]);
    G.gold = 0;
    h.hp = h.maxHp;
  } else if (outcome === 'town') {
    G.gold = 0;
    h.hp = Math.ceil(h.maxHp / 2);
  }
  Defeat.last = { outcome: outcome, from: from, place: place, who: who, fee: fee, gold: outcome === 'hand' ? fee : had, lost: lost };
  Defeat.move(place);
  var fill = function (s) {
    return s.replace('{who}', who).replace('{place}', place.name).replace('{fee}', fee).replace('{gold}', had).replace('{n}', lost.length);
  };
  say([d.fall].concat(d[outcome].map(fill)));
};

wrap(Battle, 'end', function (old) {
  return function (result) {
    var r = old(result);
    if (result === 'lose') Defeat.run();
    return r;
  };
});
