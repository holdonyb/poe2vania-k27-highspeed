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

    const btn = scene.add.text(cx, cy + 130, '点击任意位置开始游戏', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', backgroundColor: '#3b82f6', padding: { x: 20, y: 8 }
    }).setOrigin(0.5);
    panel.add(btn);

    // 点击屏幕任意位置关闭教程
    const overlay = scene.add.rectangle(cx, cy, 800, 450, 0x000000, 0.01).setScrollFactor(0).setInteractive();
    overlay.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      onComplete();
    });
    panel.add(overlay);
    panel.sendToBack(overlay);
  }
}
