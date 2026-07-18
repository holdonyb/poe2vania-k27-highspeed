export interface EnemySpawn {
  x: number;
  y: number;
  level: number;
  type?: 'normal' | 'ranged' | 'flying' | 'elite';
}

export interface BossConfig {
  x: number;
  y: number;
  level: number;
  name: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  platformData: [number, number, number][];
  enemySpawns: EnemySpawn[];
  isBoss: boolean;
  boss?: BossConfig;
  nextLevelId?: string;
  playerStart: { x: number; y: number };
}

export const LEVELS: LevelConfig[] = [
  {
    id: 'level_1',
    name: '荒废庭院',
    width: 1600,
    height: 600,
    platformData: [
      [200, 480, 4], [420, 400, 3], [620, 320, 4], [820, 420, 3],
      [1000, 340, 5], [1240, 260, 3], [1400, 400, 3]
    ],
    enemySpawns: [
      { x: 300, y: 400, level: 1 },
      { x: 600, y: 300, level: 1 },
      { x: 900, y: 350, level: 1 },
      { x: 1200, y: 250, level: 2 },
      { x: 1450, y: 400, level: 2 }
    ],
    isBoss: false,
    nextLevelId: 'level_2',
    playerStart: { x: 80, y: 450 }
  },
  {
    id: 'level_2',
    name: '地下墓穴',
    width: 1800,
    height: 600,
    platformData: [
      [150, 450, 3], [400, 350, 4], [700, 280, 3], [950, 400, 4],
      [1200, 320, 5], [1500, 220, 3], [1600, 450, 2]
    ],
    enemySpawns: [
      { x: 350, y: 300, level: 2, type: 'ranged' },
      { x: 550, y: 300, level: 2 },
      { x: 800, y: 250, level: 3 },
      { x: 1100, y: 350, level: 3, type: 'elite' },
      { x: 1400, y: 200, level: 3 },
      { x: 1650, y: 400, level: 3 }
    ],
    isBoss: false,
    nextLevelId: 'level_3',
    playerStart: { x: 80, y: 450 }
  },
  {
    id: 'level_3',
    name: '高塔回廊',
    width: 2000,
    height: 700,
    platformData: [
      [200, 550, 3], [450, 450, 3], [700, 350, 4], [1000, 280, 3],
      [1300, 400, 4], [1550, 300, 3], [1750, 200, 3], [1850, 550, 2]
    ],
    enemySpawns: [
      { x: 300, y: 500, level: 3, type: 'flying' },
      { x: 600, y: 350, level: 4 },
      { x: 850, y: 300, level: 4, type: 'ranged' },
      { x: 1150, y: 350, level: 4, type: 'elite' },
      { x: 1450, y: 350, level: 4 },
      { x: 1700, y: 200, level: 5, type: 'flying' }
    ],
    isBoss: false,
    nextLevelId: 'level_boss',
    playerStart: { x: 80, y: 550 }
  },
  {
    id: 'level_boss',
    name: '恶魔城核心',
    width: 1600,
    height: 600,
    platformData: [
      [300, 450, 3], [700, 350, 4], [1100, 450, 3]
    ],
    enemySpawns: [
      { x: 500, y: 400, level: 5 },
      { x: 900, y: 300, level: 5, type: 'elite' }
    ],
    isBoss: true,
    boss: { x: 1200, y: 300, level: 7, name: '血族领主' },
    playerStart: { x: 80, y: 450 }
  }
];

export function getLevel(id: string): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}
