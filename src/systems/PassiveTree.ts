export interface PassiveNode {
  id: string;
  name: string;
  x: number;
  y: number;
  mod: Partial<{
    maxHp: number;
    damageMul: number;
    attackSpeed: number;
    moveSpeed: number;
    critChance: number;
    skillGemLevel: number;
  }>;
  allocated: boolean;
  requires?: string[];
}

export class PassiveTree {
  nodes: PassiveNode[] = [];
  points = 0;

  constructor() {
    this.buildTree();
  }

  private buildTree(): void {
    // 中心起点
    this.nodes.push({ id: 'origin', name: '原点', x: 0, y: 0, mod: {}, allocated: true });

    // 生命分支
    this.nodes.push({ id: 'hp1', name: '坚韧 I', x: -2, y: -1, mod: { maxHp: 15 }, allocated: false, requires: ['origin'] });
    this.nodes.push({ id: 'hp2', name: '坚韧 II', x: -3, y: -2, mod: { maxHp: 25 }, allocated: false, requires: ['hp1'] });
    this.nodes.push({ id: 'hp3', name: '巨人之血', x: -4, y: -2, mod: { maxHp: 50 }, allocated: false, requires: ['hp2'] });

    // 伤害分支
    this.nodes.push({ id: 'dmg1', name: '锋利 I', x: 2, y: -1, mod: { damageMul: 0.1 }, allocated: false, requires: ['origin'] });
    this.nodes.push({ id: 'dmg2', name: '锋利 II', x: 3, y: -2, mod: { damageMul: 0.15 }, allocated: false, requires: ['dmg1'] });
    this.nodes.push({ id: 'dmg3', name: '毁灭之力', x: 4, y: -2, mod: { damageMul: 0.25, critChance: 0.05 }, allocated: false, requires: ['dmg2'] });

    // 速度分支
    this.nodes.push({ id: 'spd1', name: '疾风 I', x: 0, y: 2, mod: { moveSpeed: 0.05, attackSpeed: 0.05 }, allocated: false, requires: ['origin'] });
    this.nodes.push({ id: 'spd2', name: '疾风 II', x: 0, y: 3, mod: { moveSpeed: 0.08, attackSpeed: 0.08 }, allocated: false, requires: ['spd1'] });
    this.nodes.push({ id: 'spd3', name: '幽灵步伐', x: 1, y: 4, mod: { moveSpeed: 0.12 }, allocated: false, requires: ['spd2'] });

    // 宝石分支
    this.nodes.push({ id: 'gem1', name: '奥术 I', x: -2, y: 1, mod: { skillGemLevel: 1 }, allocated: false, requires: ['origin'] });
    this.nodes.push({ id: 'gem2', name: '奥术 II', x: -3, y: 2, mod: { skillGemLevel: 1 }, allocated: false, requires: ['gem1'] });
    this.nodes.push({ id: 'gem3', name: '元素大师', x: -4, y: 3, mod: { skillGemLevel: 2, damageMul: 0.1 }, allocated: false, requires: ['gem2'] });
  }

  allocate(nodeId: string): boolean {
    if (this.points <= 0) return false;
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node || node.allocated) return false;
    const reachable = !node.requires || node.requires.some(rid => this.nodes.find(n => n.id === rid)?.allocated);
    if (!reachable) return false;
    node.allocated = true;
    this.points -= 1;
    return true;
  }

  getAllocatedMods(): Partial<PassiveNode['mod']> {
    const total: Partial<PassiveNode['mod']> = {};
    for (const node of this.nodes.filter(n => n.allocated)) {
      for (const [key, value] of Object.entries(node.mod)) {
        const k = key as keyof PassiveNode['mod'];
        (total[k] as number | undefined) = ((total[k] as number | undefined) ?? 0) + (value as number);
      }
    }
    return total;
  }
}
