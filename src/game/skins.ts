import * as THREE from 'three';
import { BallSkin } from './types.ts';

export const BALL_SKINS: BallSkin[] = [
  {
    id: 'marble_classic',
    name: 'Aero Pearl',
    description: 'Pristine polished porcelain with vibrant cyan racing bands.',
    price: 0,
    unlocked: true,
    roughness: 0.15,
    metalness: 0.1,
    baseColor: 0xffffff,
    patternType: 'marble',
  },
  {
    id: 'cyber_pulse',
    name: 'Cyber Core',
    description: 'High-tech obsidian sphere with glowing cyan circuit vectors.',
    price: 80,
    unlocked: false,
    roughness: 0.2,
    metalness: 0.85,
    baseColor: 0x111625,
    emissive: 0x00f0ff,
    patternType: 'cyber',
  },
  {
    id: 'magma_molten',
    name: 'Magma Flare',
    description: 'Igneous volcanic mantle pulsating with molten thermal fissures.',
    price: 150,
    unlocked: false,
    roughness: 0.45,
    metalness: 0.4,
    baseColor: 0x240804,
    emissive: 0xff5500,
    patternType: 'magma',
  },
  {
    id: 'gold_champion',
    name: 'Solar Monarch',
    description: 'Refined 24K brushed gold adorned with royal imperial trim.',
    price: 240,
    unlocked: false,
    roughness: 0.18,
    metalness: 0.95,
    baseColor: 0xf5c330,
    patternType: 'gold',
  },
  {
    id: 'cosmos_nebula',
    name: 'Cosmic Drift',
    description: 'Deep violet celestial nebula swirling with distant stardust.',
    price: 320,
    unlocked: false,
    roughness: 0.25,
    metalness: 0.6,
    baseColor: 0x2a0d45,
    emissive: 0xba68c8,
    patternType: 'cosmos',
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Matrix',
    description: 'Hexagonal crystalline emerald matrix with luminous lime seams.',
    price: 450,
    unlocked: false,
    roughness: 0.2,
    metalness: 0.75,
    baseColor: 0x05351a,
    emissive: 0x00ff88,
    patternType: 'emerald',
  },
];

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedurally generates an ultra-sharp 512x512 canvas texture for a ball skin
 */
export function getSkinTexture(skin: BallSkin): THREE.CanvasTexture {
  if (textureCache.has(skin.id)) {
    return textureCache.get(skin.id)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const { patternType } = skin;

  if (patternType === 'marble') {
    // Pure white pearl with cyan & electric blue racing stripes and subtle marbling
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle marble veins
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 90);
      ctx.bezierCurveTo(150, i * 90 + 40, 350, i * 90 - 40, 512, i * 90 + 20);
      ctx.stroke();
    }

    // Bold racing stripes
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(180, 0, 48, 512);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(238, 0, 24, 512);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(270, 0, 10, 512);

    // Cross equator rings
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(256, 256, 180, 0, Math.PI * 2);
    ctx.stroke();
  } else if (patternType === 'cyber') {
    // Dark metallic with luminous cyan circuit traces
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, 512, 512);

    // Grid dots
    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
    for (let x = 32; x < 512; x += 64) {
      for (let y = 32; y < 512; y += 64) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    // Glowing circuit traces
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    const traces = [
      [[64, 64], [192, 64], [256, 128], [256, 384], [320, 448], [448, 448]],
      [[448, 64], [320, 64], [256, 128]],
      [[64, 448], [192, 448], [256, 384]],
      [[128, 256], [384, 256]],
    ];

    traces.forEach((points) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    });

    // Circuit chip center
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(256, 256, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (patternType === 'magma') {
    // Dark volcanic basalt with glowing lava cracks
    ctx.fillStyle = '#180806';
    ctx.fillRect(0, 0, 512, 512);

    // Basalt plates
    ctx.strokeStyle = '#ff3700';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 14;

    for (let i = 0; i < 12; i++) {
      const startX = (i * 73) % 512;
      const startY = (i * 97) % 512;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo((startX + 120) % 512, (startY + 80) % 512);
      ctx.lineTo((startX + 60) % 512, (startY + 190) % 512);
      ctx.stroke();
    }

    // Inner bright hot lava core lines
    ctx.strokeStyle = '#ffea00';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const startX = (i * 73) % 512;
      const startY = (i * 97) % 512;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo((startX + 120) % 512, (startY + 80) % 512);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  } else if (patternType === 'gold') {
    // Radiant gold base with royal engraved ornaments
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Engraved rings and crown filigree
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.arc(256, 256, 200, 0, Math.PI * 2);
    ctx.stroke();

    // Radial spokes
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(angle) * 120, 256 + Math.sin(angle) * 120);
      ctx.lineTo(256 + Math.cos(angle) * 200, 256 + Math.sin(angle) * 200);
      ctx.stroke();
    }

    // Center jewel setting
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(256, 256, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fffbeb';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (patternType === 'cosmos') {
    // Violet nebula clouds with twinkling starlight
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 320);
    grad.addColorStop(0, '#581c87');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#090514');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Nebula swirl
    ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
    ctx.beginPath();
    ctx.ellipse(256, 256, 220, 90, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.beginPath();
    ctx.ellipse(256, 256, 180, 70, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 90; i++) {
      const sx = (Math.sin(i * 13.7) * 0.5 + 0.5) * 512;
      const sy = (Math.cos(i * 19.3) * 0.5 + 0.5) * 512;
      const sr = (i % 3 === 0) ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (patternType === 'emerald') {
    // Hexagonal crystal matrix with neon green seams
    ctx.fillStyle = '#062615';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 8;

    const hexRadius = 40;
    const h = hexRadius * Math.sin(Math.PI / 3);

    for (let y = -h; y < 512 + h; y += 2 * h) {
      for (let x = -hexRadius; x < 512 + hexRadius; x += 3 * hexRadius) {
        drawHex(ctx, x, y, hexRadius);
        drawHex(ctx, x + 1.5 * hexRadius, y + h, hexRadius);
      }
    }

    ctx.shadowBlur = 0;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(skin.id, texture);
  return texture;
}

function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}
