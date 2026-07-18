import Phaser from 'phaser';
import { Gem, SUPPORT_GEMS, computeSkillStats, createGem } from '../systems/Gem';
import { Equipment, EquipSlot, computeEquipmentStats } from '../systems/Equipment';
import { PassiveTree } from '../systems/PassiveTree';

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  scene: Phaser.Scene;

  level = 1;
  xp = 0;
  xpToNext = 50;
  hp = 100;
  maxHp = 100;

  facingRight = true;
  invulnerable = false;

  gems: Gem[] = [];
  activeGemIndex = 0;
  equipment: Map<EquipSlot, Equipment> = new Map();
  passiveTree: PassiveTree = new PassiveTree();
  onLevelUp?: () => void;

  baseDamage = 12;
  attackCooldown = 0;
  skillCooldown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(18, 26);
    this.sprite.setOffset(7, 4);
    this.sprite.setDrag(800, 0);

    // 初始装备与技能
    this.equip(createGem('fireball', 1, [SUPPORT_GEMS[0]]));
  }

  equip(gem: Gem): void {
    if (this.gems.length < 3) {
      this.gems.push(gem);
    } else {
      this.gems[this.activeGemIndex] = gem;
    }
  }

  equipItem(item: Equipment): void {
    this.equipment.set(item.slot, item);
    this.recalcStats();
  }

  recalcStats(): void {
    const eqStats = computeEquipmentStats(Array.from(this.equipment.values()));
    const passive = this.passiveTree.getAllocatedMods();

    this.maxHp = eqStats.maxHp + (passive.maxHp ?? 0);
    this.hp = Math.min(this.hp, this.maxHp);
    this.baseDamage = 12 * (1 + (passive.damageMul ?? 0)) * eqStats.damageMul;
    this.sprite.setVelocityX(this.sprite.body?.velocity.x ?? 0);
  }

  get totalDamageMul(): number {
    const eqStats = computeEquipmentStats(Array.from(this.equipment.values()));
    const passive = this.passiveTree.getAllocatedMods();
    return eqStats.damageMul * (1 + (passive.damageMul ?? 0));
  }

  get moveSpeed(): number {
    const eqStats = computeEquipmentStats(Array.from(this.equipment.values()));
    const passive = this.passiveTree.getAllocatedMods();
    return 160 * eqStats.moveSpeed * (1 + (passive.moveSpeed ?? 0));
  }

  get jumpVelocity(): number {
    return -330;
  }

  get activeGem(): Gem | null {
    return this.gems[this.activeGemIndex] ?? null;
  }

  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: Record<string, Phaser.Input.Keyboard.Key>,
    time: number,
    delta: number,
    touch?: { left: boolean; right: boolean; up: boolean; attack: boolean; skill: boolean }
  ): void {
    const onGround = (this.sprite.body as Phaser.Physics.Arcade.Body).blocked.down;

    const left = cursors.left?.isDown || keys['A']?.isDown || touch?.left;
    const right = cursors.right?.isDown || keys['D']?.isDown || touch?.right;
    const up = cursors.up?.isDown || keys['W']?.isDown || touch?.up;

    // 左右移动
    if (left) {
      this.sprite.setVelocityX(-this.moveSpeed);
      this.facingRight = false;
      this.sprite.setFlipX(true);
    } else if (right) {
      this.sprite.setVelocityX(this.moveSpeed);
      this.facingRight = true;
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    // 跳跃
    if (up && onGround) {
      this.sprite.setVelocityY(this.jumpVelocity);
    }

    // 攻击
    this.attackCooldown = Math.max(0, this.attackCooldown - delta / 1000);
    const attackPressed = Phaser.Input.Keyboard.JustDown(keys['SPACE']) || (touch?.attack && this.attackCooldown <= 0);
    if (attackPressed && this.attackCooldown <= 0) {
      this.meleeAttack(time);
    }

    // 技能
    this.skillCooldown = Math.max(0, this.skillCooldown - delta / 1000);
    if ((keys['Z']?.isDown || touch?.skill) && this.activeGem) {
      this.castSkill(time);
    }

    // 切换技能
    if (Phaser.Input.Keyboard.JustDown(keys['ONE'])) this.activeGemIndex = 0;
    if (Phaser.Input.Keyboard.JustDown(keys['TWO'])) this.activeGemIndex = Math.min(1, this.gems.length - 1);
    if (Phaser.Input.Keyboard.JustDown(keys['THREE'])) this.activeGemIndex = Math.min(2, this.gems.length - 1);

    // 无敌闪烁
    if (this.invulnerable) {
      this.sprite.setAlpha(0.6 + Math.sin(time / 50) * 0.4);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  meleeAttack(_time: number): void {
    this.attackCooldown = 0.35;
    const slashX = this.sprite.x + (this.facingRight ? 24 : -24);
    const slash = this.scene.add.sprite(slashX, this.sprite.y, 'slash');
    slash.setFlipX(!this.facingRight);
    slash.setScale(1.2);
    slash.setDepth(10);

    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 120,
      onComplete: () => slash.destroy()
    });

    // 命中检测
    const enemies = (this.scene as any).enemies as Array<{ sprite: Phaser.Physics.Arcade.Sprite; takeDamage: (d: number) => void }>;
    if (enemies) {
      for (const enemy of enemies) {
        const dx = enemy.sprite.x - this.sprite.x;
        const dy = enemy.sprite.y - this.sprite.y;
        if (Math.abs(dx) < 48 && Math.abs(dy) < 32) {
          if ((this.facingRight && dx > 0) || (!this.facingRight && dx < 0)) {
            enemy.takeDamage(this.baseDamage * this.totalDamageMul);
            this.spawnHitParticles(enemy.sprite.x, enemy.sprite.y);
          }
        }
      }
    }
  }

  castSkill(time: number): void {
    const gem = this.activeGem;
    if (!gem) return;
    const stats = computeSkillStats(gem);
    if (time - gem.lastUsed < stats.cooldown * 1000) return;
    gem.lastUsed = time;
    this.skillCooldown = stats.cooldown;

    const direction = this.facingRight ? 1 : -1;
    const startX = this.sprite.x + direction * 18;
    const startY = this.sprite.y - 2;

    for (let i = 0; i < stats.projectileCount; i++) {
      const spread = stats.projectileCount > 1 ? (i - (stats.projectileCount - 1) / 2) * 0.12 : 0;
      const bullet = this.scene.physics.add.sprite(startX, startY + i * 2, 'bullet');
      const speed = 320;
      const angle = spread;
      bullet.setVelocity(Math.cos(angle) * speed * direction, Math.sin(angle) * speed * 0.2);
      bullet.setData('damage', stats.damage * this.totalDamageMul);
      bullet.setData('pierce', stats.pierce);
      bullet.setData('chain', stats.chain);
      (this.scene as any).playerProjectiles.add(bullet);

      this.scene.time.delayedCall(1200, () => {
        if (bullet.active) bullet.destroy();
      });
    }
  }

  spawnHitParticles(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const p = this.scene.add.image(x, y, 'pixel');
      p.setTint(0xff5555);
      p.setScale(1 + Math.random());
      this.scene.tweens.add({
        targets: p,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        alpha: 0,
        duration: 250,
        onComplete: () => p.destroy()
      });
    }
  }

  takeDamage(amount: number): void {
    if (this.invulnerable) return;
    this.hp -= amount;
    this.invulnerable = true;
    this.scene.time.delayedCall(600, () => this.invulnerable = false);
    this.sprite.setVelocityY(-120);
    this.sprite.setVelocityX(this.facingRight ? -120 : 120);
  }

  heal(amount: number): void {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  gainXp(amount: number): void {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.25);
      this.passiveTree.points += 1;
      this.maxHp += 5;
      this.hp = Math.min(this.hp + 15, this.maxHp);
      this.showLevelUp();
      this.onLevelUp?.();
    }
  }

  showLevelUp(): void {
    // 屏幕闪烁
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0xfbbf24,
      0.5
    ).setScrollFactor(0).setDepth(300);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });

    // 升级大字
    const cam = this.scene.cameras.main;
    const bigText = this.scene.add.text(cam.width / 2, cam.height / 2, 'LEVEL UP', {
      fontSize: '40px', color: '#fbbf24', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.scene.tweens.add({
      targets: bigText,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 1200,
      onComplete: () => bigText.destroy()
    });

    // 头顶提示
    const text = this.scene.add.text(this.sprite.x, this.sprite.y - 40, `升级！等级 ${this.level}`, {
      fontSize: '14px', color: '#fbbf24', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(302);
    this.scene.tweens.add({
      targets: text,
      y: this.sprite.y - 80,
      alpha: 0,
      duration: 1200,
      onComplete: () => text.destroy()
    });

    // 粒子
    for (let i = 0; i < 12; i++) {
      const p = this.scene.add.image(this.sprite.x, this.sprite.y, 'pixel');
      p.setTint(0xfbbf24);
      p.setScale(2);
      this.scene.tweens.add({
        targets: p,
        x: this.sprite.x + (Math.random() - 0.5) * 100,
        y: this.sprite.y + (Math.random() - 0.5) * 100,
        alpha: 0,
        duration: 800,
        onComplete: () => p.destroy()
      });
    }
  }
}
