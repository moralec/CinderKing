// js/ending.js — chunk 25: the ending card; long pages are cut to fit the box

(function () {
  // Cut long pages into chunks of at most 78 characters each
  function cutPages(pages) {
    return pages.flatMap(page => {
      const out = [];
      let line = '';
      const words = String(page).split(' ');
      for (const word of words) {
        if (line && (line + ' ' + word).length > 78) {
          out.push(line);
          line = word;
        } else {
          line = line ? line + ' ' + word : word;
        }
      }
      if (line) out.push(line);
      return out;
    });
  }

  UI_BUILD.push(ui => {
    // Build the ending card: a container at depth 9.5
    const card = ui.add.container(0, 0, []);
    card.setDepth(9.5);
    card.setVisible(false);

    // Dark rectangle background
    const bg = ui.add.graphics();
    bg.fillStyle(0x203020);
    bg.fillRect(0, 0, 256, 144);
    card.add(bg);

    // Title text centred near y 40
    const title = ui.add.text(128, 40, 'THE CINDER KING\nIS SLAIN', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#f8f8e8',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    card.add(title);

    // "THE END" near y 76
    const end = ui.add.text(128, 76, 'THE END', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: '#f8f8e8',
      align: 'center'
    }).setOrigin(0.5);
    card.add(end);

    ui.endCard = card;

    // Every frame: show card while G.ending; clear flag when dialogue closes
    ui.events.on('update', () => {
      if (G.ending) {
        ui.endCard.setVisible(true);
      }
      if (G.ending && !G.dialogueOpen) {
        G.ending = false;
        ui.endCard.setVisible(false);
      }
    });

    // Wrap showDialogue to cut long pages
    wrap(ui, 'showDialogue', old => pages => {
      old.call(ui, cutPages(pages));
    });
  });
})();
