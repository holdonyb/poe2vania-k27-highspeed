export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique';
export type EquipSlot = 'weapon' | 'armor' | 'helmet' | 'boots';

export interface Affix {
  name: string;
  mod: Partial<CharacterStats>;
}

export interface CharacterStats {
  maxHp: number;
  damageMul: number;
  attackSpeed: number;
  moveSpeed: number;
  critChance: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: ItemRarity;
  implicit?: Partial<CharacterStats>;
  prefixes: Affix[];
  suffixes: Affix[];
}

const PREFIX_POOL: Affix[] = [
  { name: '锋利的', mod: { damageMul: 0.15 } },
  { name: '沉重的', mod: { damageMul: 0.25 } },
  { name: '迅捷的', mod: { attackSpeed: 0.1 } },
  { name: '厚实的', mod: { maxHp: 20 } },
  { name: '坚固的', mod: { maxHp: 35 } },
  { name: '轻盈的', mod: { moveSpeed: 0.08 } }
];

const SUFFIX_POOL: Affix[] = [
  { name: '猛虎', mod: { damageMul: 0.1 } },
  { name: '巨熊', mod: { maxHp: 15 } },
  { name: '猎豹', mod: { moveSpeed: 0.06 } },
  { name: '鹰隼', mod: { critChance: 0.05 } },
  { name: '蝮蛇', mod: { attackSpeed: 0.08 } }
];

const BASE_NAMES: Record<EquipSlot, string[]> = {
  weapon: ['短剑', '长剑', '战斧', '长矛', '法杖'],
  armor: ['皮甲', '链甲', '板甲', '布甲', '鳞甲'],
  helmet: ['皮帽', '铁盔', '角盔', '兜帽', '王冠'],
  boots: ['皮靴', '铁靴', '轻靴', '战靴', '便鞋']
};

export function generateEquipment(level: number, forcedRarity?: ItemRarity): Equipment {
  const slotKeys: EquipSlot[] = ['weapon', 'armor', 'helmet', 'boots'];
  const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];
  const rarityRoll = Math.random();
  const rarity: ItemRarity = forcedRarity ??
    (rarityRoll > 0.97 ? 'unique' :
     rarityRoll > 0.85 ? 'rare' :
     rarityRoll > 0.6 ? 'magic' : 'normal');

  const prefixes: Affix[] = [];
  const suffixes: Affix[] = [];

  if (rarity === 'magic') {
    if (Math.random() > 0.5) prefixes.push(randomAffix(PREFIX_POOL));
    else suffixes.push(randomAffix(SUFFIX_POOL));
  } else if (rarity === 'rare') {
    prefixes.push(randomAffix(PREFIX_POOL));
    if (Math.random() > 0.3) prefixes.push(randomAffix(PREFIX_POOL));
    suffixes.push(randomAffix(SUFFIX_POOL));
    if (Math.random() > 0.3) suffixes.push(randomAffix(SUFFIX_POOL));
  } else if (rarity === 'unique') {
    prefixes.push({ name: '传奇的', mod: { damageMul: 0.3 + level * 0.05 } });
    suffixes.push({ name: '远古的', mod: { maxHp: 30 + level * 5 } });
  }

  const baseName = BASE_NAMES[slot][Math.floor(Math.random() * BASE_NAMES[slot].length)];
  const affixNames = [...prefixes, ...suffixes].map(a => a.name).join('');

  return {
    id: `${slot}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: `${affixNames}${baseName}`,
    slot,
    rarity,
    prefixes,
    suffixes
  };
}

function randomAffix(pool: Affix[]): Affix {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function computeEquipmentStats(equipment: Equipment[]): CharacterStats {
  const base: CharacterStats = {
    maxHp: 100,
    damageMul: 1,
    attackSpeed: 1,
    moveSpeed: 1,
    critChance: 0.05
  };
  for (const item of equipment) {
    applyMod(base, item.implicit);
    for (const a of item.prefixes) applyMod(base, a.mod);
    for (const a of item.suffixes) applyMod(base, a.mod);
  }
  return base;
}

function applyMod(stats: CharacterStats, mod?: Partial<CharacterStats>): void {
  if (!mod) return;
  if (mod.maxHp) stats.maxHp += mod.maxHp;
  if (mod.damageMul) stats.damageMul += mod.damageMul;
  if (mod.attackSpeed) stats.attackSpeed += mod.attackSpeed;
  if (mod.moveSpeed) stats.moveSpeed += mod.moveSpeed;
  if (mod.critChance) stats.critChance += mod.critChance;
}

export function rarityColor(rarity: ItemRarity): number {
  switch (rarity) {
    case 'normal': return 0xcfd8dc;
    case 'magic': return 0x42a5f5;
    case 'rare': return 0xffb300;
    case 'unique': return 0xab47bc;
  }
}
