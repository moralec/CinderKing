// js/shop.js — chunk 27: shop stock, buy, sell
const Shop = {
  i: 0,
  draw() {},
  stock() {
    if (!G.shop) return [];
    const npc = DB.world.npcs.find(n => n.id === G.shop);
    if (!npc) return [];
    return npc.stock.map(id => ({ id, price: DB.item[id].cost_gp }));
  },
  open(npcId) {
    G.shop = npcId;
    Shop.i = 0;
    Shop.draw();
  },
  close() {
    G.shop = null;
    Shop.draw();
  },
  buy(id) {
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
  },
  sell(id) {
    if (!G.shop) return false;
    const item = DB.item[id];
    if (!item || item.cost_gp == null) return false;
    if (!Bag.drop(item.name)) return false;
    G.gold += item.cost_gp / 2;
    Shop.draw();
    return true;
  }
};

G.shop = null;
expose('shop', () => G.shop ? { npc: G.shop, stock: Shop.stock() } : null);
Object.assign(hook.actions, {
  buy: id => Shop.buy(id),
  sell: id => Shop.sell(id)
});
