import { Gem, SUPPORT_GEMS, createGem } from './Gem';
import { Equipment, EquipSlot } from './Equipment';
import { PassiveTree } from './PassiveTree';

export interface PlayerSaveData {
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  passivePoints: number;
  passiveAllocated: string[];
  gems: Gem[];
  equipment: Equipment[];
}

export interface ProgressSaveData {
  currentLevelId: string;
  unlockedLevels: string[];
  gold: number;
}

export interface SaveData {
  version: number;
  player: PlayerSaveData;
  progress: ProgressSaveData;
}

const SAVE_KEY = 'poe2vania_save_v1';

export class SaveManager {
  static hasSave(): boolean {
    return !!localStorage.getItem(SAVE_KEY);
  }

  static save(player: {
    level: number;
    xp: number;
    xpToNext: number;
    hp: number;
    maxHp: number;
    passiveTree: PassiveTree;
    gems: Gem[];
    equipment: Map<EquipSlot, Equipment>;
  }, progress: ProgressSaveData): void {
    const data: SaveData = {
      version: 1,
      player: {
        level: player.level,
        xp: player.xp,
        xpToNext: player.xpToNext,
        hp: player.hp,
        maxHp: player.maxHp,
        passivePoints: player.passiveTree.points,
        passiveAllocated: player.passiveTree.nodes.filter(n => n.allocated).map(n => n.id),
        gems: player.gems,
        equipment: Array.from(player.equipment.values())
      },
      progress
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SaveData;
      if (!data || data.version !== 1) return null;

      // 重建宝石实例，确保方法可用
      data.player.gems = data.player.gems.map(g =>
        createGem(g.id, g.level, g.supports.map(s => SUPPORT_GEMS.find(x => x.id === s.id) ?? SUPPORT_GEMS[0]))
      );

      // 重建装备 Map 兼容
      data.player.equipment = data.player.equipment.map(e => ({
        ...e,
        prefixes: e.prefixes ?? [],
        suffixes: e.suffixes ?? []
      }));

      return data;
    } catch {
      return null;
    }
  }

  static clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  static applyToPlayer(player: {
    level: number;
    xp: number;
    xpToNext: number;
    hp: number;
    maxHp: number;
    passiveTree: PassiveTree;
    gems: Gem[];
    equipment: Map<EquipSlot, Equipment>;
  }, data: SaveData): void {
    player.level = data.player.level;
    player.xp = data.player.xp;
    player.xpToNext = data.player.xpToNext;
    player.hp = data.player.hp;
    player.maxHp = data.player.maxHp;

    player.passiveTree.points = data.player.passivePoints;
    for (const node of player.passiveTree.nodes) {
      node.allocated = data.player.passiveAllocated.includes(node.id);
    }

    player.gems = data.player.gems;
    player.equipment = new Map(data.player.equipment.map(e => [e.slot, e]));
  }
}
