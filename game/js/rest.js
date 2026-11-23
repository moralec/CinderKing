// js/rest.js — step 93: a bed for a fee; Rest = { sleep(fee), talk(npc) }

const Rest = {
  sleep(fee) {
    G.gold -= fee;
    G.hero.hp = G.hero.maxHp;
  },
  talk(npc) {
    const r = npc.rest;
    const h = G.hero;
    if (!r || h.hp >= h.maxHp) return false;
    const first = npc.name + ': ' + r.line;
    if (G.gold < r.fee) {
      say([first, 'A bed costs ' + r.fee + ' gp. You have ' + Math.floor(G.gold) + ' gp.']);
      return true;
    }
    Rest.sleep(r.fee);
    say([first, 'You sleep the night. You wake whole: HP ' + h.hp + '/' + h.maxHp + '. It cost ' + r.fee + ' gp.']);
    return true;
  }
};
TALK.splice(1, 0, Rest.talk);
