// js/save.js - localStorage; a save is applied when the page opens
const Save = {
  save() { localStorage.setItem('brindlemere', JSON.stringify({ map:G.map, px:G.px, py:G.py, facing:G.facing,
      inventory:G.inventory, hero:G.hero, fishCount:G.fishCount })); return true; },
  read() { const s = JSON.parse(localStorage.getItem('brindlemere') || 'null'); return s && MAPS[s.map] && s.hero ? s : null; },
  load() { const s = Save.read(); if (!s || !G.scene || G.busy) return false;
    if (G.dialogueOpen) uiScene().closeDialogue();
    Object.assign(G, s); G.battle = null; Battle.onChange();
    const sc = G.scene; G.busy = true; G.scene = null; sc.scene.start(MAPS[G.map].scene);
    uiScene().refreshCounter(); return true; },
  doSave() {
    const ok = Save.save();
    if (ok) uiScene().showDialogue(['Game saved.']);
    else uiScene().showDialogue(['Save failed.']);
    return ok; },
  doLoad() {
    const ok = Save.load();
    if (ok) uiScene().showDialogue(['Game loaded.']);
    else uiScene().showDialogue(['No save found.']);
    return ok; } };

