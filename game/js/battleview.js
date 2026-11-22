// js/battleview.js - battle screen in the 256x144 view
const BattleView = {
  panels: {},
  build(ui) { const V = BattleView, g = ui.add.graphics(), C = (x, y, s) => txt(ui, x, y, s).setOrigin(0.5);
    V.panels = { foe: [4, 4, 140, 36], me: [48, 46, 140, 36],
      dice: [[12, 86, 22, 18], [40, 86, 22, 18], [194, 86, 22, 18], [222, 86, 22, 18]],
      log: [4, 115, 248, 27] };
    g.fillStyle(0xb8d890).fillRect(0, 0, 256, 144).fillStyle(0x587058).fillEllipse(216, 48, 60, 8).fillEllipse(28, 78, 40, 8);
    panel(g, ...V.panels.foe); panel(g, ...V.panels.me);
    for (const p of V.panels.dice) panel(g, ...p);
    panel(g, ...V.panels.log);
    V.bars = ui.add.graphics();
    V.foe = ui.add.sprite(216, 26, 'dun', 108).setScale(3); V.me = ui.add.sprite(28, 62, 'dun', 88).setScale(2);
    V.foeTxt = txt(ui, 10, 9, ''); V.meTxt = txt(ui, 54, 51, '');
    V.log = ui.add.text(10, 119, '', { ...FONT, color: '#203020', lineSpacing: 4 });
    V.d20 = C(23, 95, '?'); V.dmg = C(51, 95, '-');
    V.foeD20 = C(205, 95, '?'); V.foeDmg = C(233, 95, '-');
    V.foeD20Lbl = C(205, 109, 'd20'); V.foeDmgLbl = C(233, 109, 'd8');
    V.d20Lbl = C(23, 109, 'd20'); V.dmgLbl = C(51, 109, 'd8');
    const hint = txt(ui, 128, 95, 'A Attack  B Run', '#587058').setOrigin(0.5);
    V.hint = hint;
    V.box = ui.add.container(0, 0, [g, V.bars, V.foe, V.me, V.foeTxt, V.meTxt, V.log, V.d20, V.dmg, V.foeD20, V.foeDmg, V.foeD20Lbl, V.foeDmgLbl, V.d20Lbl, V.dmgLbl, hint])
      .setDepth(7).setVisible(false); },
  refresh() { const V = BattleView, b = G.battle;
    V.box.setVisible(!!b); if (!b) return;
    const e = b.enemy, h = G.hero;
    V.foe.setFrame(e.frame);
    V.foeTxt.setText(`${String(e.name).slice(0, 16)}\nHP ${e.hp}/${e.maxHp} AC ${e.ac}`);
    V.meTxt.setText(`${h.name} Lv ${h.level}\nHP ${h.hp}/${h.maxHp} AC ${Rules.ac(h)}`);
    V.d20.setText(b.lastRoll ? String(b.lastRoll.value) : '?'); V.dmg.setText(b.lastDmg != null ? String(b.lastDmg) : '-');
    V.foeD20.setText(b.foeRoll ? String(b.foeRoll.value) : '?'); V.foeDmg.setText(b.foeDmg != null ? String(b.foeDmg) : '-');
    V.log.setText(b.log.slice(-2).map(l => l.slice(0, 29)).join('\n'));
    V.bars.clear().fillStyle(0x203020).fillRect(10, 32, 128, 4).fillRect(54, 74, 128, 4)
      .fillStyle(0x58a048).fillRect(10, 32, 128 * Math.max(0,e.hp) / e.maxHp, 4).fillRect(54, 74, 128 * Math.max(0,h.hp) / h.maxHp, 4); } };
UI_BUILD.push(ui => BattleView.build(ui));
Battle.onChange = () => BattleView.refresh();
BattleView.hide = () => { BattleView.box.setVisible(false); };
(function wrapClose() {
  const origCreate = UIScene.prototype.create;
  UIScene.prototype.create = function() {
    origCreate.call(this);
    const cd = this.closeDialogue;
    if (cd) this.closeDialogue = function() { cd.call(this); if (!inBattle() && G.battle) BattleView.hide(); };
  };
})();
