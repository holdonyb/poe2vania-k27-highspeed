import Phaser from 'phaser';
import { SaveManager } from '../systems/SaveManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.rectangle(cx, cy, 800, 450, 0x0f172a).setScrollFactor(0);
    this.add.text(cx, 80, '流放恶魔城', {
      fontSize: '42px', color: '#fbbf24', fontFamily: 'monospace'
    }).setOrigin(0.5).setScrollFactor(0);
    this.add.text(cx, 135, 'POE2vania · k2.7 highspeed', {
      fontSize: '14px', color: '#64748b', fontFamily: 'monospace'
    }).setOrigin(0.5).setScrollFactor(0);

    const hasSave = SaveManager.hasSave();

    const buttons: { label: string; y: number; onClick: () => void; disabled?: boolean }[] = [
      {
        label: hasSave ? '继续游戏' : '继续游戏（无存档）',
        y: cy - 30,
        disabled: !hasSave,
        onClick: () => {
          this.scene.start('GameScene', { continueGame: true });
        }
      },
      {
        label: '新游戏',
        y: cy + 30,
        onClick: () => {
          SaveManager.clear();
          this.scene.start('LevelSelectScene', { continueGame: false });
        }
      },
      {
        label: '操作说明',
        y: cy + 90,
        onClick: () => this.showHelp()
      }
    ];

    for (const btn of buttons) {
      this.createButton(cx, btn.y, btn.label, btn.onClick, btn.disabled);
    }
  }

  createButton(x: number, y: number, label: string, onClick: () => void, disabled = false): void {
    const bgColor = disabled ? '#334155' : '#3b82f6';
    const text = this.add.text(x, y, label, {
      fontSize: '14px', color: disabled ? '#94a3b8' : '#ffffff', fontFamily: 'monospace',
      backgroundColor: bgColor, padding: { x: 50, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0);

    if (disabled) return;

    text.setInteractive({ useHandCursor: true });
    text.on('pointerover', () => text.setBackgroundColor('#60a5fa'));
    text.on('pointerout', () => text.setBackgroundColor(bgColor));
    text.on('pointerdown', () => {
      text.setBackgroundColor('#1d4ed8');
      onClick();
    });
  }

  showHelp(): void {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    const panel = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    panel.add(this.add.rectangle(cx, cy, 500, 280, 0x0f172a, 0.98).setStrokeStyle(2, 0x334155));

    const helpText = [
      '电脑：',
      '  WASD / 方向键：移动、跳跃',
      '  空格：近战攻击',
      '  Z：释放当前技能',
      '  1/2/3：切换技能',
      '  P：天赋树    I：装备栏',
      '',
      '手机：左侧摇杆移动/跳跃，右侧按钮攻击/技能',
      '',
      '目标：闯关、打怪、升级、点天赋、换装备。'
    ].join('\n');

    panel.add(this.add.text(cx, cy - 20, helpText, {
      fontSize: '11px', color: '#e2e8f0', fontFamily: 'monospace', lineSpacing: 6
    }).setOrigin(0.5));

    const close = this.add.text(cx, cy + 110, '关闭', {
      fontSize: '12px', color: '#ef4444', fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => panel.destroy());
    panel.add(close);
  }
}
