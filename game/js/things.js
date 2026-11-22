// js/things.js - the chest, the crypt gate, the boss, a vial
ACTORS.push(
  { ...SPOT.chest, f: () => G.quest.stage > 2 ? 91 : 89, talk() { const s = G.quest.stage;
    if (s === 2) { Bag.add(KEY); Quest.set(3); say([`You pull the red cord and the chest opens. You got the ${KEY}!`]); }
    else say([s < 2 ? 'A chest tied shut with a knotted red cord. It will not open.' : 'The chest is empty.']); } },
  { ...SPOT.crypt, f: () => G.quest.stage > 3 ? -1 : 77, talk() {
    if (Bag.drop(KEY)) { Quest.set(4); say(['The key turns and the gate swings open. The old key crumbles to rust.']); }
    else say(['An iron gate bars the crypt. It is locked.']); } },
  { ...SPOT.boss, f: () => G.quest.stage > 4 ? -1 : 111, talk() { Battle.start(BOSS); } },
  { ...SPOT.vial, f: () => G.quest.flags.includes('vial') ? -1 : 115, talk() { give('vial', ['A red vial stands among the bones.']); } } );
