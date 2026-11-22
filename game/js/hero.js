// js/hero.js - gold, equipment, AC and attack by the rules

const Hero = {
  full(id) {
    if (!id) return null;
    const it = DB.item[id];
    if (!it) return null;
    if (it.base) {
      const base = DB.item[it.base];
      return base ? { ...base, ...it } : it;
    }
    return it;
  },

  worn() {
    const slots = Object.keys(G.hero.equipment);
    return slots.map(s => G.hero.equipment[s]).filter(Boolean).map(id => this.full(id));
  },

  bonus(key) {
    return this.worn().reduce((sum, it) => sum + (it.effect && it.effect[key] ? it.effect[key] : 0), 0);
  },

  slotOf(item) {
    if (!item) return null;
    if (item.kind === 'weapon') return 'weapon';
    if (item.kind === 'armor') return 'armor';
    if (item.kind === 'shield') return 'shield';
    if (item.kind === 'magic') return item.slot || null;
    return null;
  },

  refresh() {
    const h = G.hero;
    const dexMod = mod(h.stats.dex);
    const strMod = mod(h.stats.str);
    const profBonus = DB.rules.proficiency_bonus[h.level - 1] || 2;

    // AC
    const armorItem = this.full(h.equipment.armor);
    let ac = 10 + dexMod;
    if (armorItem && armorItem.ac) {
      ac = armorItem.ac.base;
      if (armorItem.ac.dex_bonus) {
        if (armorItem.ac.max_dex != null) {
          ac += Math.min(dexMod, armorItem.ac.max_dex);
        } else {
          ac += dexMod;
        }
      }
    }
    if (h.equipment.shield) {
      const shieldItem = this.full(h.equipment.shield);
      if (shieldItem && shieldItem.ac_bonus) {
        ac += shieldItem.ac_bonus;
      }
    }
    ac += this.bonus('ac_bonus');
    h.ac = ac;

    // Attack
    const weaponItem = this.full(h.equipment.weapon) || { damage: '1', properties: [], category: '' };
    const properties = weaponItem.properties || [];
    const category = weaponItem.category || '';

    let abilityMod;
    if (properties && properties.includes('finesse')) {
      abilityMod = Math.max(strMod, dexMod);
    } else if (category && category.includes('ranged')) {
      abilityMod = dexMod;
    } else {
      abilityMod = strMod;
    }

    h.attack = {
      bonus: abilityMod + profBonus + this.bonus('attack_bonus'),
      damage: this._damageText(weaponItem, abilityMod)
    };
  },

  _damageText(weapon, abilityMod) {
    const dice = parseDice(weapon.damage || '1');
    const k = dice.k + abilityMod + this.bonus('damage_bonus');
    if (dice.n > 0) {
      if (k > 0) return dice.n + 'd' + dice.d + '+' + k;
      if (k < 0) return dice.n + 'd' + dice.d + String(k);
      return dice.n + 'd' + dice.d;
    }
    const val = Math.max(1, k);
    return String(val);
  }
};

SETUP.push(function hero() {
  const start = DB.world.meta.start;
  if (G.gold == null) G.gold = start.gold;
  if (!G.hero.equipment) G.hero.equipment = {};
  // Ensure always-present slots
  G.hero.equipment.weapon = G.hero.equipment.weapon || start.equipment.weapon || null;
  G.hero.equipment.armor = G.hero.equipment.armor || start.equipment.armor || null;
  G.hero.equipment.shield = G.hero.equipment.shield || null;
  // Copy any other equipment from start
  for (const k of Object.keys(start.equipment || {})) {
    if (!(k in G.hero.equipment)) G.hero.equipment[k] = start.equipment[k] || null;
  }
  Hero.refresh();
});

expose('gold', () => G.gold ?? 0);
