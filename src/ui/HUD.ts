import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EquipSlot, rarityColor, computeEquipmentStats } from '../systems/Equipment';
import { computeSkillStats } from '../systems/Gem';

export class HUD {
  scene: Phaser.Scene;
  player: Player;

  hpBar: Phaser.GameObjects.Graphics;
  xpBar: Phaser.GameObjects.Graphics;
  infoText: Phaser.GameObjects.Text;
  gemText: Phaser.GameObjects.Text;

  passivePanel: Phaser.GameObjects.Container | null = null;
  equipPanel: Phaser.GameObjects.Container | null = null;
  showingPassive = false;
  showingEquip = false;

  private saveCallback?: () => void;
  private pauseCallback?: (paused: boolean) => void;
  private getEnemyCount?: () => number;
  private isLevelCompleted?: () => boolean;

  constructor(scene: Phaser.Scene, player: Player, saveCallback?: () => void, pauseCallback?: (paused: boolean) => void, getEnemyCount?: () => number, isLevelCompleted?: () => boolean) {
    this.scene = scene;
    this.player = player;
    this.saveCallback = saveCallback;
    this.pauseCallback = pauseCallback;
    this.getEnemyCount = getEnemyCount;
    this.isLevelCompleted = isLevelCompleted;

    this.hpBar = scene.add.graphics();
    this.xpBar = scene.add.graphics();
    this.infoText = scene.add.text(10, 10, '', {
      fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100);
    this.gemText = scene.add.text(10, 80, '', {
      fontSize: '11px', color: '#93c5fd', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(100);

    scene.input.keyboard?.on('keydown-P', () => this.togglePassiveTree());
    scene.input.keyboard?.on('keydown-I', () => this.toggleEquipPanel());
  }

  update(): void {
    this.drawBars();
    const enemyCount = this.getEnemyCount ? this.getEnemyCount() : 0;
    const completed = this.isLevelCompleted ? this.isLevelCompleted() : false;
    const portalHint = completed ? '出口已开启 →' : (enemyCount > 0 ? `剩余敌人 ${enemyCount}` : '出口即将开启...');
    this.infoText.setText(
      `等级 ${this.player.level}  |  生命 ${Math.ceil(this.player.hp)}/${this.player.maxHp}\n` +
      `经验 ${this.player.xp}/${this.player.xpToNext}  |  天赋点 ${this.player.passiveTree.points}\n` +
      portalHint
    );

    const gem = this.player.activeGem;
    const gems = this.player.gems.map((g, i) => {
      const active = i === this.player.activeGemIndex;
      return `${active ? '>' : ' '} ${i + 1}. ${g.name} Lv.${g.level}`;
    }).join('\n');

    let gemDetail = '';
    if (gem) {
      const stats = computeSkillStats(gem);
      const supports = gem.supports.length ? ` + ${gem.supports.map(s => s.name).join('/')}` : '';
      gemDetail = `当前: ${gem.name}${supports}\n伤害 ${Math.floor(stats.damage)}  冷却 ${stats.cooldown.toFixed(1)}s  投射 ${stats.projectileCount}`;
    } else {
      gemDetail = '当前: 无技能';
    }

    this.gemText.setText(`[Z] 释放技能  [1/2/3] 切换\n${gems}\n${gemDetail}`);
  }

  drawBars(): void {
    const w = 200;
    const h = 12;

    this.hpBar.clear();
    this.hpBar.fillStyle(0x1e293b);
    this.hpBar.fillRect(10, 10, w, h);
    const hpRatio = Math.max(0, this.player.hp / this.player.maxHp);
    this.hpBar.fillStyle(hpRatio > 0.3 ? 0x22c55e : 0xef4444);
    this.hpBar.fillRect(10, 10, w * hpRatio, h);
    this.hpBar.lineStyle(1, 0x475569);
    this.hpBar.strokeRect(10, 10, w, h);
    this.hpBar.setScrollFactor(0).setDepth(99);

    this.xpBar.clear();
    this.xpBar.fillStyle(0x1e293b);
    this.xpBar.fillRect(10, 26, w, 6);
    const xpRatio = this.player.xp / this.player.xpToNext;
    this.xpBar.fillStyle(0x3b82f6);
    this.xpBar.fillRect(10, 26, w * xpRatio, 6);
    this.xpBar.setScrollFactor(0).setDepth(99);
  }

  togglePassiveTree(): void {
    if (this.showingEquip) this.toggleEquipPanel();
    this.showingPassive = !this.showingPassive;
    if (this.showingPassive) {
      this.openPassiveTree();
      this.pauseCallback?.(true);
    } else {
      this.passivePanel?.destroy();
      this.pauseCallback?.(false);
    }
  }

  openPassiveTree(): void {
    this.passivePanel = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(200);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRect(0, 0, 800, 450);
    bg.lineStyle(2, 0x334155);
    bg.strokeRect(0, 0, 800, 450);
    this.passivePanel.add(bg);

    const title = this.scene.add.text(400, 20, `天赋树  (剩余点数: ${this.player.passiveTree.points})`, {
      fontSize: '16px', color: '#fbbf24', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.passivePanel.add(title);

    const tree = this.player.passiveTree;
    const cx = 400;
    const cy = 230;
    const scale = 42;

    // 连线
    const lines = this.scene.add.graphics();
    for (const node of tree.nodes) {
      if (!node.requires) continue;
      for (const reqId of node.requires) {
        const req = tree.nodes.find(n => n.id === reqId);
        if (!req) continue;
        lines.lineStyle(2, req.allocated && node.allocated ? 0xfbbf24 : 0x475569);
        lines.lineBetween(cx + req.x * scale, cy + req.y * scale, cx + node.x * scale, cy + node.y * scale);
      }
    }
    this.passivePanel.add(lines);

    // 节点
    for (const node of tree.nodes) {
      const color = node.allocated ? 0xfbbf24 : 0x64748b;
      const circle = this.scene.add.circle(cx + node.x * scale, cy + node.y * scale, 10, color)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add.text(cx + node.x * scale, cy + node.y * scale + 18, node.name, {
        fontSize: '10px', color: '#e2e8f0', fontFamily: 'monospace'
      }).setOrigin(0.5);
      this.passivePanel.add([circle, label]);

      circle.on('pointerdown', () => {
        if (tree.allocate(node.id)) {
          this.player.recalcStats();
          this.saveCallback?.();
          this.passivePanel?.destroy();
          this.openPassiveTree();
        }
      });

      circle.on('pointerover', () => {
        const mods = Object.entries(node.mod).map(([k, v]) => `${k}: +${v}`).join(', ');
        const desc = this.scene.add.text(this.scene.input.activePointer.x + 10, this.scene.input.activePointer.y - 10, mods || '起点', {
          fontSize: '10px', color: '#000000', backgroundColor: '#fbbf24', fontFamily: 'monospace', padding: { x: 4, y: 2 }
        }).setDepth(250);
        this.passivePanel?.add(desc);
        circle.once('pointerout', () => desc.destroy());
      });
    }

    const close = this.scene.add.text(760, 20, '×', {
      fontSize: '24px', color: '#ef4444', fontFamily: 'monospace'
    }).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.togglePassiveTree());
    this.passivePanel.add(close);
  }

  toggleEquipPanel(): void {
    if (this.showingPassive) this.togglePassiveTree();
    this.showingEquip = !this.showingEquip;
    if (this.showingEquip) {
      this.openEquipPanel();
      this.pauseCallback?.(true);
    } else {
      this.equipPanel?.destroy();
      this.pauseCallback?.(false);
    }
  }

  openEquipPanel(): void {
    this.equipPanel = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(200);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRect(0, 0, 800, 450);
    bg.lineStyle(2, 0x334155);
    bg.strokeRect(0, 0, 800, 450);
    this.equipPanel.add(bg);

    this.equipPanel.add(this.scene.add.text(400, 20, '装备栏', {
      fontSize: '16px', color: '#fbbf24', fontFamily: 'monospace'
    }).setOrigin(0.5));

    const slots: EquipSlot[] = ['weapon', 'armor', 'helmet', 'boots'];
    const slotNames: Record<EquipSlot, string> = { weapon: '武器', armor: '护甲', helmet: '头盔', boots: '靴子' };

    let y = 70;
    for (const slot of slots) {
      const item = this.player.equipment.get(slot);
      const text = item
        ? `[${slotNames[slot]}] ${item.name}`
        : `[${slotNames[slot]}] (空)`;
      const color = item ? rarityColor(item.rarity) : 0x94a3b8;
      const t = this.scene.add.text(60, y, text, {
        fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace', backgroundColor: '#' + color.toString(16).padStart(6, '0')
      });
      this.equipPanel.add(t);
      y += 36;
    }

    const stats = this.scene.add.text(60, 220, this.getStatsText(), {
      fontSize: '11px', color: '#93c5fd', fontFamily: 'monospace', lineSpacing: 6
    });
    this.equipPanel.add(stats);

    const close = this.scene.add.text(760, 20, '×', {
      fontSize: '24px', color: '#ef4444', fontFamily: 'monospace'
    }).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.toggleEquipPanel());
    this.equipPanel.add(close);
  }

  getStatsText(): string {
    const eqItems = Array.from(this.player.equipment.values());
    const stats = computeEquipmentStats(eqItems);
    return `生命上限: ${this.player.maxHp}\n伤害倍率: ${(stats.damageMul * 100).toFixed(0)}%\n移动速度: ${(stats.moveSpeed * 100).toFixed(0)}%`;
  }
}
