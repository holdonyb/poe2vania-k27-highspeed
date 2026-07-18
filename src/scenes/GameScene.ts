import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { HUD } from '../ui/HUD';
import { TouchControls } from '../ui/TouchControls';
import { DropItem } from '../systems/ItemDrop';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemies: Enemy[] = [];
  drops!: Phaser.Physics.Arcade.Group;
  playerProjectiles!: Phaser.Physics.Arcade.Group;
  hud!: HUD;
  touchControls?: TouchControls;
  useTouch = false;

  platforms!: Phaser.Physics.Arcade.StaticGroup;
  walls!: Phaser.Physics.Arcade.StaticGroup;

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  keys: Record<string, Phaser.Input.Keyboard.Key> = {};

  spawnTimer = 0;
  enemyLevel = 1;
  wave = 1;
  gameOver = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, 1600, 600);

    // 背景
    this.add.tileSprite(800, 300, 1600, 600, 'wall').setAlpha(0.4);

    // 地图
    this.createMap();

    // 玩家
    this.player = new Player(this, 100, 400);
    this.player.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.player.sprite, this.platforms);
    this.physics.add.collider(this.player.sprite, this.walls);

    // 输入
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys['SPACE'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keys['Z'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keys['ONE'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keys['TWO'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keys['THREE'] = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

    // 掉落物和子弹
    this.drops = this.physics.add.group({ allowGravity: true, bounceY: 0.3 });
    this.playerProjectiles = this.physics.add.group();

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
    this.cameras.main.setBounds(0, 0, 1600, 600);
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
    this.spawnEnemies(3);

    // 操作提示
    const hint = this.useTouch
      ? '左侧摇杆移动/跳跃  右侧按钮攻击/技能'
      : 'WASD/方向键移动跳跃  空格攻击  Z技能  123切换  P天赋  I装备';
    this.add.text(10, 430, hint, {
      fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100);
  }

  createMap(): void {
    this.platforms = this.physics.add.staticGroup();
    this.walls = this.physics.add.staticGroup();

    // 地面
    for (let x = 0; x < 1600; x += 32) {
      this.platforms.create(x + 16, 584, 'ground').setScale(1).refreshBody();
    }

    // 平台布局（恶魔城式）
    const platformData: [number, number, number][] = [
      [200, 480, 4], [420, 400, 3], [620, 320, 4], [820, 420, 3],
      [1000, 340, 5], [1240, 260, 3], [1400, 400, 3], [150, 280, 2],
      [360, 200, 3], [720, 160, 4], [1120, 180, 3]
    ];

    for (const [px, py, count] of platformData) {
      for (let i = 0; i < count; i++) {
        this.platforms.create(px + i * 32, py, 'platform').setScale(1).refreshBody();
      }
    }

    // 左右墙
    for (let y = 0; y < 600; y += 32) {
      this.walls.create(-16, y, 'wall').refreshBody();
      this.walls.create(1616, y, 'wall').refreshBody();
    }
  }

  spawnEnemies(count: number): void {
    for (let i = 0; i < count; i++) {
      const x = 200 + Math.random() * 1200;
      const y = 100 + Math.random() * 300;
      const enemy = new Enemy(this, x, y, this.enemyLevel);
      this.enemies.push(enemy);
      this.physics.add.collider(enemy.sprite, this.platforms);
      this.physics.add.collider(enemy.sprite, this.walls);
    }
  }

  applyDrop(drop: DropItem): void {
    switch (drop.type) {
      case 'hp':
        this.player.heal(drop.value ?? 15);
        break;
      case 'xp':
        this.player.gainXp(drop.value ?? 10);
        break;
      case 'gem':
        if (drop.gem) this.player.equip(drop.gem);
        break;
      case 'equip':
        if (drop.equipment) this.player.equipItem(drop.equipment);
        break;
    }
  }

  update(time: number, delta: number): void {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R))) {
        this.scene.restart();
      }
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

    // 敌人刷新
    this.spawnTimer += delta / 1000;
    if (this.enemies.length === 0 || this.spawnTimer > 12) {
      this.wave++;
      this.enemyLevel = 1 + Math.floor(this.wave / 2);
      this.spawnEnemies(2 + Math.min(4, Math.floor(this.wave / 2)));
      this.spawnTimer = 0;
    }

    // 掉落物出界清理
    this.drops.children.each((child) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.y > 600) sprite.destroy();
      return true;
    });

    // 死亡检测
    if (this.player.hp <= 0) {
      this.gameOver = true;
      this.add.rectangle(400, 225, 800, 450, 0x000000, 0.8).setScrollFactor(0).setDepth(300);
      this.add.text(400, 225, '你死了\n按 R 重新开始', {
        fontSize: '24px', color: '#ef4444', fontFamily: 'monospace', align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    }

    // 掉出地图
    if (this.player.sprite.y > 600) {
      this.player.takeDamage(20);
      this.player.sprite.setPosition(100, 400);
      this.player.sprite.setVelocity(0, 0);
    }
  }
}
