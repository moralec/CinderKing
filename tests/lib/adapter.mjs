// adapter.mjs - the ONLY place where the suite touches the game's internals (names that are not on window.__game).
//
// Everything else in tests/ reads the game through window.__game (the hook), through what is drawn (the visible Phaser texts)
// and drives it with real keys. A round that renames one of the names below changes this file and nothing else.
//
// What is used, and why the hook is not enough:
//   G.scene / G.busy / DB.ready   "the game runs and is not in the middle of a step or a scene change". The hook has no such
//                                 field, and in v0.5 reading window.__game hides the title, which the title tests must not do.
//   Defeat.force                  choose which defeat outcome the next lost battle takes, so each can be tested (ui.defeat.home).
//   G.hero (fallback only)        set the hero's HP or ability scores for a set-up. The suite first writes through the live
//                                 object the hook returns (window.__game.party[0]); G.hero is used only if that did not take.
// Nothing here is ever the thing under test: these are set-ups (a hurt hero, a sturdy hero, a fixed hero for the simulation).

/** true in the page once the game has booted and takes input (evaluated before anything else is injected) */
export const BOOTED = `typeof G !== 'undefined' && !!G.scene && !G.busy && typeof DB !== 'undefined' && DB.ready === true`;

/** in-page: window.TA */
export const ADAPTER = `window.TA = {
  idle: () => typeof G !== 'undefined' && !!G.scene && !G.busy,
  hero: () => window.__game.party[0],
  setHp(n) { const h = window.__game.party[0]; h.hp = n; if (window.__game.party[0].hp !== n && typeof G !== 'undefined') G.hero.hp = n; return window.__game.party[0].hp === n; },
  // which of the defeat outcomes of data/defeat.json the next lost battle takes (null = by the dice again); false if the game has no such switch
  forceDefeat(o) { if (typeof Defeat === 'undefined') return false; Defeat.force = o; return true; },
  // ability scores of a fresh hero; max HP follows the CON modifier, AC and attack are recomputed by the game (grantXp(0) refreshes them)
  setStats(s) { const live = window.__game.party[0], h = live.stats ? live : G.hero, m = v => Math.floor((v - 10) / 2), was = m(h.stats.con);
    Object.assign(h.stats, s); h.maxHp = Math.max(1, h.maxHp + (m(h.stats.con) - was) * h.level); h.hp = h.maxHp;
    window.__game.actions.grantXp(0); return true; },
};`;
