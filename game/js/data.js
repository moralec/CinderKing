// data.js — MAPS, legends, entities, texts, button positions (plain data, no Phaser)

const NPC_PAGES = [
  'Welcome to Brindlemere! I am Orwyn, warden of the pond.',
  "The fish bite best at the water's edge. Face the pond and press A.",
  'Three lost treasures lie about town. Bring a keen eye!'
];
const FISH = [
  'You cast your line... A silver minnow! You let it go.',
  'You cast your line... Nothing bit this time.',
  'You cast your line... A grumpy pond toad! It hops away.'
];

const TOWN_LEGEND = {
  '.':{g:0}, ',':{g:1}, 'f':{g:2}, 'p':{g:25}, 'G':{g:134,grass:1},
  'T':{g:0,o:16,solid:1}, 'Y':{g:0,o:4,solid:1}, 't':{g:0,o:28,solid:1}, 'o':{g:0,o:5,solid:1},
  'W':{g:132,solid:1,water:1},
  '[':{g:0,o:52,solid:1}, '=':{g:0,o:53,solid:1}, ']':{g:0,o:54,solid:1},
  '{':{g:0,o:64,solid:1}, '-':{g:0,o:65,solid:1}, '}':{g:0,o:66,solid:1},
  'L':{g:0,o:72,solid:1}, 'D':{g:25,o:85}, 'w':{g:0,o:84,solid:1}, 'R':{g:0,o:75,solid:1},
  '<':{g:0,o:80,solid:1}, '_':{g:0,o:81,solid:1}, '>':{g:0,o:82,solid:1}
};
const HOUSE_LEGEND = {
  '#':{g:126,solid:1}, '%':{g:125,solid:1}, '_':{g:109}, 'E':{g:103},
  'q':{g:96}, 'w':{g:97}, 'e':{g:98},
  'a':{g:120}, 's':{g:121}, 'd':{g:122}
};

const MAPS = {
  town: {
    name:'town', scene:'Town', legend:TOWN_LEGEND,
    rows:[
      'TTTTTTTTTTTTTTTTTTTT',
      'T..,....Y...GGGGGG.T',
      'T..[==].....GGGGGG.T',
      'T.,{--}..o...f.....T',
      'T..LDwR........f...T',
      'T.,.p........,.....T',
      'T...p.,.....<____>.T',
      'Tf..p...,........,.T',
      'T.pppppppppppppp...T',
      'T..,.....t....p..,.T',
      'T.....f......WWWW..T',
      'T............WWWW..T',
      'T...o..,.....WWWW..T',
      'T.,......f.......,.T',
      'TTTTTTTTTTTTTTTTTTTT'
    ],
    props: [],
    npcs:  [{ x:10, y:4, key:'dun', frame:84, pages:NPC_PAGES }],
    warps: [{ x:4, y:4, to:'house', tx:7, ty:7, facing:'up' }]
  },
  house: {
    name:'house', scene:'House', legend:HOUSE_LEGEND,
    rows:[
      '####%####%######',
      '#______________#',
      '#______________#',
      '#__qwwwwwwwwe__#',
      '#__assssssssd__#',
      '#______________#',
      '#______________#',
      '#______________#',
      '#######E########'
    ],
    props: [
      {x:2,y:1,key:'dun',frame:63}, {x:3,y:1,key:'dun',frame:63},
      {x:13,y:1,key:'dun',frame:89},
      {x:11,y:3,key:'dun',frame:72}, {x:10,y:3,key:'dun',frame:73}, {x:12,y:3,key:'dun',frame:73},
      {x:1,y:5,key:'dun',frame:63},
      {x:14,y:5,key:'dun',frame:63},
      {x:1,y:7,key:'dun',frame:90}, {x:2,y:7,key:'dun',frame:91}
    ],
    npcs:  [],
    warps: [{ x:7, y:8, to:'town', tx:4, ty:5, facing:'down' }]
  }
};

const ITEMS = [
  { map:'town', x:16, y:3,  name:'Moonpetal Potion', key:'dun',  frame:115 },
  { map:'town', x:2,  y:11, name:'Brass Key',        key:'town', frame:117 },
  { map:'town', x:17, y:11, name:'Oak Shield',       key:'dun',  frame:101 }
];
const START = { map:'town', x:9, y:8, facing:'down' };

const BTN = {
  up:{x:28,y:153}, down:{x:28,y:183}, left:{x:13,y:168}, right:{x:43,y:168},
  a:{x:236,y:160}, b:{x:212,y:176}
};

// Validation
(function(){
  for (const name of Object.keys(MAPS)){
    const m = MAPS[name];
    const refLen = m.rows[0].length;
    m.rows.forEach((r,y)=>{
      if (r.length!==refLen) console.error('bad row', name, y);
      for (const c of r) if (!m.legend[c]) console.error('bad symbol', c, 'at', name, y);
    });
  }
})();
