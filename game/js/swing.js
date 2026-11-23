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

  Battle.nick = e => {
    if (e.short) return e.short;
    if (e.name.length <= 14) return e.name;
    const words = e.name.split(' ');
    return 'the ' + words[words.length - 1];
  };

  Battle.lines = {
    hero_hit:  ['{hero} hits {foe} for {dmg}.'],
    hero_crit: ['{hero} hits {foe} hard for {dmg}!'],
    hero_miss: ['{hero} misses {foe}.'],
    foe_hit:   ['{Foe} hits you for {dmg}.'],
    foe_crit:  ['{Foe} hits you hard for {dmg}!'],
    foe_miss:  ['{Foe} misses you.']
  };

  Battle.tell = (kind, more) => {
    const list = Battle.lines[kind];
    const text = list[Math.floor(Math.random() * list.length)];
    const nick = Battle.nick(G.battle.enemy);
    const hero = G.hero.name;
    const Foe = nick.charAt(0).toUpperCase() + nick.slice(1);
    const hp = G.hero.hp;
    const max = G.hero.maxHp;
    let out = text;
    out = out.replace(/\{hero\}/g, hero);
    out = out.replace(/\{foe\}/g, nick);
    out = out.replace(/\{Foe\}/g, Foe);
    out = out.replace(/\{hp\}/g, hp);
    out = out.replace(/\{max\}/g, max);
    if (more) {
      for (const key of Object.keys(more)) {
        out = out.replace(new RegExp('\\{' + key + '\\}', 'g'), more[key]);
      }
    }
    return out;
  };

  function strike(bonus, ac, damage, extra) {
    const value = roll(20);
    const total = value + bonus;
    const hit = value === 20 || (value !== 1 && total >= ac);
    let dmg = 0;
    if (hit) {
      dmg = Math.max(1, rollDice(damage, value === 20) + (extra ? rollDice(extra) : 0));
    }
    G.battle.log.push('d20: ' + value + (bonus < 0 ? ' - ' : ' + ') + Math.abs(bonus) + ' = ' + total + ' vs AC ' + ac);
    return { roll: { die: 20, value, mod: bonus, total }, hit, crit: value === 20, dmg };
  }

  Battle.heroTurn = () => {
    const b = G.battle, h = G.hero, e = b.enemy;

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

    const mine = strike(h.attack.bonus, e.ac, h.attack.damage, extra);
    b.lastRoll = mine.roll;
    b.lastDmg = mine.hit ? mine.dmg : null;
    e.hp = Math.max(0, e.hp - mine.dmg);
    b.log.push(Battle.tell(mine.crit ? 'hero_crit' : mine.hit ? 'hero_hit' : 'hero_miss', { dmg: mine.dmg }));
    return e.hp > 0;
  };

  Battle.foeTurn = () => {
    const b = G.battle, h = G.hero, e = b.enemy;

    const foe = strike(e.attack.bonus, h.ac, e.attack.damage);
    b.enemyRoll = b.foeRoll = foe.roll;
    b.foeDmg = foe.hit ? foe.dmg : null;
    h.hp = Math.max(0, h.hp - foe.dmg);
    b.log.push(Battle.tell(foe.crit ? 'foe_crit' : foe.hit ? 'foe_hit' : 'foe_miss', { dmg: foe.dmg }));
    if (h.hp <= 0) return Battle.end('lose');
    Battle.onChange();
  };

  Battle.attack = () => {
    if (!Battle.heroTurn()) return Battle.end('win');
    Battle.foeTurn();
  };

})();
