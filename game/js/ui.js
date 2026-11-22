// ui.js — UIScene (controls, dialogue box, counter)

const FONT = { fontFamily: '"Press Start 2P"', fontSize: '8px' };

class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    // Dialogue box
    this.box = this.add.graphics().setDepth(10);
    this.box.fillStyle(0xf8f8e8).fillRoundedRect(4, 96, 248, 44, 4);
    this.box.lineStyle(2, 0x203020).strokeRoundedRect(4, 96, 248, 44, 4);
    this.box.setVisible(false);
    this.msg = this.add.text(12, 102, '', { ...FONT, color: '#203020', wordWrap: { width: 232 }, lineSpacing: 4 })
      .setDepth(11);
    this.msg.setVisible(false);

    // More-marker triangle (blinking, bottom-right of box)
    this.tri = this.add.graphics().setDepth(12);
    this.tri.setVisible(false);
    this.tri.fillStyle(0x203020);
    this.tri.fillTriangle(240, 130, 234, 122, 246, 122);
    this.triTri = null;

    // Control strip
    this.add.rectangle(128, 168, 256, 48, 0x203020);

    // D-pad
    const dpadX = 28, dpadY = 168;
    // Center (non-interactive)
    this.add.rectangle(dpadX, dpadY, 14, 14, 0x587058);
    // up
    const upBtn = this.add.rectangle(dpadX, dpadY - 15, 14, 14, 0x587058)
      .setStrokeStyle(1, 0xf8f8e8).setInteractive();
    this._drawTri(upBtn, 0, -1);
    // down
    const downBtn = this.add.rectangle(dpadX, dpadY + 15, 14, 14, 0x587058)
      .setStrokeStyle(1, 0xf8f8e8).setInteractive();
    this._drawTri(downBtn, 0, 1);
    // left
    const leftBtn = this.add.rectangle(dpadX - 15, dpadY, 14, 14, 0x587058)
      .setStrokeStyle(1, 0xf8f8e8).setInteractive();
    this._drawTri(leftBtn, -1, 0);
    // right
    const rightBtn = this.add.rectangle(dpadX + 15, dpadY, 14, 14, 0x587058)
      .setStrokeStyle(1, 0xf8f8e8).setInteractive();
    this._drawTri(rightBtn, 1, 0);

    // A button
    const aBtn = this.add.circle(BTN.a.x, BTN.a.y, 9, 0x587058)
      .setStrokeStyle(1, 0xf8f8e8).setInteractive();
    this.add.text(BTN.a.x, BTN.a.y, 'A', { ...FONT, color: '#f8f8e8' }).setOrigin(0.5);
    // B button
    const bBtn = this.add.circle(BTN.b.x, BTN.b.y, 9, 0x587058)
      .setStrokeStyle(1, 0xf8f8e8).setInteractive();
    this.add.text(BTN.b.x, BTN.b.y, 'B', { ...FONT, color: '#f8f8e8' }).setOrigin(0.5);

    // Item counter
    this.counter = this.add.text(128, 168, '', { ...FONT, color: '#f8f8e8' }).setOrigin(0.5);
    this.refreshCounter();

    // Keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.input.keyboard.on('keydown-Z', e => { if (!e.repeat) Ctl.pressA(); });
    this.input.keyboard.on('keydown-SPACE', e => { if (!e.repeat) Ctl.pressA(); });
    this.input.keyboard.on('keydown-X', e => { if (!e.repeat) Ctl.pressB(); });
    this.input.keyboard.on('keydown-ESC', e => { if (!e.repeat) Ctl.pressB(); });

    // Pointer events for on-screen buttons
    this.padHeld = null;
    this.input.addPointer(2);

    upBtn.on('pointerdown', () => { this.padHeld = 'up'; Ctl.step('up'); });
    upBtn.on('pointerup', () => { this.padHeld = null; });
    upBtn.on('pointerout', () => { this.padHeld = null; });
    downBtn.on('pointerdown', () => { this.padHeld = 'down'; Ctl.step('down'); });
    downBtn.on('pointerup', () => { this.padHeld = null; });
    downBtn.on('pointerout', () => { this.padHeld = null; });
    leftBtn.on('pointerdown', () => { this.padHeld = 'left'; Ctl.step('left'); });
    leftBtn.on('pointerup', () => { this.padHeld = null; });
    leftBtn.on('pointerout', () => { this.padHeld = null; });
    rightBtn.on('pointerdown', () => { this.padHeld = 'right'; Ctl.step('right'); });
    rightBtn.on('pointerup', () => { this.padHeld = null; });
    rightBtn.on('pointerout', () => { this.padHeld = null; });
    aBtn.on('pointerdown', () => { Ctl.pressA(); });
    bBtn.on('pointerdown', () => { Ctl.pressB(); });

    // Invisible hit areas for larger touch targets
    this.add.rectangle(dpadX, dpadY - 15, 24, 24, 0x000000, 0).setInteractive().on('pointerdown', () => { this.padHeld = 'up'; Ctl.step('up'); }).on('pointerup', () => { this.padHeld = null; }).on('pointerout', () => { this.padHeld = null; });
    this.add.rectangle(dpadX, dpadY + 15, 24, 24, 0x000000, 0).setInteractive().on('pointerdown', () => { this.padHeld = 'down'; Ctl.step('down'); }).on('pointerup', () => { this.padHeld = null; }).on('pointerout', () => { this.padHeld = null; });
    this.add.rectangle(dpadX - 15, dpadY, 24, 24, 0x000000, 0).setInteractive().on('pointerdown', () => { this.padHeld = 'left'; Ctl.step('left'); }).on('pointerup', () => { this.padHeld = null; }).on('pointerout', () => { this.padHeld = null; });
    this.add.rectangle(dpadX + 15, dpadY, 24, 24, 0x000000, 0).setInteractive().on('pointerdown', () => { this.padHeld = 'right'; Ctl.step('right'); }).on('pointerup', () => { this.padHeld = null; }).on('pointerout', () => { this.padHeld = null; });
    this.add.circle(BTN.a.x, BTN.a.y, 14, 0x000000, 0).setInteractive().on('pointerdown', () => { Ctl.pressA(); });
    this.add.circle(BTN.b.x, BTN.b.y, 14, 0x000000, 0).setInteractive().on('pointerdown', () => { Ctl.pressB(); });

    // Dialogue box methods
    this.pages = []; this.page = 0;
    this.showDialogue = (pages) => {
      this.pages = pages; this.page = 0;
      G.dialogueOpen = true;
      this.box.setVisible(true);
      this.msg.setVisible(true);
      this.showPage();
    };
    this.showPage = () => {
      this.msg.setText(this.pages[this.page]);
      G.lastMessage = this.pages[this.page];
      if (this.page < this.pages.length - 1) {
        this.tri.setVisible(true);
        if (!this.triTri) this.triTri = this.time.addEvent({ delay: 500, loop: true, callback: () => this.tri.setVisible(!this.tri.visible) });
      } else {
        this.tri.setVisible(false);
        if (this.triTri) { this.triTri.remove(); this.triTri = null; }
      }
    };
    this.advance = () => {
      this.page++;
      if (this.page >= this.pages.length) this.closeDialogue();
      else this.showPage();
    };
    this.closeDialogue = () => {
      this.box.setVisible(false);
      this.msg.setVisible(false);
      this.tri.setVisible(false);
      if (this.triTri) { this.triTri.remove(); this.triTri = null; }
      G.dialogueOpen = false;
    };
  }

  update() {
    let dir = null;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dir = 'up';
    else if (this.cursors.down.isDown || this.wasd.S.isDown) dir = 'down';
    else if (this.cursors.left.isDown || this.wasd.A.isDown) dir = 'left';
    else if (this.cursors.right.isDown || this.wasd.D.isDown) dir = 'right';
    else dir = this.padHeld;
    if (dir) Ctl.step(dir);
  }

  refreshCounter() {
    this.counter.setText('ITEMS ' + G.inventory.length + '/' + ITEMS.length);
  }

  _drawTri(btn, dx, dy) {
    const g = this.add.graphics();
    g.fillStyle(0xf8f8e8);
    const cx = btn.x, cy = btn.y;
    if (dx === 0 && dy === -1) { // up
      g.fillTriangle(cx, cy - 4, cx - 4, cy + 2, cx + 4, cy + 2);
    } else if (dx === 0 && dy === 1) { // down
      g.fillTriangle(cx, cy + 4, cx - 4, cy - 2, cx + 4, cy - 2);
    } else if (dx === -1 && dy === 0) { // left
      g.fillTriangle(cx - 4, cy, cx + 2, cy - 4, cx + 2, cy + 4);
    } else if (dx === 1 && dy === 0) { // right
      g.fillTriangle(cx + 4, cy, cx - 2, cy - 4, cx - 2, cy + 4);
    }
  }
}
