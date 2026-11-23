// js/menupages.js — Step 82: the pages of the Start menu are a registry
const Pages = {};

wrap(Menu, 'text', old => () => {
  const p = Pages[MENU_OPTS[Menu.i]];
  if (p && p.text) return fit(p.text(old));
  return old();
});

wrap(Menu, 'select', old => () => {
  const p = Pages[MENU_OPTS[Menu.i]];
  if (p && p.a) return p.a();
  return old();
});
