// js/foelook.js — step 46: the foe is drawn with its own picture from data/sprites.json
(function () {
  wrap(Battle, 'onChange', old => () => {
    old()
    const b = G.battle
    if (!b || !BattleView.foe) return
    const sp = Sprites.monster(b.enemy.id) || { key: 'dun', frame: b.enemy.frame }
    BattleView.foe.setTexture(sp.key, sp.frame)
    if (sp.key !== 'dun') BattleView.foe.clearTint()
  })
})()
