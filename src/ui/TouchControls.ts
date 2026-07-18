import Phaser from 'phaser';

export class TouchControls {
  scene: Phaser.Scene;
  leftActive = false;
  rightActive = false;
  upActive = false;
  attackActive = false;
  skillActive = false;

  private joyBase?: Phaser.GameObjects.Graphics;
  private joyKnob?: Phaser.GameObjects.Graphics;
  private joyOrigin = { x: 0, y: 0 };
  private joyPointerId: number | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createJoystick();
    this.createButtons();
    this.setupInput();
  }

  private createJoystick(): void {
    const cam = this.scene.cameras.main;
    const cx = 90;
    const cy = cam.height - 90;
    this.joyOrigin = { x: cx, y: cy };

    this.joyBase = this.scene.add.graphics().setScrollFactor(0).setDepth(500).setAlpha(0.4);
    this.joyBase.fillStyle(0xffffff, 0.15);
    this.joyBase.fillCircle(cx, cy, 50);
    this.joyBase.lineStyle(2, 0xffffff, 0.3);
    this.joyBase.strokeCircle(cx, cy, 50);

    this.joyKnob = this.scene.add.graphics().setScrollFactor(0).setDepth(501).setAlpha(0.6);
    this.joyKnob.fillStyle(0x3b82f6, 0.8);
    this.joyKnob.fillCircle(cx, cy, 18);
  }

  private createButtons(): void {
    const cam = this.scene.cameras.main;

    this.createButton(cam.width - 70, cam.height - 90, '跳', () => this.upActive = true, () => this.upActive = false);
    this.createButton(cam.width - 150, cam.height - 70, '攻', () => this.attackActive = true, () => this.attackActive = false);
    this.createButton(cam.width - 70, cam.height - 170, '技', () => this.skillActive = true, () => this.skillActive = false);
  }

  private createButton(x: number, y: number, label: string, onDown: () => void, onUp: () => void): void {
    const circle = this.scene.add.circle(x, y, 28, 0x334155, 0.5).setScrollFactor(0).setDepth(500).setInteractive();
    this.scene.add.text(x, y, label, { fontSize: '16px', color: '#ffffff', fontFamily: 'monospace' }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    circle.on('pointerdown', (p: Phaser.Input.Pointer) => {
      circle.setFillStyle(0x475569, 0.8);
      onDown();
      p.event?.preventDefault();
    });
    circle.on('pointerup', () => {
      circle.setFillStyle(0x334155, 0.5);
      onUp();
    });
    circle.on('pointerout', () => {
      circle.setFillStyle(0x334155, 0.5);
      onUp();
    });
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x > this.scene.cameras.main.width / 2) return;
      this.joyPointerId = p.id;
      this.updateJoystick(p);
    });

    this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id === this.joyPointerId) this.updateJoystick(p);
    });

    this.scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.id === this.joyPointerId) {
        this.joyPointerId = null;
        this.leftActive = false;
        this.rightActive = false;
        this.resetKnob();
      }
    });
  }

  private updateJoystick(p: Phaser.Input.Pointer): void {
    const dx = p.x - this.joyOrigin.x;
    const dy = p.y - this.joyOrigin.y;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 35);
    const angle = Math.atan2(dy, dx);

    const kx = this.joyOrigin.x + Math.cos(angle) * dist;
    const ky = this.joyOrigin.y + Math.sin(angle) * dist;
    this.joyKnob?.clear();
    this.joyKnob?.fillStyle(0x3b82f6, 0.8);
    this.joyKnob?.fillCircle(kx, ky, 18);

    this.leftActive = dx < -10;
    this.rightActive = dx > 10;
    this.upActive = dy < -25;
  }

  private resetKnob(): void {
    this.joyKnob?.clear();
    this.joyKnob?.fillStyle(0x3b82f6, 0.8);
    this.joyKnob?.fillCircle(this.joyOrigin.x, this.joyOrigin.y, 18);
  }
}
