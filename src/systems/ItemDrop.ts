import { Gem, SUPPORT_GEMS, createGem } from './Gem';
import { Equipment, generateEquipment } from './Equipment';

export type DropType = 'hp' | 'gem' | 'equip' | 'xp';

export interface DropItem {
  type: DropType;
  value?: number;
  gem?: Gem;
  equipment?: Equipment;
}

export function rollDrop(enemyLevel: number): DropItem | null {
  const roll = Math.random();
  if (roll < 0.25) {
    return { type: 'hp', value: 15 + enemyLevel * 3 };
  }
  if (roll < 0.38) {
    const gemKeys = ['fireball', 'ice_shot', 'lightning_strike'];
    const gemId = gemKeys[Math.floor(Math.random() * gemKeys.length)];
    const supports: typeof SUPPORT_GEMS = [];
    if (Math.random() > 0.5) supports.push(SUPPORT_GEMS[Math.floor(Math.random() * SUPPORT_GEMS.length)]);
    return { type: 'gem', gem: createGem(gemId, 1 + Math.floor(enemyLevel / 3), supports) };
  }
  if (roll < 0.55) {
    return { type: 'equip', equipment: generateEquipment(enemyLevel) };
  }
  return { type: 'xp', value: 10 + enemyLevel * 5 };
}
