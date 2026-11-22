// js/shopdoor.js — chunk 29: talk to a merchant -> shop -> buy -> wear it; B leaves

// Fix: shopview.js overwrote Shop.buy(id) with Shop.buy() (no params).
// Restore Shop.buy(id) for programmatic use while keeping UI buy.
(function() {
  const _uiBuy = Shop.buy;
  Shop.buy = function(id) {
    if (id == null) return _uiBuy();
    const stock = Shop.stock();
    const entry = stock.find(s => s.id === id);
    if (!entry) return false;
    const item = DB.item[id];
    if (!item || item.cost_gp == null) return false;
    if (G.gold < item.cost_gp) return false;
    G.gold -= item.cost_gp;
    Bag.add(item.name);
    Shop.draw();
    return true;
  };
})();

TALK.push(npc => {
  if (!npc.stock) return false;
  say([npc.name + ': ' + npc.lines[0]]);
  Shop.open(npc.id);
  return true;
});

wrap(Ctl, 'pressB', old => () => {
  if (G.shop && !G.dialogueOpen) {
    Shop.close();
  } else {
    old();
  }
});

wrap(Ctl, 'pressStart', old => () => {
  if (!G.shop) old();
});
