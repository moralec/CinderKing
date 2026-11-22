// js/pack.js - Start menu: Quest page, bag on the Items page (A drinks a draught); HP line
MENU_OPTS.splice(2, 0, 'Quest');
const menuText = Menu.text, menuSelect = Menu.select;
Menu.text = () => { const o = MENU_OPTS[Menu.i], s = G.quest.stage;
  if (o === 'Quest') return `QUEST\nThe Restless Crypt\n${s < 6 ? `Step ${s + 1} of 6` : 'Complete'}\n\n${GOALS[s]}`;
  if (o !== 'Items') return menuText();
  return menuText() + '\n\nBAG:\n' + ([...new Set(G.bag)].map(n => n + (count(n) > 1 ? ' x' + count(n) : '')).join('\n') || '(empty)') +
    (count(DRAUGHT) ? '\nA: drink draught' : ''); };
Menu.move = dir => { const now = Date.now(), dy = DIRS[dir][1], n = MENU_OPTS.length; if (!dy || now - Menu.last < 170) return;
  Menu.last = now; Menu.i = (Menu.i + dy + n) % n; Menu.draw(); };
Menu.select = () => { const o = MENU_OPTS[Menu.i];
  if (o === 'Items') { if (!Bag.use(DRAUGHT)) say([count(DRAUGHT) ? 'HP is already full.' : `No ${DRAUGHT} in the bag.`]); Menu.draw(); }
  else if (o !== 'Party' && o !== 'Quest') menuSelect(); };
UI_BUILD.push(ui => { panel(Menu.box.list[0], 172, 4, 80, 98); const hp = txt(ui, 128, 154, '', '#f8f8e8').setOrigin(0.5);
  ui.events.on('update', () => { const h = G.hero; hp.setText(inBattle() ? `START: Heal x${count(DRAUGHT)}` : `HP ${h.hp}/${h.maxHp}`); }); });
