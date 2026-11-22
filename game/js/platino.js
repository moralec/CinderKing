// js/platino.js — step 49: Platino, the hidden silver dragon, appears on the 10th cast into the pond

(function () {
  function wrap(obj, name, make) {
    obj[name] = make(obj[name]);
  }

  wrap(Ctl, 'pressA', old => () => {
    const before = G.fishCount;
    const r = old();
    const p = Sprites.data && Sprites.data.platino;
    if (p && G.scene && G.fishCount === before + 1 && G.fishCount === p.casts) {
      const d = DIRS[G.facing];
      Sprites.platino = G.scene.add.sprite((G.px + d[0]) * 16 + 8, (G.py + d[1]) * 16 + 8, p.sheet, p.frame).setDepth(3.5);
      say([...uiScene().pages, p.page]);
    }
    return r;
  });
})();
