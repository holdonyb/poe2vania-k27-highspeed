import Phaser from 'phaser';
import { rollDrop, DropItem } from '../systems/ItemDrop';

export type EnemyType = 'normal' | 'ranged' | 'flying' | 'elite';

export class Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  scene: Phaser.Scene;
  maxHp: number;
  hp: number;
  damage: number;
  speed: number;
  level: number;
  type: EnemyType;
  patrolDir = 1;
  stun = 0;
  shootTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, level: number, type: EnemyType = 'normal') {
    this.scene = scene;
    this.level = level;
    this.type = type;

    const mul = type === 'elite' ? 2.5 : type === 'ranged' ? 0.8 : 1;
    this.maxHp = (25 + level * 10) * mul;
    this.hp = this.maxHp;
    this.damage = (8 + level * 2) * (type === 'elite' ? 1.5 : 1);
    this.speed = type === 'flying' ? 60 + level * 3 : 40 + level * 2;

    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
    this.sprite.setCollideWorldBounds(true);

    if (type === 'ranged') {
      this.sprite.setTint(0x22c55e);
      this.sprite.setSize(18, 20);
    } else if (type === 'flying') {
      this.sprite.setTint(0xa855f7);
      this.sprite.setSize(18, 18);
      (this.sprite.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    } else if (type === 'elite') {
      this.sprite.setTint(0xf59e0b);
      this.sprite.setScale(1.3);
      this.sprite.setSize(26, 28);
    } else {
      this.sprite.setSize(20, 22);
      this.sprite.setOffset(6, 8);
    }
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
    const dir = Math.sign(dx);

    if (this.type === 'flying') {
      // 飞行怪：空中追击
      if (dist < 200) {
        this.sprite.setVelocity(dir * this.speed, (dy > 0 ? 1 : -1) * this.speed * 0.5);
        this.sprite.setFlipX(dir < 0);
      }
      return;
    }

    if (this.type === 'ranged') {
      // 远程怪：保持距离并射击
      this.shootTimer += delta / 1000;
      if (dist < 220 && dist > 100) {
        this.sprite.setVelocityX(dir * this.speed * 0.5);
        this.sprite.setFlipX(dir < 0);
      } else if (dist <= 100) {
        this.sprite.setVelocityX(-dir * this.speed);
      } else {
        this.sprite.setVelocityX(0);
      }
      if (this.shootTimer > 2.5 && dist < 240) {
        this.shootTimer = 0;
        this.shoot(playerSprite);
      }
      return;
    }

    if (dist < 160 && Math.abs(dy) < 48) {
      // 追击
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

  shoot(playerSprite: Phaser.Physics.Arcade.Sprite): void {
    const bullet = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y, 'bullet');
    bullet.setTint(0x22c55e);
    const angle = Math.atan2(playerSprite.y - this.sprite.y, playerSprite.x - this.sprite.x);
    bullet.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180);
    bullet.setData('damage', this.damage * 0.7);
    (this.scene as any).enemyProjectiles?.add(bullet);
    this.scene.time.delayedCall(2000, () => bullet.destroy());
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

  getDropLabel(drop: DropItem): string {
    switch (drop.type) {
      case 'hp': return `生命 +${drop.value}`;
      case 'xp': return `经验 +${drop.value}`;
      case 'gem': return drop.gem ? drop.gem.name : '技能宝石';
      case 'equip': return drop.equipment ? drop.equipment.name : '装备';
    }
  }

  die(): void {
    const drop = rollDrop(this.level);
    if (drop) {
      const dropSprite = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y, `drop_${drop.type}`);
      dropSprite.setData('drop', drop);
      dropSprite.setData('type', drop.type);
      dropSprite.setBounce(0.4);
      dropSprite.setVelocity((Math.random() - 0.5) * 80, -80);
      (this.scene as any).drops.add(dropSprite);

      const label = this.getDropLabel(drop);
      const text = this.scene.add.text(this.sprite.x, this.sprite.y - 20, label, {
        fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', backgroundColor: '#00000088', padding: { x: 2, y: 1 }
      }).setOrigin(0.5).setDepth(50);
      this.scene.tweens.add({
        targets: text,
        y: this.sprite.y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => text.destroy()
      });
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
