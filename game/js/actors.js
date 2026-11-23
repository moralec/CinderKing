// js/actors.js - people and things you face and press A on
const give = (flag, pages) => { if (!Quest.flag(flag)) return false; Bag.add(DRAUGHT); World.refresh(); say([...pages, `You got a ${DRAUGHT}.`]); return true; };
const ACTORS = [
  { ...SPOT.giver, f: () => 100, talk() { const s = G.quest.stage;
    if (s === 0) { Bag.add(DRAUGHT); Quest.set(1); say(['Elder Maren: The dead do not rest. A bell tolls under Thornwood every night.',
      'Find Brother Tobin at the cemetery, east through the gate. Take this.', `Quest: The Restless Crypt. You got a ${DRAUGHT}.`]); }
    else if (s === 5) { Bag.drop(BELL); Bag.add(CHARM); Quest.set(6); say(["Elder Maren: The Gravecaller's bell! Then it is over. Thank you.",
      `Quest complete! You got the ${CHARM}.`]); }
    else say([s < 5 ? 'Elder Maren: Brother Tobin keeps the cemetery in Thornwood. Go east.' : 'Elder Maren: The nights are quiet again. Rest well.']); } },
  { ...SPOT.helper, f: () => 98, talk() { give('hale', ['Hale: Beasts hide in the tall grass of Thornwood.', 'Take this. Press START in a fight to drink it.']) ||
    say(['Hale: Keep to the path and you keep your boots.']); } },
  { ...SPOT.keeper, f: () => 86, talk() { const s = G.quest.stage;
    if (s === 1) { Quest.set(2); say(['Tobin: Maren sent you? A hooded man, the Gravecaller, went into the crypt.',
      'I locked the gate behind him and hid the key in the chest in the north glade.', 'Go north at the fork and pull the red cord. Then open the gate.']); }
    else say([s < 1 ? 'Tobin: Mind the graves. The elder in town may have work for you.' : s < 4 ? 'Tobin: The chest is in the north glade. The crypt is behind me.'
      : s < 5 ? 'Tobin: He is down there. Strike true.' : 'Tobin: Quiet at last. Bless you.']); } } ];
World.at = (x, y) => ACTORS.find(a => a.map === G.map && a.x === x && a.y === y && a.f() >= 0);
World.draw = sc => { sc.actors = ACTORS.filter(a => a.map === G.map).map(a => [a, sc.add.sprite(a.x * 16 + 8, a.y * 16 + 8, 'dun', 0).setDepth(3)]);
  World.refresh(); };
World.refresh = () => { for (const [a, s] of (G.scene && G.scene.actors) || []) { const f = a.f(); s.setVisible(f >= 0); if (f >= 0) s.setFrame(f); } };
const R2 = { blocked:Ctl.blocked, pressA:Ctl.pressA };
Ctl.blocked = (x, y) => R2.blocked(x, y) || !!World.at(x, y);
Ctl.pressA = () => { const d = DIRS[G.facing], a = !G.dialogueOpen && !inBattle() && !G.menuOpen && G.scene && !G.busy && World.at(G.px + d[0], G.py + d[1]);
  if (a) a.talk(); else R2.pressA(); };
