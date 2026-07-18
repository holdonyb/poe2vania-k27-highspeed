export type GemColor = 'red' | 'green' | 'blue';

export interface Gem {
  id: string;
  name: string;
  color: GemColor;
  level: number;
  supports: SupportGem[];
  cooldown: number; // 秒
  lastUsed: number; // 毫秒时间戳
}

export interface SupportGem {
  id: string;
  name: string;
  effect: (base: SkillStats) => SkillStats;
}

export interface SkillStats {
  damage: number;
  projectileCount: number;
  pierce: boolean;
  chain: number;
  area: number;
  cooldown: number;
}

export const SKILL_GEMS: Record<string, Omit<Gem, 'level' | 'supports' | 'lastUsed'>> = {
  fireball: {
    id: 'fireball',
    name: '火球术',
    color: 'red',
    cooldown: 0.6
  },
  ice_shot: {
    id: 'ice_shot',
    name: '冰霜射击',
    color: 'green',
    cooldown: 0.4
  },
  lightning_strike: {
    id: 'lightning_strike',
    name: '闪电打击',
    color: 'blue',
    cooldown: 0.5
  }
};

export const SUPPORT_GEMS: SupportGem[] = [
  {
    id: 'added_damage',
    name: '附加伤害',
    effect: (s) => ({ ...s, damage: s.damage * 1.4 })
  },
  {
    id: 'multiple_projectiles',
    name: '多重投射',
    effect: (s) => ({ ...s, projectileCount: s.projectileCount + 2, damage: s.damage * 0.7 })
  },
  {
    id: 'pierce',
    name: '穿透',
    effect: (s) => ({ ...s, pierce: true })
  },
  {
    id: 'chain',
    name: '连锁',
    effect: (s) => ({ ...s, chain: s.chain + 2, damage: s.damage * 0.85 })
  },
  {
    id: 'faster_attacks',
    name: '快速施法',
    effect: (s) => ({ ...s, cooldown: s.cooldown * 0.7 })
  }
];

export function createGem(gemId: string, level = 1, supports: SupportGem[] = []): Gem {
  const base = SKILL_GEMS[gemId];
  if (!base) throw new Error(`Unknown gem ${gemId}`);
  return {
    ...base,
    level,
    supports,
    lastUsed: 0
  };
}

export function computeSkillStats(gem: Gem): SkillStats {
  const base: SkillStats = {
    damage: 12 * gem.level,
    projectileCount: 1,
    pierce: false,
    chain: 0,
    area: 1,
    cooldown: gem.cooldown
  };
  return gem.supports.reduce((stats, sup) => sup.effect(stats), base);
}
