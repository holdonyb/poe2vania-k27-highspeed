import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy, EnemyType } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { HUD } from '../ui/HUD';
import { TouchControls } from '../ui/TouchControls';
import { TutorialOverlay } from '../ui/TutorialOverlay';
import { DropItem } from '../systems/ItemDrop';
import { Equipment, computeEquipmentStats } from '../systems/Equipment';
import { SaveManager } from '../systems/SaveManager';
import { getLevel, LevelConfig } from '../systems/LevelData';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemies: (Enemy | Boss)[] = [];
  drops!: Phaser.Physics.Arcade.Group;
  playerProjectiles!: Phaser.Physics.Arcade.Group;
  enemyProjectiles!: Phaser.Physics.Arcade.Group;
  hud!: HUD;
  touchControls?: TouchControls;
  useTouch = false;

  platforms!: Phaser.Physics.Arcade.StaticGroup;
  walls!: Phaser.Physics.Arcade.StaticGroup;

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  keys: Record<string, Phaser.Input.Keyboard.Key> = {};

  levelConfig!: LevelConfig;
  levelCompleted = false;
  exitPortal?: Phaser.GameObjects.Container;
  paused = false;
  pausePanel?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { continueGame?: boolean; levelId?: string }): void {
    if (data.continueGame) {
      const save = SaveManager.load();
      const levelId = save?.progress.currentLevelId ?? 'level_1';
      this.levelConfig = getLevel(levelId)!;
    } else {
      this.levelConfig = getLevel(data.levelId ?? 'level_1')!;
    }
  }

  create(): void {
    const cfg = this.levelConfig;
    this.physics.world.setBounds(0, 0, cfg.width, cfg.height);

    // 背景
    this.add.tileSprite(cfg.width / 2, cfg.height / 2, cfg.width, cfg.height, 'wall').setAlpha(0.4);

    // 地图
    this.createMap(cfg);

    // 玩家
    this.player = new Player(this, cfg.playerStart.x, cfg.playerStart.y);
    this.player.onLevelUp = () => this.saveGame();
    if (this.scene.settings.data && (this.scene.settings.data as any).continueGame) {
      const save = SaveManager.load();
      if (save) {
        SaveManager.applyToPlayer(this.player, save);
        this.player.recalcStats();
      }
    }
    this.player.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.player.sprite, this.platforms);
    this.physics.add.collider(this.player.sprite, this.walls);

    // 输入
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys['SPACE'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keys['Z'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keys['W'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keys['A'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keys['S'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keys['D'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keys['ONE'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keys['TWO'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keys['THREE'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.keys['ESC'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // 掉落物和子弹
    this.drops = this.physics.add.group({ allowGravity: true, bounceY: 0.3 });
    this.playerProjectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();

    // 碰撞：子弹 vs 敌人
    this.physics.add.overlap(this.playerProjectiles, this.enemies.map(e => e.sprite), (proj, enemySprite) => {
      const enemy = this.enemies.find(e => e.sprite === enemySprite);
      if (!enemy) return;
      const damage = (proj as Phaser.Physics.Arcade.Sprite).getData('damage') as number ?? 10;
      enemy.takeDamage(damage);

      const pierce = (proj as Phaser.Physics.Arcade.Sprite).getData('pierce') as boolean;
      if (!pierce) {
        (proj as Phaser.Physics.Arcade.Sprite).destroy();
      }
    });

    // 碰撞：子弹 vs 平台
    this.physics.add.collider(this.playerProjectiles, this.platforms, (proj) => {
      (proj as Phaser.Physics.Arcade.Sprite).destroy();
    });
    this.physics.add.collider(this.enemyProjectiles, this.platforms, (proj) => {
      (proj as Phaser.Physics.Arcade.Sprite).destroy();
    });

    // 碰撞：玩家 vs 敌人子弹
    this.physics.add.overlap(this.player.sprite, this.enemyProjectiles, (_, proj) => {
      const damage = (proj as Phaser.Physics.Arcade.Sprite).getData('damage') as number ?? 10;
      this.player.takeDamage(damage);
      (proj as Phaser.Physics.Arcade.Sprite).destroy();
    });

    // 碰撞：玩家 vs 敌人
    this.physics.add.overlap(this.player.sprite, this.enemies.map(e => e.sprite), (_, enemySprite) => {
      const enemy = this.enemies.find(e => e.sprite === enemySprite);
      if (enemy) this.player.takeDamage(enemy.damage);
    });

    // 拾取掉落
    this.physics.add.overlap(this.player.sprite, this.drops, (_, dropSprite) => {
      const drop = (dropSprite as Phaser.Physics.Arcade.Sprite).getData('drop') as DropItem;
      if (!drop) return;
      this.applyDrop(drop);
      (dropSprite as Phaser.Physics.Arcade.Sprite).destroy();
    });

    // 相机
    this.cameras.main.setBounds(0, 0, cfg.width, cfg.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.8);

    // HUD
    this.hud = new HUD(this, this.player);

    // 移动端触控
    this.useTouch = this.sys.game.device.os.android || this.sys.game.device.os.iOS || this.sys.game.device.os.windowsPhone || window.matchMedia('(pointer: coarse)').matches;
    if (this.useTouch) {
      this.touchControls = new TouchControls(this);
    }

    // 初始敌人
    this.spawnLevelEnemies(cfg);

    // 操作提示
    const hint = this.useTouch
      ? '左侧摇杆移动/跳跃  右侧按钮攻击/技能'
      : 'WASD/方向键移动跳跃  空格攻击  Z技能  123切换  P天赋  I装备  ESC菜单';
    this.add.text(10, 430, hint, {
      fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100);

    this.add.text(10, 10, `关卡：${cfg.name}`, {
      fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100);

    // 新手教程（仅首次）
    const tutorialKey = 'poe2vania_tutorial_shown';
    if (!localStorage.getItem(tutorialKey)) {
      this.physics.world.pause();
      this.tweens.pauseAll();
      TutorialOverlay.show(this, () => {
        localStorage.setItem(tutorialKey, '1');
        this.physics.world.resume();
        this.tweens.resumeAll();
      });
    }
  }

  createMap(cfg: LevelConfig): void {
    this.platforms = this.physics.add.staticGroup();
    this.walls = this.physics.add.staticGroup();

    // 地面
    for (let x = 0; x < cfg.width; x += 32) {
      this.platforms.create(x + 16, cfg.height - 16, 'ground').setScale(1).refreshBody();
    }

    // 平台
    for (const [px, py, count] of cfg.platformData) {
      for (let i = 0; i < count; i++) {
        this.platforms.create(px + i * 32, py, 'platform').setScale(1).refreshBody();
      }
    }

    // 左右墙
    for (let y = 0; y < cfg.height; y += 32) {
      this.walls.create(-16, y, 'wall').refreshBody();
      this.walls.create(cfg.width + 16, y, 'wall').refreshBody();
    }
  }

  spawnLevelEnemies(cfg: LevelConfig): void {
    for (const spawn of cfg.enemySpawns) {
      const enemy = new Enemy(this, spawn.x, spawn.y, spawn.level, spawn.type as EnemyType);
      this.enemies.push(enemy);
      this.physics.add.collider(enemy.sprite, this.platforms);
      this.physics.add.collider(enemy.sprite, this.walls);
    }

    if (cfg.isBoss && cfg.boss) {
      const boss = new Boss(this, cfg.boss.x, cfg.boss.y, cfg.boss.level, cfg.boss.name);
      this.enemies.push(boss);
      this.physics.add.collider(boss.sprite, this.platforms);
      this.physics.add.collider(boss.sprite, this.walls);

      this.add.text(cfg.boss.x, cfg.boss.y - 100, cfg.boss.name, {
        fontSize: '16px', color: '#ef4444', fontFamily: 'monospace'
      }).setOrigin(0.5).setDepth(60);
    }
  }

  applyDrop(drop: DropItem): void {
    let message = '';
    switch (drop.type) {
      case 'hp':
        this.player.heal(drop.value ?? 15);
        message = `生命 +${drop.value ?? 15}`;
        break;
      case 'xp':
        this.player.gainXp(drop.value ?? 10);
        message = `经验 +${drop.value ?? 10}`;
        break;
      case 'gem':
        if (drop.gem) {
          this.player.equip(drop.gem);
          message = `获得技能：${drop.gem.name}`;
        }
        break;
      case 'equip':
        if (drop.equipment) {
          this.showEquipCompare(drop.equipment);
          this.player.equipItem(drop.equipment);
          this.saveGame();
        }
        break;
    }
    if (message) this.showToast(message);
  }

  showEquipCompare(newItem: Equipment): void {
    const current = this.player.equipment.get(newItem.slot);
    const rarityMap = { normal: '普通', magic: '魔法', rare: '稀有', unique: '传奇' };
    const oldStats = current ? computeEquipmentStats([current]) : computeEquipmentStats([]);
    const newStats = computeEquipmentStats([newItem]);

    const lines = [
      `获得 [${rarityMap[newItem.rarity]}] ${newItem.name}`,
      `生命: ${oldStats.maxHp.toFixed(0)} → ${newStats.maxHp.toFixed(0)}`,
      `伤害: ${(oldStats.damageMul * 100).toFixed(0)}% → ${(newStats.damageMul * 100).toFixed(0)}%`,
      `攻速: ${(oldStats.attackSpeed * 100).toFixed(0)}% → ${(newStats.attackSpeed * 100).toFixed(0)}%`,
      `移速: ${(oldStats.moveSpeed * 100).toFixed(0)}% → ${(newStats.moveSpeed * 100).toFixed(0)}%`
    ];

    const cam = this.cameras.main;
    const text = this.add.text(cam.width / 2, cam.height - 100, lines.join('\n'), {
      fontSize: '11px', color: '#e2e8f0', fontFamily: 'monospace', backgroundColor: '#000000cc', padding: { x: 10, y: 6 }, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150);
    this.tweens.add({
      targets: text,
      y: cam.height - 130,
      alpha: 0,
      duration: 2500,
      onComplete: () => text.destroy()
    });
  }

  showToast(message: string): void {
    const cam = this.cameras.main;
    const text = this.add.text(cam.width / 2, cam.height - 80, message, {
      fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace', backgroundColor: '#000000aa', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150);
    this.tweens.add({
      targets: text,
      y: cam.height - 110,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }

  saveGame(): void {
    SaveManager.save(this.player, {
      currentLevelId: this.levelConfig.id,
      unlockedLevels: this.getUnlockedLevels(),
      gold: 0
    });
  }

  getUnlockedLevels(): string[] {
    const save = SaveManager.load();
    const base = save?.progress.unlockedLevels ?? ['level_1'];
    if (this.levelConfig.nextLevelId && !base.includes(this.levelConfig.nextLevelId)) {
      base.push(this.levelConfig.nextLevelId);
    }
    return base;
  }

  spawnExitPortal(): void {
    if (this.exitPortal || this.levelCompleted) return;
    this.levelCompleted = true;

    const x = this.levelConfig.width - 80;
    const y = this.levelConfig.height - 80;
    this.exitPortal = this.add.container(x, y);

    const ring = this.add.circle(0, 0, 24, 0x3b82f6, 0.4);
    const core = this.add.circle(0, 0, 12, 0x60a5fa);
    const label = this.add.text(0, -40, '出口 →', {
      fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.exitPortal.add([ring, core, label]);
    this.exitPortal.setDepth(50);

    this.tweens.add({
      targets: ring,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // 创建触发区
    const zone = this.add.zone(x, y, 60, 80);
    this.physics.world.enable(zone);
    (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.physics.add.overlap(this.player.sprite, zone, () => this.completeLevel());
  }

  openPauseMenu(): void {
    this.paused = true;
    this.physics.world.pause();
    this.tweens.pauseAll();

    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    this.pausePanel = this.add.container(0, 0).setScrollFactor(0).setDepth(400);
    this.pausePanel.add(this.add.rectangle(cx, cy, 400, 260, 0x0f172a, 0.95).setStrokeStyle(2, 0x334155));
    this.pausePanel.add(this.add.text(cx, cy - 80, '暂停', {
      fontSize: '24px', color: '#fbbf24', fontFamily: 'monospace'
    }).setOrigin(0.5));

    this.createPauseButton(cx, cy - 20, '继续游戏', () => this.resumeGame());
    this.createPauseButton(cx, cy + 40, '保存并返回主菜单', () => {
      this.saveGame();
      this.scene.start('MenuScene');
    });
  }

  createPauseButton(x: number, y: number, label: string, onClick: () => void): void {
    const rect = this.add.rectangle(x, y, 220, 40, 0x3b82f6).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(0x60a5fa));
    rect.on('pointerout', () => rect.setFillStyle(0x3b82f6));
    rect.on('pointerdown', onClick);
    this.pausePanel?.add([rect, text]);
  }

  resumeGame(): void {
    this.paused = false;
    this.physics.world.resume();
    this.tweens.resumeAll();
    this.pausePanel?.destroy();
    this.pausePanel = undefined;
  }

  completeLevel(): void {
    this.saveGame();
    if (this.levelConfig.nextLevelId) {
      this.scene.start('LevelSelectScene');
    } else {
      // 最终通关
      this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 800, 450, 0x000000, 0.9).setScrollFactor(0).setDepth(400);
      this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '通关！\n你击败了恶魔城核心', {
        fontSize: '24px', color: '#fbbf24', fontFamily: 'monospace', align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
      this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }
  }

  update(time: number, delta: number): void {
    if (this.paused) return;

    if (this.player.hp <= 0) {
      this.saveGame();
      this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 800, 450, 0x000000, 0.8).setScrollFactor(0).setDepth(300);
      this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, '你死了\n按 R 重新开始\n按 ESC 返回菜单', {
        fontSize: '24px', color: '#ef4444', fontFamily: 'monospace', align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R))) {
        this.scene.restart();
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys['ESC'])) {
      if (this.paused) this.resumeGame();
      else this.openPauseMenu();
      return;
    }

    const touch = this.touchControls ? {
      left: this.touchControls.leftActive,
      right: this.touchControls.rightActive,
      up: this.touchControls.upActive,
      attack: this.touchControls.attackActive,
      skill: this.touchControls.skillActive
    } : undefined;
    this.player.update(this.cursors, this.keys, time, delta, touch);

    for (const enemy of this.enemies) {
      enemy.update(this.player.sprite, delta);
    }

    this.hud.update();

    // 关卡完成检测
    if (!this.levelCompleted) {
      const nonBossAlive = this.enemies.filter(e => !(e instanceof Boss)).length;
      const bossAlive = this.enemies.some(e => e instanceof Boss);
      if (this.levelConfig.isBoss && !bossAlive && this.enemies.length === 0) {
        this.spawnExitPortal();
      } else if (!this.levelConfig.isBoss && nonBossAlive === 0) {
        this.spawnExitPortal();
      }
    }

    // 掉落物出界清理
    this.drops.children.each((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.y > this.levelConfig.height + 50) sprite.destroy();
      return true;
    });

    // 掉出地图
    if (this.player.sprite.y > this.levelConfig.height + 50) {
      this.player.takeDamage(20);
      this.player.sprite.setPosition(this.levelConfig.playerStart.x, this.levelConfig.playerStart.y);
      this.player.sprite.setVelocity(0, 0);
    }
  }
}
