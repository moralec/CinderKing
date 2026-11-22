// js/gear.js - carry, wear and wield: addItem, addGold, equip, unequip

Object.assign(hook.actions, {
  addItem(id) {
    const thing = DB.thing[id];
    if (!thing) return false;
    Bag.add(thing.name);
    return true;
  },

  addGold(n) {
    G.gold += n;
    return true;
  },

  equip(id) {
    const thing = DB.thing[id];
    if (!thing) return false;
    const item = DB.item[id];
    const slot = Hero.slotOf(item);
    if (!slot) return false;
    const name = thing.name;
    if (!Bag.drop(name)) return false;
    const old = G.hero.equipment[slot];
    if (old) {
      Bag.add(DB.thing[old].name);
    }
    G.hero.equipment[slot] = id;
    Hero.refresh();
    return true;
  },

  unequip(slot) {
    const eq = G.hero.equipment[slot];
    if (!eq) return false;
    Bag.add(DB.thing[eq].name);
    G.hero.equipment[slot] = null;
    Hero.refresh();
    return true;
  }
});
