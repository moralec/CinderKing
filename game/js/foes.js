// js/foes.js - Thornwood and crypt foes, the boss, a potion in battle
const FOES = { forest:[ { name:'Moss Rat', frame:123, hp:5, ac:10, atk:2, die:4, xp:10 }, { name:'Bramble Imp', frame:110, hp:8, ac:12, atk:3, die:6, xp:18 } ],
  crypt:[ { name:'Grave Rat', frame:124, hp:7, ac:11, atk:3, die:4, xp:14 }, { name:'Pale Wisp', frame:121, hp:12, ac:12, atk:3, die:6, xp:22 } ] };
const BOSS = { name:'Gravecaller', frame:111, hp:26, ac:13, atk:4, die:8, xp:60, boss:1 };
const B2 = { start:Battle.start, strike:Battle.strike, attack:Battle.attack, end:Battle.end, grass:Rules.isGrass, pressStart:Ctl.pressStart };
Rules.isGrass = (x, y) => !G.calm && B2.grass(x, y);
Battle.start = foe => { B2.start(); const z = FOES[G.map], m = foe || (z && z[roll(z.length) - 1]); if (!m) return;
  Object.assign(G.battle, { enemy:{ ...m, maxHp:m.hp }, log:[m.boss ? 'The Gravecaller attacks!' : `A ${m.name} creeps out!`] });
  Battle.onChange(); };
Battle.strike = (who, bonus, ac, die, dmgMod) => who !== 'You' ? B2.strike(who, bonus, ac, die, dmgMod)
  : B2.strike(who, Math.max(bonus, 0) + 2, ac, die, Math.max(dmgMod, 0));   // +2 = proficiency
Battle.attack = () => { B2.attack(); const r = G.battle.lastRoll; r.mod = r.total - r.value; };
Battle.end = result => { const boss = G.battle.enemy.boss && G.quest.stage === 4; B2.end(result);
  if (result !== 'win') { if (G.map !== 'town') say([result === 'lose' ? 'You fall... and wake where you stood. HP restored.' : 'You get away.']); }
  else if (boss) { Bag.add(BELL); Quest.set(5); say([...uiScene().pages, `The bell falls silent. You got the ${BELL}.`]); } };
Ctl.pressStart = () => { if (inBattle()) Bag.use(DRAUGHT); else B2.pressStart(); };
