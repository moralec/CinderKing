// js/defeatveil.js — the view goes dark while the defeat is told and fades back in

Defeat.dark = false

UI_BUILD.push(ui => {
  veil = ui.add.rectangle(0, 0, 256, 144, 0x101018).setOrigin(0).setDepth(9).setVisible(false)
  Defeat.veil = veil
  ui.events.on('update', () => {
    if (Defeat.dark && !G.dialogueOpen) {
      Defeat.dark = false
      ui.tweens.add({ targets: veil, alpha: 0, duration: 400, onComplete: () => { if (!Defeat.dark) veil.setVisible(false) } })
    }
  })
})

wrap(Defeat, 'run', old => () => {
  old()
  Defeat.dark = true
  uiScene().tweens.killTweensOf(Defeat.veil)
  Defeat.veil.setAlpha(1).setVisible(true)
})
