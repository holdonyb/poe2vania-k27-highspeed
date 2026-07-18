import Phaser from 'phaser';
import { rollDrop } from '../systems/ItemDrop';

export class Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  scene: Phaser.Scene;
  maxHp: number;
  hp: number;
  damage: number;
  speed: number;
  level: number;
  patrolDir = 1;
  stun = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, level: number) {
    this.scene = scene;
    this.level = level;
    this.maxHp = 25 + level * 10;
    this.hp = this.maxHp;
    this.damage = 8 + level * 2;
    this.speed = 40 + level * 2;

    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(20, 22);
    this.sprite.setOffset(6, 8);
    this.sprite.setBounce(0);
  }

  update(playerSprite: Phaser.Physics.Arcade.Sprite, delta: number): void {
    if (this.stun > 0) {
      this.stun -= delta / 1000;
      return;
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const dx = playerSprite.x - this.sprite.x;
    const dy = playerSprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 160 && Math.abs(dy) < 48) {
      // 追击
      const dir = Math.sign(dx);
      this.sprite.setVelocityX(dir * this.speed);
      this.sprite.setFlipX(dir < 0);
    } else {
      // 巡逻
      if (body.blocked.left || body.blocked.right) {
        this.patrolDir *= -1;
      }
      this.sprite.setVelocityX(this.patrolDir * (this.speed * 0.6));
      this.sprite.setFlipX(this.patrolDir < 0);
    }
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    this.stun = 0.15;
    this.sprite.setTint(0xffaaaa);
    this.scene.time.delayedCall(100, () => this.sprite.clearTint());

    const text = this.scene.add.text(this.sprite.x, this.sprite.y - 24, Math.floor(amount).toString(), {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.scene.tweens.add({
      targets: text,
      y: this.sprite.y - 44,
      alpha: 0,
      duration: 500,
      onComplete: () => text.destroy()
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die(): void {
    const drop = rollDrop(this.level);
    if (drop) {
      const dropSprite = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y, `drop_${drop.type}`);
      dropSprite.setData('drop', drop);
      dropSprite.setData('type', drop.type);
      (this.scene as any).drops.add(dropSprite);
    }

    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.image(this.sprite.x, this.sprite.y, 'pixel');
      p.setTint(0xef4444);
      p.setScale(1.5);
      this.scene.tweens.add({
        targets: p,
        x: this.sprite.x + (Math.random() - 0.5) * 50,
        y: this.sprite.y + (Math.random() - 0.5) * 50,
        alpha: 0,
        duration: 350,
        onComplete: () => p.destroy()
      });
    }

    this.sprite.destroy();
    const idx = (this.scene as any).enemies.indexOf(this);
    if (idx !== -1) (this.scene as any).enemies.splice(idx, 1);
  }
}
