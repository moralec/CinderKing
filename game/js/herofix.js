// js/herofix.js - the same hero in every game; hit points by the rules

SETUP.push(function herofix() {
  s = DB.world.meta.start.hero;  h = G.hero
  if (s) { h.name = s.name || h.name;  h.cls = s.cls || h.cls;  Object.assign(h.stats, s.stats) }     // no hero in the data: the rolled one stays
  die = DB.rules.hit_die[h.cls] || 8
  Rules.hpGain = who => Math.max(1, die / 2 + 1 + mod(who.stats.con))      // every level after the first
  h.maxHp = die + mod(h.stats.con);  h.hp = h.maxHp                        // level 1: the whole hit die
  Rules.grantXp = n => {
    who = G.hero; out = []; who.xp += n
    while (who.xp >= Rules.xpNext(who)) {
      who.level++;  who.maxHp += Rules.hpGain(who);  who.hp = who.maxHp
      out.push('Level up! ' + who.name + ' is now level ' + who.level + '. Max HP ' + who.maxHp + '.') }
    Hero.refresh();  return out }
  Hero.refresh()
})
