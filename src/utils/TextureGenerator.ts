import Phaser from 'phaser';

export function generateTextures(scene: Phaser.Scene): void {
  const gfx = scene.make.graphics({ x: 0, y: 0 });

  // 玩家：蓝色骑士
  gfx.clear();
  gfx.fillStyle(0x3b82f6);
  gfx.fillRect(8, 4, 16, 20);
  gfx.fillStyle(0x1e293b);
  gfx.fillRect(10, 6, 4, 4);
  gfx.fillRect(18, 6, 4, 4);
  gfx.fillStyle(0x93c5fd);
  gfx.fillRect(6, 8, 4, 12);
  gfx.fillRect(22, 8, 4, 12);
  gfx.generateTexture('player', 32, 32);

  // 敌人：红色怪物
  gfx.clear();
  gfx.fillStyle(0xef4444);
  gfx.fillRect(6, 8, 20, 18);
  gfx.fillStyle(0x7f1d1d);
  gfx.fillRect(10, 12, 4, 4);
  gfx.fillRect(18, 12, 4, 4);
  gfx.fillStyle(0xfca5a5);
  gfx.fillRect(8, 20, 16, 4);
  gfx.generateTexture('enemy', 32, 32);

  // 地面瓦片
  gfx.clear();
  gfx.fillStyle(0x334155);
  gfx.fillRect(0, 0, 32, 32);
  gfx.fillStyle(0x475569);
  gfx.fillRect(0, 0, 32, 4);
  gfx.fillStyle(0x1e293b);
  gfx.fillRect(4, 8, 6, 4);
  gfx.fillRect(20, 18, 8, 4);
  gfx.generateTexture('ground', 32, 32);

  // 平台
  gfx.clear();
  gfx.fillStyle(0x475569);
  gfx.fillRect(0, 0, 32, 12);
  gfx.fillStyle(0x64748b);
  gfx.fillRect(0, 0, 32, 3);
  gfx.generateTexture('platform', 32, 32);

  // 子弹（通用）
  gfx.clear();
  gfx.fillStyle(0xfacc15);
  gfx.fillCircle(8, 8, 6);
  gfx.generateTexture('bullet', 16, 16);

  // 火球术
  gfx.clear();
  gfx.fillStyle(0xef4444);
  gfx.fillCircle(10, 10, 8);
  gfx.fillStyle(0xf97316);
  gfx.fillCircle(10, 10, 5);
  gfx.fillStyle(0xfacc15);
  gfx.fillCircle(10, 10, 2);
  gfx.generateTexture('fireball', 20, 20);

  // 冰霜射击
  gfx.clear();
  gfx.fillStyle(0x60a5fa);
  gfx.beginPath();
  gfx.moveTo(10, 2);
  gfx.lineTo(18, 10);
  gfx.lineTo(10, 18);
  gfx.lineTo(2, 10);
  gfx.closePath();
  gfx.fillPath();
  gfx.fillStyle(0xffffff);
  gfx.fillCircle(10, 10, 3);
  gfx.generateTexture('ice_shard', 20, 20);

  // 闪电打击
  gfx.clear();
  gfx.fillStyle(0xfacc15);
  gfx.beginPath();
  gfx.moveTo(10, 2);
  gfx.lineTo(14, 8);
  gfx.lineTo(9, 8);
  gfx.lineTo(12, 18);
  gfx.lineTo(6, 10);
  gfx.lineTo(11, 10);
  gfx.closePath();
  gfx.fillPath();
  gfx.generateTexture('lightning', 20, 20);

  // 近战斩击
  gfx.clear();
  gfx.fillStyle(0xe2e8f0);
  gfx.beginPath();
  gfx.arc(16, 16, 16, -Math.PI / 4, Math.PI / 4, false);
  gfx.lineTo(16, 16);
  gfx.closePath();
  gfx.fillPath();
  gfx.generateTexture('slash', 32, 32);

  // 掉落物
  gfx.clear();
  gfx.fillStyle(0x22c55e);
  gfx.fillCircle(8, 8, 6);
  gfx.generateTexture('drop_hp', 16, 16);

  gfx.clear();
  gfx.fillStyle(0xa855f7);
  gfx.fillRect(2, 2, 12, 12);
  gfx.generateTexture('drop_gem', 16, 16);

  gfx.clear();
  gfx.fillStyle(0xf59e0b);
  drawStar(gfx, 8, 8, 5, 7, 3);
  gfx.generateTexture('drop_equip', 16, 16);

  gfx.clear();
  gfx.fillStyle(0x3b82f6);
  gfx.fillCircle(8, 8, 5);
  gfx.fillStyle(0x60a5fa);
  gfx.fillCircle(8, 8, 2);
  gfx.generateTexture('drop_xp', 16, 16);

  // 背景装饰
  gfx.clear();
  gfx.fillStyle(0x0f172a);
  gfx.fillRect(0, 0, 32, 32);
  gfx.fillStyle(0x1e293b);
  gfx.fillRect(4, 4, 4, 8);
  gfx.fillRect(20, 12, 6, 10);
  gfx.generateTexture('wall', 32, 32);

  // 像素粒子
  gfx.clear();
  gfx.fillStyle(0xffffff);
  gfx.fillRect(0, 0, 4, 4);
  gfx.generateTexture('pixel', 4, 4);
}

function drawStar(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, points: number, outer: number, inner: number): void {
  gfx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) gfx.moveTo(x, y);
    else gfx.lineTo(x, y);
  }
  gfx.closePath();
  gfx.fillPath();
}
