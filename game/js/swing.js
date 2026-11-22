// js/swing.js — d20 against armour class, both sides

(function () {

  Battle.short = name => {
    const s = String(name);
    if (s.length <= 16) return s;
    const cut = s.slice(0, 17);
    const sp = cut.lastIndexOf(' ');
    if (sp > 0) return cut.slice(0, sp).replace(/,$/, '');
    return s.slice(0, 16);
  };

  function strike(who, bonus, ac, damage, extra) {
    const value = roll(20);
    const total = value + bonus;
    const hit = value === 20 || (value !== 1 && total >= ac);
    let dmg = 0;
    if (hit) {
      dmg = Math.max(1, rollDice(damage, value === 20) + (extra ? rollDice(extra) : 0));
    }
    const res = hit ? 'HIT' : 'MISS';
    if (who === 'You') {
      G.battle.log.push(`You roll ${value}+${bonus}=${total} ${res}`);
    } else {
      G.battle.log.push(`${Battle.short(G.battle.enemy.name)} rolls ${total} ${res}`);
    }
    return { roll: { die: 20, value, mod: bonus, total }, hit, dmg };
  }

  Battle.attack = () => {
    const b = G.battle, h = G.hero, e = b.enemy;

    // Extra damage from magic weapons (optional)
    let extra = null;
    for (const item of Hero.worn()) {
      const ed = item && item.effect && item.effect.extra_damage;
      if (!ed) continue;
      const ov = ed.only_vs;
      if (!ov || ov.includes(e.type)) {
        extra = ed.damage;
        break;
      }
    }

    // Your strike
    const mine = strike('You', h.attack.bonus, e.ac, h.attack.damage, extra);
    b.lastRoll = mine.roll;
    b.lastDmg = mine.hit ? mine.dmg : null;
    e.hp = Math.max(0, e.hp - mine.dmg);
    if (e.hp <= 0) return Battle.end('win');

    // Foe strike
    const foe = strike('Foe', e.attack.bonus, h.ac, e.attack.damage);
    b.enemyRoll = b.foeRoll = foe.roll;
    b.foeDmg = foe.hit ? foe.dmg : null;
    h.hp = Math.max(0, h.hp - foe.dmg);
    if (h.hp <= 0) return Battle.end('lose');

    Battle.onChange();
  };

})();
