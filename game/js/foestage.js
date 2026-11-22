// js/foestage.js - the foe of a battle stands on a dark stage
const FoeStage = { box: [188, 0, 56, 52], colour: 0x140c1c, g: null };

UI_BUILD.push(ui => {
  const [x, y, w, h] = FoeStage.box;
  const g = ui.add.graphics();
  g.fillStyle(0xb8d890).fillRect(x + w, 44, 4, 8);
  g.fillStyle(FoeStage.colour).fillRoundedRect(x, y, w, h, 3);
  BattleView.box.addAt(g, BattleView.box.getIndex(BattleView.foe));
  FoeStage.g = g;
});
