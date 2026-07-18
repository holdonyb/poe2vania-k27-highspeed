import Phaser from 'phaser';

export class TutorialOverlay {
  static show(scene: Phaser.Scene, onComplete: () => void): void {
    const cx = scene.cameras.main.width / 2;
    const cy = scene.cameras.main.height / 2;
    const panel = scene.add.container(0, 0).setScrollFactor(0).setDepth(500);

    panel.add(scene.add.rectangle(cx, cy, 700, 380, 0x0f172a, 0.98).setStrokeStyle(2, 0x334155));
    panel.add(scene.add.text(cx, 70, '新手教程', {
      fontSize: '24px', color: '#fbbf24', fontFamily: 'monospace'
    }).setOrigin(0.5));

    const isTouch = scene.sys.game.device.os.android || scene.sys.game.device.os.iOS || scene.sys.game.device.os.windowsPhone || window.matchMedia('(pointer: coarse)').matches;

    const content = isTouch ? [
      '左侧摇杆：左右移动，向上推跳跃',
      '右侧「攻」按钮：近战攻击',
      '右侧「技」按钮：释放当前技能',
      '右侧「跳」按钮：跳跃',
      '',
      '击杀敌人获得经验和装备',
      '升级后按 P 打开天赋树加点',
      '按 I 查看装备栏',
      '到达关卡右侧出口进入下一关'
    ] : [
      'WASD / 方向键：移动、跳跃',
      '空格：近战攻击',
      'Z：释放当前技能',
      '1/2/3：切换技能宝石',
      'P：打开天赋树',
      'I：打开装备栏',
      'ESC：暂停菜单',
      '',
      '击杀敌人获得经验和装备',
      '到达关卡右侧出口进入下一关'
    ];

    panel.add(scene.add.text(cx, cy - 20, content.join('\n'), {
      fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace', lineSpacing: 8, align: 'center'
    }).setOrigin(0.5));

    const btn = scene.add.rectangle(cx, cy + 130, 160, 40, 0x3b82f6).setInteractive({ useHandCursor: true });
    const btnText = scene.add.text(cx, cy + 130, '开始游戏', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x60a5fa));
    btn.on('pointerout', () => btn.setFillStyle(0x3b82f6));
    btn.on('pointerdown', () => {
      panel.destroy();
      onComplete();
    });
    panel.add([btn, btnText]);
  }
}
