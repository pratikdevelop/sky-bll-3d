export type GameState = 'title' | 'playing' | 'paused' | 'victory' | 'revive_prompt';

export type LevelTheme = 'cloud' | 'sunset' | 'cyber' | 'crystal' | 'storm';

export interface PlatformDef {
  id: string;
  type: 'box' | 'narrow_bridge' | 'ramp' | 'moving' | 'bouncy' | 'speed_strip';
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number]; // Euler angles in radians
  moveAxis?: 'x' | 'y' | 'z';
  moveDistance?: number;
  moveSpeed?: number;
  color?: number;
  accentColor?: number;
}

export interface HazardDef {
  id: string;
  type: 'spinner' | 'crusher' | 'spikes';
  position: [number, number, number];
  size: [number, number, number];
  rotationSpeed?: number; // radians per second
  axis?: 'x' | 'y' | 'z';
}

export interface CollectibleDef {
  id: string;
  type: 'coin' | 'gem';
  position: [number, number, number];
  value: number;
}

export interface CheckpointDef {
  id: string;
  index: number;
  position: [number, number, number];
  respawnPosition: [number, number, number];
  name?: string;
}

export interface PortalDef {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  theme: LevelTheme;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';
  parTime: number; // target time for 3 stars (seconds)
  spawnPoint: [number, number, number];
  spawnRotation?: number;
  platforms: PlatformDef[];
  hazards: HazardDef[];
  collectibles: CollectibleDef[];
  checkpoints: CheckpointDef[];
  portal: PortalDef;
  skyColorTop: string;
  skyColorBottom: string;
  fogColor: number;
  ambientColor: number;
  keyLightColor: number;
}

export interface BallSkin {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
  roughness: number;
  metalness: number;
  baseColor: number;
  emissive?: number;
  patternType: 'marble' | 'cyber' | 'magma' | 'gold' | 'cosmos' | 'emerald';
}

export interface PlayerProgress {
  coins: number;
  unlockedLevel: number; // highest level unlocked (1-5)
  levelStars: Record<number, number>; // levelId -> stars (1-3)
  bestTimes: Record<number, number>; // levelId -> seconds
  ownedSkins: string[];
  activeSkinId: string;
  isMuted: boolean;
  adFreePurchased: boolean;
  hasShownInterstitialCount: number;
}
