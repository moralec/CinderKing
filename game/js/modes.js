// js/modes.js — input router: the screen that is open takes the keys

const Modes = { list: [], moved: 0,
  add(mode) {
    this.list.push(mode);
    this.list.sort((a, b) => b.z - a.z);
    return mode;
  },
  top() {
    if (G.dialogueOpen) return null;
    for (let i = 0; i < this.list.length; i++) {
      if (this.list[i].on && this.list[i].on()) return this.list[i];
    }
    return null;
  },
  tick() {
    const now = Date.now();
    if (now - this.moved < 170) return false;
    this.moved = now;
    return true;
  }
};

wrap(Ctl, 'pressA', old => () => {
  const m = Modes.top();
  if (!m) return old();
  if (m.a) m.a();
});

wrap(Ctl, 'pressB', old => () => {
  const m = Modes.top();
  if (!m) return old();
  if (m.b) m.b();
});

wrap(Ctl, 'pressStart', old => () => {
  const m = Modes.top();
  if (!m) return old();
  if (m.start) m.start();
});

wrap(Ctl, 'step', old => (dir) => {
  const m = Modes.top();
  if (!m) return old(dir);
  const r = (m.dir && Modes.tick()) ? m.dir(dir) : null;
  return (r && r.then) ? r : Promise.resolve(false);
});
