// js/sprites.js — picture sheets and their map: Sprites.monster(id), Sprites.item(id)

const Sprites = { data: null };

function wrap(obj, name, make) {
  obj[name] = make(obj[name]);
}

(function () {
  wrap(BootScene.prototype, 'preload', old => function () {
    old.call(this);
    this.load.json('sprites', 'data/sprites.json');
    this.load.once('filecomplete-json-sprites', (key, type, data) => {
      Sprites.data = data;
      for (const [k, file] of Object.entries(data.sheets)) {
        this.load.spritesheet(k, file, { frameWidth: 16, frameHeight: 16 });
      }
    });
  });
})();

Sprites.monster = function (id) {
  const d = Sprites.data;
  if (!d || !d.monsters || !d.monsters[id]) return null;
  const [key, frame] = d.monsters[id];
  if (!window.game || !window.game.textures.exists(key)) return null;
  return { key: key, frame: frame };
};

Sprites.item = function (id) {
  const d = Sprites.data;
  if (!d || !d.items || !d.items[id]) return null;
  const [key, frame] = d.items[id];
  if (!window.game || !window.game.textures.exists(key)) return null;
  return { key: key, frame: frame };
};
