import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Boss extends Enemy {
  name: string;
  phaseTimer = 0;
  attackTimer = 0;
  jumpTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, level: number, name: string) {
    super(scene, x, y, level);
    this.name = name;
    this.maxHp = 400 + level * 120;
    this.hp = this.maxHp;
    this.damage = 18 + level * 4;
    this.speed = 50;

    this.sprite.setScale(1.6);
    this.sprite.setTint(0x8b0000);
    this.sprite.setSize(32, 36);
    this.sprite.setOffset(0, -2);

    // Boss 血条背景
    const barW = 300;
    const barBg = scene.add.rectangle(x, y - 60, barW, 12, 0x000000, 0.8).setDepth(60);
    const bar = scene.add.rectangle(x - barW / 2, y - 60, barW, 12, 0xef4444).setOrigin(0, 0.5).setDepth(61);
    this.sprite.setData('bossBar', bar);
    this.sprite.setData('bossBarBg', barBg);
  }

  update(playerSprite: Phaser.Physics.Arcade.Sprite, delta: number): void {
    if (this.stun > 0) {
      this.stun -= delta / 1000;
      return;
    }

    this.phaseTimer += delta / 1000;
    this.attackTimer += delta / 1000;
    this.jumpTimer += delta / 1000;

    const dx = playerSprite.x - this.sprite.x;
    const dy = playerSprite.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 追击
    if (dist < 220) {
      const dir = Math.sign(dx);
      this.sprite.setVelocityX(dir * this.speed);
      this.sprite.setFlipX(dir < 0);
    } else {
      this.sprite.setVelocityX(0);
    }

    // 跳跃砸地
    if (this.jumpTimer > 4 && Math.abs(dx) < 120) {
      this.jumpTimer = 0;
      this.sprite.setVelocityY(-420);
    }

    // 远程弹幕
    if (this.attackTimer > 2.5) {
      this.attackTimer = 0;
      this.shootProjectiles(playerSprite);
    }

    // 更新血条位置
    const bar = this.sprite.getData('bossBar') as Phaser.GameObjects.Rectangle;
    const barBg = this.sprite.getData('bossBarBg') as Phaser.GameObjects.Rectangle;
    if (bar && barBg) {
      barBg.setPosition(this.sprite.x, this.sprite.y - 70);
      const ratio = Math.max(0, this.hp / this.maxHp);
      bar.setPosition(this.sprite.x - 150, this.sprite.y - 70);
      bar.width = 300 * ratio;
    }
  }

  shootProjectiles(playerSprite: Phaser.Physics.Arcade.Sprite): void {
    const angle = Math.atan2(playerSprite.y - this.sprite.y, playerSprite.x - this.sprite.x);
    for (let i = -1; i <= 1; i++) {
      const bullet = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y, 'bullet');
      bullet.setTint(0xff0000);
      const a = angle + i * 0.25;
      bullet.setVelocity(Math.cos(a) * 200, Math.sin(a) * 200);
      bullet.setData('damage', this.damage);
      (this.scene as any).enemyProjectiles.add(bullet);
      this.scene.time.delayedCall(2000, () => bullet.destroy());
    }
  }

  die(): void {
    const bar = this.sprite.getData('bossBar') as Phaser.GameObjects.Rectangle;
    const barBg = this.sprite.getData('bossBarBg') as Phaser.GameObjects.Rectangle;
    bar?.destroy();
    barBg?.destroy();

    // Boss 死亡大爆
    for (let i = 0; i < 20; i++) {
      const p = this.scene.add.image(this.sprite.x, this.sprite.y, 'pixel');
      p.setTint(0xff0000);
      p.setScale(2);
      this.scene.tweens.add({
        targets: p,
        x: this.sprite.x + (Math.random() - 0.5) * 120,
        y: this.sprite.y + (Math.random() - 0.5) * 120,
        alpha: 0,
        duration: 600,
        onComplete: () => p.destroy()
      });
    }

    super.die();
  }
}
