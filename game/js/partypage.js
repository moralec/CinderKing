// js/partypage.js — Step 85: the Party page also shows the attack of the weapon in hand

Pages.Party = {
  text(old) {
    return old() + '\nHit +' + G.hero.attack.bonus + ' Dmg ' + G.hero.attack.damage;
  }
};
