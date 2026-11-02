import { LevelData } from './types.ts';

export const LEVELS: LevelData[] = [
  // -------------------------------------------------------------
  // LEVEL 1: Sky Breeze Meadow (Tutorial / Gateway)
  // -------------------------------------------------------------
  {
    id: 1,
    title: 'Sky Breeze Meadow',
    subtitle: 'Learn momentum, steering, and balance among peaceful sunlit clouds.',
    theme: 'cloud',
    difficulty: 'Easy',
    parTime: 28,
    spawnPoint: [0, 1.2, 0],
    spawnRotation: 0,
    skyColorTop: '#38bdf8',
    skyColorBottom: '#bae6fd',
    fogColor: 0xbfe3f7,
    ambientColor: 0x8ecae6,
    keyLightColor: 0xfff7ed,
    platforms: [
      // Starting platform (wide & safe)
      { id: 'l1_p1', type: 'box', position: [0, 0, 0], size: [8, 1, 10], color: 0x38a169 },
      // Straight walkway
      { id: 'l1_p2', type: 'box', position: [0, 0, 12], size: [5, 1, 12], color: 0x2f855a },
      // Gentle slope / ramp leading up
      { id: 'l1_p3', type: 'ramp', position: [0, 1, 22], size: [5, 1, 8], rotation: [-0.15, 0, 0], color: 0x276749 },
      // Elevated island
      { id: 'l1_p4', type: 'box', position: [0, 2.2, 31], size: [7, 1, 8], color: 0x38a169 },
      // First small gap jump to a narrow bridge
      { id: 'l1_p5', type: 'narrow_bridge', position: [0, 2.2, 43], size: [3.2, 1, 12], color: 0x2f855a },
      // Mid checkpoint island
      { id: 'l1_p6', type: 'box', position: [0, 2.2, 54], size: [8, 1, 8], color: 0x38a169 },
      // Moving platform crossing a cloud gap
      { id: 'l1_p7', type: 'moving', position: [0, 2.2, 65], size: [4.5, 1, 6], moveAxis: 'x', moveDistance: 3, moveSpeed: 1.8, color: 0x319795 },
      // Final approach platform
      { id: 'l1_p8', type: 'box', position: [0, 2.2, 76], size: [5, 1, 12], color: 0x2f855a },
      // Goal sanctuary
      { id: 'l1_p9', type: 'box', position: [0, 2.2, 88], size: [9, 1, 10], color: 0x276749 },
    ],
    hazards: [
      // Gentle slow rotating barrier on the final approach
      { id: 'l1_h1', type: 'spinner', position: [0, 3.2, 76], size: [4.5, 0.4, 0.4], rotationSpeed: 1.2, axis: 'y' },
    ],
    collectibles: [
      { id: 'l1_c1', type: 'coin', position: [0, 1.2, 8], value: 1 },
      { id: 'l1_c2', type: 'coin', position: [0, 1.2, 12], value: 1 },
      { id: 'l1_c3', type: 'coin', position: [0, 1.2, 16], value: 1 },
      { id: 'l1_g1', type: 'gem', position: [0, 2.5, 22], value: 5 }, // On the ramp
      { id: 'l1_c4', type: 'coin', position: [0, 3.4, 31], value: 1 },
      { id: 'l1_c5', type: 'coin', position: [0, 3.4, 40], value: 1 },
      { id: 'l1_c6', type: 'coin', position: [0, 3.4, 46], value: 1 },
      { id: 'l1_g2', type: 'gem', position: [0, 4.0, 65], value: 5 }, // Over moving platform
      { id: 'l1_c7', type: 'coin', position: [0, 3.4, 72], value: 1 },
      { id: 'l1_c8', type: 'coin', position: [0, 3.4, 80], value: 1 },
    ],
    checkpoints: [
      { id: 'l1_cp1', index: 0, position: [0, 3.2, 54], respawnPosition: [0, 4.0, 54], name: 'Meadow Beacon' },
    ],
    portal: {
      position: [0, 3.2, 90],
    },
  },

  // -------------------------------------------------------------
  // LEVEL 2: Sunset Spires
  // -------------------------------------------------------------
  {
    id: 2,
    title: 'Sunset Spires',
    subtitle: 'Ascend terracotta spires, high switchbacks, and tilting ramps in golden hour.',
    theme: 'sunset',
    difficulty: 'Medium',
    parTime: 36,
    spawnPoint: [0, 1.2, 0],
    spawnRotation: 0,
    skyColorTop: '#f97316',
    skyColorBottom: '#fbbf24',
    fogColor: 0xfed7aa,
    ambientColor: 0xfb923c,
    keyLightColor: 0xffedd5,
    platforms: [
      // Starting platform
      { id: 'l2_p1', type: 'box', position: [0, 0, 0], size: [7, 1, 8], color: 0xc2410c },
      // S-curve narrow bridges
      { id: 'l2_p2', type: 'narrow_bridge', position: [0, 0, 9], size: [2.8, 1, 8], color: 0x9a3412 },
      { id: 'l2_p3', type: 'box', position: [4, 0.5, 17], size: [6, 1, 6], color: 0xc2410c },
      { id: 'l2_p4', type: 'narrow_bridge', position: [4, 0.8, 25], size: [2.5, 1, 8], color: 0x9a3412 },
      // Checkpoint 1
      { id: 'l2_p5', type: 'box', position: [0, 1.2, 33], size: [7, 1, 7], color: 0xc2410c },
      // Steep ascent ramp
      { id: 'l2_p6', type: 'ramp', position: [0, 2.8, 42], size: [4.5, 1, 9], rotation: [-0.28, 0, 0], color: 0xea580c },
      // High terrace
      { id: 'l2_p7', type: 'box', position: [0, 4.8, 51], size: [6, 1, 7], color: 0xc2410c },
      // Moving platform traversing wide abyss
      { id: 'l2_p8', type: 'moving', position: [0, 4.8, 62], size: [4, 1, 6], moveAxis: 'x', moveDistance: 4, moveSpeed: 2.2, color: 0xb45309 },
      // Checkpoint 2
      { id: 'l2_p9', type: 'box', position: [0, 4.8, 73], size: [7, 1, 7], color: 0xc2410c },
      // Speed strip launching over chasm
      { id: 'l2_p10', type: 'speed_strip', position: [0, 4.8, 82], size: [3.5, 1, 9], color: 0xf59e0b },
      // Landing sanctuary
      { id: 'l2_p11', type: 'box', position: [0, 4.8, 96], size: [9, 1, 10], color: 0x9a3412 },
    ],
    hazards: [
      { id: 'l2_h1', type: 'spinner', position: [4, 2.0, 17], size: [4.8, 0.4, 0.4], rotationSpeed: 1.6, axis: 'y' },
      { id: 'l2_h2', type: 'spinner', position: [0, 6.0, 73], size: [4.8, 0.4, 0.4], rotationSpeed: -1.8, axis: 'y' },
    ],
    collectibles: [
      { id: 'l2_c1', type: 'coin', position: [0, 1.2, 6], value: 1 },
      { id: 'l2_c2', type: 'coin', position: [2, 1.2, 13], value: 1 },
      { id: 'l2_c3', type: 'coin', position: [4, 1.7, 21], value: 1 },
      { id: 'l2_g1', type: 'gem', position: [4, 2.5, 25], value: 5 },
      { id: 'l2_c4', type: 'coin', position: [0, 4.2, 42], value: 1 },
      { id: 'l2_c5', type: 'coin', position: [0, 6.0, 51], value: 1 },
      { id: 'l2_g2', type: 'gem', position: [0, 6.5, 62], value: 5 },
      { id: 'l2_c6', type: 'coin', position: [0, 6.0, 80], value: 1 },
      { id: 'l2_c7', type: 'coin', position: [0, 6.0, 85], value: 1 },
      { id: 'l2_g3', type: 'gem', position: [0, 6.8, 90], value: 5 },
    ],
    checkpoints: [
      { id: 'l2_cp1', index: 0, position: [0, 2.2, 33], respawnPosition: [0, 3.0, 33], name: 'Sunset Terraces' },
      { id: 'l2_cp2', index: 1, position: [0, 5.8, 73], respawnPosition: [0, 6.6, 73], name: 'Sky Reach' },
    ],
    portal: {
      position: [0, 5.8, 98],
    },
  },

  // -------------------------------------------------------------
  // LEVEL 3: Neon Cyberway
  // -------------------------------------------------------------
  {
    id: 3,
    title: 'Neon Cyberway',
    subtitle: 'High-speed vector grids, velocity boosters, and pulse laser barriers.',
    theme: 'cyber',
    difficulty: 'Hard',
    parTime: 40,
    spawnPoint: [0, 1.2, 0],
    spawnRotation: 0,
    skyColorTop: '#1e1b4b',
    skyColorBottom: '#0f172a',
    fogColor: 0x1e1b4b,
    ambientColor: 0x06b6d4,
    keyLightColor: 0xe0e7ff,
    platforms: [
      // Starting platform
      { id: 'l3_p1', type: 'box', position: [0, 0, 0], size: [7, 1, 8], color: 0x0f172a, accentColor: 0x00f0ff },
      // Speed runway
      { id: 'l3_p2', type: 'speed_strip', position: [0, 0, 11], size: [4, 1, 12], color: 0x06b6d4, accentColor: 0x22d3ee },
      // Jump gap onto narrow high-tech rail
      { id: 'l3_p3', type: 'narrow_bridge', position: [0, 0, 26], size: [2.2, 1, 12], color: 0x0f172a, accentColor: 0x00f0ff },
      // Checkpoint 1 island
      { id: 'l3_p4', type: 'box', position: [0, 0, 36], size: [6.5, 1, 6.5], color: 0x1e1b4b, accentColor: 0xa855f7 },
      // Moving cyber platform (vertical oscillation)
      { id: 'l3_p5', type: 'moving', position: [0, 1.5, 46], size: [4, 1, 6], moveAxis: 'y', moveDistance: 3, moveSpeed: 1.6, color: 0x0f172a },
      // Elevated split track
      { id: 'l3_p6', type: 'box', position: [-3, 3, 56], size: [3, 1, 10], color: 0x0f172a },
      { id: 'l3_p7', type: 'box', position: [3, 3, 56], size: [3, 1, 10], color: 0x0f172a },
      // Checkpoint 2
      { id: 'l3_p8', type: 'box', position: [0, 3, 67], size: [7, 1, 7], color: 0x1e1b4b, accentColor: 0xa855f7 },
      // Bouncy jump pad
      { id: 'l3_p9', type: 'bouncy', position: [0, 3, 76], size: [4, 1, 4], color: 0x10b981 },
      // High destination grid
      { id: 'l3_p10', type: 'box', position: [0, 7, 90], size: [8, 1, 12], color: 0x0f172a, accentColor: 0x00f0ff },
    ],
    hazards: [
      { id: 'l3_h1', type: 'spinner', position: [0, 1.2, 26], size: [4.2, 0.4, 0.4], rotationSpeed: 2.2, axis: 'y' },
      { id: 'l3_h2', type: 'spinner', position: [0, 4.2, 67], size: [4.8, 0.4, 0.4], rotationSpeed: -2.4, axis: 'y' },
    ],
    collectibles: [
      { id: 'l3_c1', type: 'coin', position: [0, 1.2, 8], value: 1 },
      { id: 'l3_c2', type: 'coin', position: [0, 1.2, 14], value: 1 },
      { id: 'l3_g1', type: 'gem', position: [0, 2.0, 21], value: 5 },
      { id: 'l3_c3', type: 'coin', position: [0, 1.2, 30], value: 1 },
      { id: 'l3_c4', type: 'coin', position: [-3, 4.2, 56], value: 1 },
      { id: 'l3_c5', type: 'coin', position: [3, 4.2, 56], value: 1 },
      { id: 'l3_g2', type: 'gem', position: [0, 5.0, 56], value: 5 }, // Risky center gem between split tracks
      { id: 'l3_c6', type: 'coin', position: [0, 4.2, 72], value: 1 },
      { id: 'l3_g3', type: 'gem', position: [0, 9.5, 83], value: 5 }, // High air gem from bounce pad
      { id: 'l3_c7', type: 'coin', position: [0, 8.2, 92], value: 1 },
    ],
    checkpoints: [
      { id: 'l3_cp1', index: 0, position: [0, 1.0, 36], respawnPosition: [0, 2.0, 36], name: 'Node Zero' },
      { id: 'l3_cp2', index: 1, position: [0, 4.0, 67], respawnPosition: [0, 5.0, 67], name: 'Overclock Core' },
    ],
    portal: {
      position: [0, 8.2, 93],
    },
  },

  // -------------------------------------------------------------
  // LEVEL 4: Crystal Heights
  // -------------------------------------------------------------
  {
    id: 4,
    title: 'Crystal Heights',
    subtitle: 'Fragile floating spires, bounce launches over deep chasms, and pendulum gates.',
    theme: 'crystal',
    difficulty: 'Expert',
    parTime: 46,
    spawnPoint: [0, 1.2, 0],
    spawnRotation: 0,
    skyColorTop: '#4c1d95',
    skyColorBottom: '#7c3aed',
    fogColor: 0x4c1d95,
    ambientColor: 0xc084fc,
    keyLightColor: 0xf3e8ff,
    platforms: [
      // Start
      { id: 'l4_p1', type: 'box', position: [0, 0, 0], size: [7, 1, 8], color: 0x581c87 },
      // Stepping diamond blocks
      { id: 'l4_p2', type: 'box', position: [0, 0.4, 9], size: [3.2, 1, 3.2], color: 0x7e22ce },
      { id: 'l4_p3', type: 'box', position: [2.5, 0.8, 15], size: [3.2, 1, 3.2], color: 0x7e22ce },
      { id: 'l4_p4', type: 'box', position: [-2.5, 1.2, 21], size: [3.2, 1, 3.2], color: 0x7e22ce },
      // Checkpoint 1
      { id: 'l4_p5', type: 'box', position: [0, 1.5, 29], size: [6.5, 1, 6.5], color: 0x581c87 },
      // Launch pad across massive chasm
      { id: 'l4_p6', type: 'bouncy', position: [0, 1.5, 36], size: [3.5, 1, 3.5], color: 0x06b6d4 },
      // Distant landing island
      { id: 'l4_p7', type: 'box', position: [0, 5, 52], size: [6.5, 1, 7], color: 0x581c87 },
      // Oscillating crystal platform
      { id: 'l4_p8', type: 'moving', position: [0, 5, 63], size: [4, 1, 5], moveAxis: 'x', moveDistance: 5, moveSpeed: 2.5, color: 0x9333ea },
      // Checkpoint 2
      { id: 'l4_p9', type: 'box', position: [0, 5, 74], size: [6.5, 1, 6.5], color: 0x581c87 },
      // Razor thin ice bridge with dual hazards
      { id: 'l4_p10', type: 'narrow_bridge', position: [0, 5, 86], size: [2.0, 1, 14], color: 0x3b82f6 },
      // Final sanctuary
      { id: 'l4_p11', type: 'box', position: [0, 5, 100], size: [9, 1, 10], color: 0x581c87 },
    ],
    hazards: [
      { id: 'l4_h1', type: 'spinner', position: [0, 6.2, 74], size: [4.8, 0.4, 0.4], rotationSpeed: 2.5, axis: 'y' },
      { id: 'l4_h2', type: 'spinner', position: [0, 6.2, 86], size: [3.8, 0.4, 0.4], rotationSpeed: -2.8, axis: 'y' },
    ],
    collectibles: [
      { id: 'l4_c1', type: 'coin', position: [0, 1.5, 9], value: 1 },
      { id: 'l4_c2', type: 'coin', position: [2.5, 1.9, 15], value: 1 },
      { id: 'l4_c3', type: 'coin', position: [-2.5, 2.3, 21], value: 1 },
      { id: 'l4_g1', type: 'gem', position: [0, 2.8, 29], value: 5 },
      { id: 'l4_g2', type: 'gem', position: [0, 8.5, 44], value: 5 }, // Peak of bouncy trajectory
      { id: 'l4_c4', type: 'coin', position: [0, 6.2, 52], value: 1 },
      { id: 'l4_c5', type: 'coin', position: [0, 6.2, 63], value: 1 },
      { id: 'l4_c6', type: 'coin', position: [0, 6.2, 82], value: 1 },
      { id: 'l4_c7', type: 'coin', position: [0, 6.2, 90], value: 1 },
      { id: 'l4_g3', type: 'gem', position: [0, 6.6, 96], value: 5 },
    ],
    checkpoints: [
      { id: 'l4_cp1', index: 0, position: [0, 2.5, 29], respawnPosition: [0, 3.5, 29], name: 'Prism Overlook' },
      { id: 'l4_cp2', index: 1, position: [0, 6.0, 74], respawnPosition: [0, 7.0, 74], name: 'Aether Spires' },
    ],
    portal: {
      position: [0, 6.0, 102],
    },
  },

  // -------------------------------------------------------------
  // LEVEL 5: Storm Fortress Citadel
  // -------------------------------------------------------------
  {
    id: 5,
    title: 'Storm Fortress Citadel',
    subtitle: 'The master trial: tempest winds, ascending spiral spires, and rotary crushers.',
    theme: 'storm',
    difficulty: 'Master',
    parTime: 55,
    spawnPoint: [0, 1.2, 0],
    spawnRotation: 0,
    skyColorTop: '#0f172a',
    skyColorBottom: '#334155',
    fogColor: 0x1e293b,
    ambientColor: 0x475569,
    keyLightColor: 0x94a3b8,
    platforms: [
      // Bastion entrance
      { id: 'l5_p1', type: 'box', position: [0, 0, 0], size: [7, 1, 8], color: 0x1e293b },
      // Narrow approach
      { id: 'l5_p2', type: 'narrow_bridge', position: [0, 0, 9], size: [2.2, 1, 8], color: 0x0f172a },
      // Turning courtyard
      { id: 'l5_p3', type: 'box', position: [0, 0, 18], size: [7, 1, 7], color: 0x1e293b },
      // Rising ramp 1
      { id: 'l5_p4', type: 'ramp', position: [0, 1.5, 27], size: [4, 1, 9], rotation: [-0.25, 0, 0], color: 0x334155 },
      // Checkpoint 1
      { id: 'l5_p5', type: 'box', position: [0, 3, 36], size: [6.5, 1, 6.5], color: 0x1e293b },
      // Moving platform 1
      { id: 'l5_p6', type: 'moving', position: [0, 3, 46], size: [4, 1, 5], moveAxis: 'x', moveDistance: 4, moveSpeed: 2.8, color: 0x0f172a },
      // Bridge with spinning hazard
      { id: 'l5_p7', type: 'box', position: [0, 3, 56], size: [5, 1, 8], color: 0x1e293b },
      // Checkpoint 2
      { id: 'l5_p8', type: 'box', position: [0, 3, 66], size: [6.5, 1, 6.5], color: 0x1e293b },
      // Super bounce pad
      { id: 'l5_p9', type: 'bouncy', position: [0, 3, 73], size: [3.5, 1, 3.5], color: 0xe11d48 },
      // High Citadel Tower platform
      { id: 'l5_p10', type: 'box', position: [0, 8, 88], size: [6, 1, 8], color: 0x1e293b },
      // Final razor ridge with rapid dual spinner
      { id: 'l5_p11', type: 'narrow_bridge', position: [0, 8, 100], size: [1.8, 1, 14], color: 0x0f172a },
      // Grand Finish Sanctuary
      { id: 'l5_p12', type: 'box', position: [0, 8, 115], size: [10, 1, 10], color: 0x090d16 },
    ],
    hazards: [
      { id: 'l5_h1', type: 'spinner', position: [0, 1.2, 18], size: [5.2, 0.4, 0.4], rotationSpeed: 2.2, axis: 'y' },
      { id: 'l5_h2', type: 'spinner', position: [0, 4.2, 56], size: [4.8, 0.4, 0.4], rotationSpeed: -2.6, axis: 'y' },
      { id: 'l5_h3', type: 'spinner', position: [0, 9.2, 100], size: [3.6, 0.4, 0.4], rotationSpeed: 3.2, axis: 'y' },
    ],
    collectibles: [
      { id: 'l5_c1', type: 'coin', position: [0, 1.2, 6], value: 1 },
      { id: 'l5_c2', type: 'coin', position: [0, 1.2, 11], value: 1 },
      { id: 'l5_g1', type: 'gem', position: [0, 2.2, 18], value: 5 },
      { id: 'l5_c3', type: 'coin', position: [0, 2.5, 27], value: 1 },
      { id: 'l5_c4', type: 'coin', position: [0, 4.2, 46], value: 1 },
      { id: 'l5_g2', type: 'gem', position: [0, 4.5, 56], value: 5 },
      { id: 'l5_c5', type: 'coin', position: [0, 4.2, 63], value: 1 },
      { id: 'l5_g3', type: 'gem', position: [0, 11.5, 80], value: 5 }, // In flight from super launch
      { id: 'l5_c6', type: 'coin', position: [0, 9.2, 88], value: 1 },
      { id: 'l5_c7', type: 'coin', position: [0, 9.2, 96], value: 1 },
      { id: 'l5_c8', type: 'coin', position: [0, 9.2, 104], value: 1 },
      { id: 'l5_g4', type: 'gem', position: [0, 9.6, 110], value: 5 },
    ],
    checkpoints: [
      { id: 'l5_cp1', index: 0, position: [0, 4.0, 36], respawnPosition: [0, 5.0, 36], name: 'Citadel Gate' },
      { id: 'l5_cp2', index: 1, position: [0, 4.0, 66], respawnPosition: [0, 5.0, 66], name: 'Thunder Spire' },
    ],
    portal: {
      position: [0, 9.2, 117],
    },
  },
];
