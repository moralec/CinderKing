// js/battleview.js - battle screen, layout A: whole canvas, four boxes, command list, telling box
const BattleView = {
  panels: {},
  cmds: ['Attack', 'Item', 'Run'],
  build(ui) {
    const V = BattleView;
    V.panels = {
      foe: [4, 4, 140, 28],
      me: [64, 96, 108, 28],
      menu: [176, 88, 76, 50],
      log: [4, 142, 248, 48]
    };
    // Ground: 0xb8d890 over 0, 0, 256, 192
    V.back = ui.add.graphics();
    V.back.fillStyle(0xb8d890).fillRect(0, 0, 256, 192);
    // Shadows
    V.back.fillStyle(0x587058);
    V.back.fillEllipse(212, 80, 56, 8);
    V.back.fillEllipse(28, 120, 36, 8);

    // Four boxes drawn with panel()
    V.frames = ui.add.graphics();
    panel(V.frames, ...V.panels.foe);
    panel(V.frames, ...V.panels.me);
    panel(V.frames, ...V.panels.menu);
    panel(V.frames, ...V.panels.log);

    // Dark HP bars
    V.bars = ui.add.graphics();
    V.bars.fillStyle(0x203020).fillRect(10, 21, 84, 4).fillRect(70, 113, 36, 4);

    // Foe sprite: at 212, 80, scale 3, origin 0.5, 1 (feet on y 80)
    V.foe = ui.add.sprite(212, 80, 'dun', 108).setScale(3).setOrigin(0.5, 1);
    // Hero sprite: 'dun' frame 88, at 28, 120, scale 2, origin 0.5, 1
    V.me = ui.add.sprite(28, 120, 'dun', 88).setScale(2).setOrigin(0.5, 1);

    // Texts
    V.foeTxt = txt(ui, 10, 9, '');
    V.foeAc = txt(ui, 138, 19, '').setOrigin(1, 0);
    V.meTxt = txt(ui, 70, 101, '');
    V.meHp = txt(ui, 166, 111, '').setOrigin(1, 0);
    V.cmd = ui.add.text(182, 94, '', { ...FONT, color: '#203020', lineSpacing: 6 }).setOrigin(0, 0);
    V.log = ui.add.text(12, 148, '', { ...FONT, color: '#203020', lineSpacing: 2 });

    V.box = ui.add.container(0, 0, [V.back, V.frames, V.bars, V.foe, V.me, V.foeTxt, V.foeAc, V.meTxt, V.meHp, V.cmd, V.log])
      .setDepth(7).setVisible(false);
  },
  rows() {
    return Fit.rows(G.battle.log.slice(-6).join('\n'), 29).slice(-4);
  },
  refresh() {
    const V = BattleView, b = G.battle;
    V.box.setVisible(!!b); if (!b) return;
    const e = b.enemy, h = G.hero;
    V.foe.setFrame(e.frame);
    V.foeTxt.setText(e.short || Fit.name(e.name, 16));
    V.foeAc.setText('AC ' + e.ac);
    V.meTxt.setText(h.name + ' Lv ' + h.level);
    V.meHp.setText(h.hp + '/' + h.maxHp);
    const ci = G.battle.cmd || 0;
    V.cmd.setText(V.cmds.map((c, i) => (i === ci ? '>' : ' ') + c).join('\n'));
    V.log.setText(V.rows().join('\n'));
    const ehp = Math.max(0, e.hp) / e.maxHp, hhp = Math.max(0, h.hp) / h.maxHp;
    V.bars.clear().fillStyle(0x203020).fillRect(10, 21, 84, 4).fillRect(70, 113, 36, 4)
      .fillStyle(0x58a048).fillRect(10, 21, 84 * ehp, 4).fillRect(70, 113, 36 * hhp, 4);
  },
  hide() { BattleView.box.setVisible(false); }
};
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
