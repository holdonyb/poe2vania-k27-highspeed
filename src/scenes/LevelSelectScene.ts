import Phaser from 'phaser';
import { LEVELS, LevelConfig } from '../systems/LevelData';
import { SaveManager } from '../systems/SaveManager';

export class LevelSelectScene extends Phaser.Scene {
  unlockedLevels: string[] = ['level_1'];

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.rectangle(cx, cy, 800, 450, 0x0f172a).setScrollFactor(0);
    this.add.text(cx, 50, '选择关卡', {
      fontSize: '28px', color: '#fbbf24', fontFamily: 'monospace'
    }).setOrigin(0.5).setScrollFactor(0);

    const save = SaveManager.load();
    if (save) {
      this.unlockedLevels = save.progress.unlockedLevels;
    }

    let x = 120;
    let y = 180;
    for (const level of LEVELS) {
      const unlocked = this.unlockedLevels.includes(level.id);
      this.createLevelNode(x, y, level, unlocked);
      x += 180;
      if (x > 680) {
        x = 120;
        y += 140;
      }
    }

    const back = this.add.text(60, 400, '< 返回主菜单', {
      fontSize: '14px', color: '#94a3b8', fontFamily: 'monospace'
    }).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  createLevelNode(x: number, y: number, level: LevelConfig, unlocked: boolean): void {
    const color = level.isBoss ? 0xef4444 : (unlocked ? 0x3b82f6 : 0x334155);
    const circle = this.add.circle(x, y, 36, color, unlocked ? 1 : 0.4).setScrollFactor(0);
    if (unlocked) circle.setInteractive({ useHandCursor: true });

    const label = level.isBoss ? 'BOSS' : level.name;
    this.add.text(x, y, label, {
      fontSize: '11px', color: unlocked ? '#ffffff' : '#64748b', fontFamily: 'monospace', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    if (unlocked) {
      circle.on('pointerover', () => circle.setFillStyle(0x60a5fa));
      circle.on('pointerout', () => circle.setFillStyle(color));
      circle.on('pointerdown', () => {
        this.scene.start('GameScene', { levelId: level.id });
      });
    }
  }
}
