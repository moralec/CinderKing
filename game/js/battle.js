// js/battle.js - battle rules (screen: js/battleview.js)
const Battle = {
  onChange() {},   // battleview.js replaces this
  start() { const m = MONSTERS[roll(MONSTERS.length) - 1];
    G.battle = { active:true, enemy:{ ...m, maxHp:m.hp }, log:[`A wild ${m.name} appears!`], lastRoll:null, lastDmg:null, foeRoll:null, foeDmg:null, result:null };
    Battle.onChange(); },
  strike(who, bonus, ac, die, dmgMod) { const v = roll(20), total = v + bonus, hit = v === 20 || (v > 1 && total >= ac);
    const rollText = who === 'You' ? 'You roll' : `${who} rolls`;
    let line = `${rollText} d20: ${v} +${bonus} = ${total} ${hit ? 'HIT' : 'MISS'}`, dmg = 0, r = 0;
    if (hit) { r = roll(die); dmg = r + dmgMod; line += `  d${die}: ${r} +${dmgMod} = ${dmg} dmg`; }
    G.battle.log.push(line);
    return { value:v, total, hit, dmg, r }; },
  attack() { const b = G.battle, h = G.hero, e = b.enemy, m = mod(h.stats.dex);
    const p = Battle.strike('You', m, e.ac, 8, m);
    b.lastRoll = { die:20, value:p.value, mod:m, total:p.total }; b.lastDmg = p.hit ? p.r : null;
    e.hp = Math.max(0, e.hp - p.dmg);
    if (e.hp <= 0) return Battle.end('win');
    const f = Battle.strike(e.name, e.atk, Rules.ac(h), e.die, 0);
    b.foeRoll = { die:20, value:f.value, mod:e.atk, total:f.total }; b.foeDmg = f.hit ? f.r : null;
    h.hp = Math.max(0, h.hp - f.dmg);
    if (h.hp <= 0) return Battle.end('lose');
    Battle.onChange(); },
  flee() { Battle.end('fled'); },
  end(result) { const b = G.battle, h = G.hero, e = b.enemy; let msgs;
    if (result === 'win') msgs = [`${e.name} is defeated! You gain ${e.xp} XP.`, ...Rules.grantXp(e.xp)];
    else if (result === 'lose') { h.hp = h.maxHp; msgs = ['You fall... Orwyn carries you out of the grass. HP restored.']; }
    else msgs = ['You slip away through the tall grass.'];
    b.log.push(...msgs); b.result = result; b.active = false;
    Battle.onChange(); uiScene().showDialogue(msgs); } };
