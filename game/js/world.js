// js/world.js - map data: east Brindlemere, Thornwood, the Hollow Crypt
const sol = o => ({ g:0, o, solid:1 }), dun = (d, more) => ({ g:109, d, ...more });
Object.assign(TOWN_LEGEND, { a:sol(48), b:sol(49), c:sol(50), d:sol(60), e:sol(61), h:sol(62), k:sol(76), q:sol(89), x:sol(88), z:sol(79),
  O:sol(104), '!':sol(83), A:sol(15) });
const FOREST_LEGEND = { ...TOWN_LEGEND, m:{ g:0, o:29 }, l:sol(106), s:{ g:43 }, n:{ g:1, p:65, solid:1 }, '+':{ g:1, p:64, solid:1 },
  '(':{ g:0, p:76, solid:1 }, '#':{ g:0, p:77, solid:1 }, ')':{ g:0, p:78, solid:1 }, 1:sol(99), 2:sol(100), 3:sol(101), B:{ g:126, solid:1 }, C:{ g:103 } };
const CRYPT_LEGEND = { '#':dun(40, { solid:1 }), b:dun(29, { solid:1 }), g:dun(19, { solid:1 }), '.':dun(0), ',':dun(12), ':':dun(24, { grass:1 }),
  c:dun(0, { p:54, solid:1 }), u:dun(0, { p:56, solid:1 }), E:dun(45) };
const EAST = [ 'TTTTTTTTTTT', '.,.Y..f..YT', '..abbc.,..T', ',.deeh..O.T', '..kqxz.f..T', '.,.p....,.T', 'f..p...<_>T', '...p.....!T',
  'pppppppppppppp', '.,...f...oT', '..t.,..A..T', '.....f....T', ',.A....,.tT', '..,..f....T', 'TTTTTTTTTTT' ];
MAPS.town.rows = MAPS.town.rows.map((r, y) => r.slice(0, 30 - EAST[y].length) + EAST[y]);
MAPS.town.warps.push({ x:29, y:8, to:'forest', tx:1, ty:9, facing:'right' });
MAPS.forest = { name:'forest', scene:'Forest', legend:FOREST_LEGEND, props:[], npcs:[], rows:[
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTYTTTTTYTTTTTYTTTTTTYTTTTTTYTTT',
  'TT.GGGGG.TTTTTTYTTTTTT.,..f...TT',
  'TTGGGGGG..pppppppppppp........TT',
  'TT.GGGGG.TpTTTTTTYTTTT..f...,.TT',
  'TTT.,..TTTpTGGGGGGTTTTT.,..m.TTT',
  'TTTTTTTTTTp.GGGGGGTTTYTTTTTTTTTT',
  'TT..l.TTTTpTGGGGGGTTTTTTTTYTTTTT',
  'TT.,..YTTTpTTTYTTTTTTTTTTTTTTTTT',
  'pppppppppppppppppppppTTTTTTYTTTT',
  'TTTTYTTT.TTTTTTYTTTTpTTTYTTTTTTT',
  'TT.,.f...m..TTA(####s#########)T',
  'TT..,.....f.TTA.n.+.s,.n..123.+T',
  'TT.WWW..GGGGTTA.....s.....BCB..T',
  'TT.WWW.mGGGGTTA.n.+.ssssssss.n.T',
  'TT.WWW..GGGGTTA.,.........f....T',
  'TT...,..GGGGTTA.n.+.n.+.n.+.n.+T',
  'TT.f......,.TTA......,.....f...T',
  'TTTYTTTTTTYTTTAATAAATAATAAATAATT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT' ],
  warps:[ { x:0, y:9, to:'town', tx:28, ty:8, facing:'left' }, { x:27, y:13, to:'crypt', tx:8, ty:10, facing:'up' } ] };
MAPS.crypt = { name:'crypt', scene:'Crypt', legend:CRYPT_LEGEND, dun:1, props:[], npcs:[], rows:[
  '#####gb#b#bg#####',
  '#c.c#...c...#c.c#',
  '#...#.u...u.#...#',
  '#:.:#.......#:.:#',
  '#...#.......#...#',
  '#.:.#.......#.:.#',
  '#...........,...#',
  '#:..#.......#...#',
  '#.c.#..,....#.c.#',
  '#####.......#####',
  '#####.,...,.#####',
  '########E########' ],
  warps:[ { x:8, y:11, to:'forest', tx:27, ty:14, facing:'down' } ] };
hook.maps = Object.values(MAPS).map(m => ({ name:m.name, width:m.rows[0].length, height:m.rows.length }));
for (const m of Object.values(MAPS)) m.rows.forEach((r, y) => { if (r.length !== m.rows[0].length) console.error('bad row', m.name, y);
  for (const c of r) if (!m.legend[c]) console.error('bad symbol', c, m.name, y); });
