import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LevelData, PlatformDef, HazardDef, CollectibleDef, CheckpointDef } from './types.ts';
import { BALL_SKINS, getSkinTexture } from './skins.ts';
import { sounds } from './audio.ts';

export interface GameEngineCallbacks {
  onCoinCollected: (count: number) => void;
  onGemCollected: (count: number) => void;
  onCheckpointReached: (name: string) => void;
  onLevelComplete: (timeSec: number) => void;
  onBallFell: () => void;
  onSpeedUpdate: (speed: number) => void;
  onTimeUpdate: (timeSec: number) => void;
}

// Scratch vector allocations outside render loop (Zero GC)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _quat = new THREE.Quaternion();

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  r: number;
  g: number;
  b: number;
  active: boolean;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isSoftwareGl: boolean;
  private callbacks: GameEngineCallbacks;

  // Level & World Objects
  private currentLevel: LevelData | null = null;
  private activeSkinId: string = 'marble_classic';
  private platformMeshes: THREE.Group = new THREE.Group();
  private hazardMeshes: { group: THREE.Group; def: HazardDef }[] = [];
  private collectibleMeshes: { group: THREE.Group; def: CollectibleDef; collected: boolean }[] = [];
  private checkpointMeshes: { group: THREE.Group; def: CheckpointDef; activated: boolean; ring: THREE.Mesh }[] = [];
  private portalGroup: THREE.Group = new THREE.Group();
  private portalVortex: THREE.Mesh | null = null;

  // Ball
  private ballGroup: THREE.Group = new THREE.Group();
  private ballMesh: THREE.Mesh | null = null;
  private ballShadow: THREE.Mesh | null = null;
  private ballRadius: number = 0.5;

  // Ball Physics State
  private ballPos: THREE.Vector3 = new THREE.Vector3();
  private ballVel: THREE.Vector3 = new THREE.Vector3();
  private ballAngularVel: THREE.Vector3 = new THREE.Vector3();
  private isGrounded: boolean = false;
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private activeCheckpointPos: THREE.Vector3 = new THREE.Vector3();

  // Squash & Stretch
  private ballScaleX: number = 1;
  private ballScaleY: number = 1;
  private ballScaleZ: number = 1;

  // Camera State
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 4.2, -7.5);
  private cameraTrauma: number = 0;
  private titleOrbitAngle: number = 0;

  // Particles (Zero GC Pool)
  private readonly MAX_PARTICLES = 160;
  private particlePool: Particle[] = [];
  private particleInstancedMesh: THREE.InstancedMesh | null = null;
  private dummyTransform: THREE.Object3D = new THREE.Object3D();

  // Environment
  private keyLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private cloudGroup: THREE.Group = new THREE.Group();

  // Loop control
  private frameId: number = 0;
  private lastTime: number = 0;
  private levelElapsedTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isTitleMode: boolean = true;
  private isLevelCompleted: boolean = false;
  private isFallingOut: boolean = false;

  // Input states
  private inputX: number = 0;
  private inputZ: number = 0;
  private jumpJustPressed: boolean = false;
  private jumpHeld: boolean = false;

  // Stats
  private coinsCount: number = 0;
  private gemsCount: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Initialize Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 350);

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(this.renderer.domElement);

    // Setup RoomEnvironment Reflections
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback
    }

    // Build hierarchy
    this.scene.add(this.platformMeshes);
    this.scene.add(this.portalGroup);
    this.scene.add(this.cloudGroup);
    this.scene.add(this.ballGroup);

    // Setup Lighting & Atmosphere
    this.setupLighting();
    this.setupBall();
    this.setupParticleSystem();
    this.setupClouds();

    // Bind event listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    this.lastTime = performance.now();
    this.isRunning = true;
    this.tick();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.85);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.keyLight.position.set(20, 35, -20);
    if (!this.isSoftwareGl) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 10;
      this.keyLight.shadow.camera.far = 100;
      this.keyLight.shadow.camera.left = -25;
      this.keyLight.shadow.camera.right = 25;
      this.keyLight.shadow.camera.top = 25;
      this.keyLight.shadow.camera.bottom = -25;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.keyLight);
  }

  private setupBall() {
    const skin = BALL_SKINS.find((s) => s.id === this.activeSkinId) || BALL_SKINS[0];
    const texture = getSkinTexture(skin);

    const ballGeo = new THREE.SphereGeometry(this.ballRadius, 32, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: skin.roughness,
      metalness: skin.metalness,
      color: skin.baseColor,
      emissive: skin.emissive || 0x000000,
      emissiveIntensity: skin.emissive ? 0.35 : 0,
    });

    this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
    if (!this.isSoftwareGl) {
      this.ballMesh.castShadow = true;
    }
    this.ballGroup.add(this.ballMesh);

    // Contact shadow disc on floor
    const shadowGeo = new THREE.CircleGeometry(this.ballRadius * 1.1, 24);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });

    this.ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.ballShadow);
  }

  public updateSkin(skinId: string) {
    this.activeSkinId = skinId;
    const skin = BALL_SKINS.find((s) => s.id === skinId) || BALL_SKINS[0];
    if (this.ballMesh) {
      const texture = getSkinTexture(skin);
      const mat = this.ballMesh.material as THREE.MeshStandardMaterial;
      mat.map = texture;
      mat.roughness = skin.roughness;
      mat.metalness = skin.metalness;
      mat.color.setHex(skin.baseColor);
      mat.emissive.setHex(skin.emissive || 0x000000);
      mat.emissiveIntensity = skin.emissive ? 0.35 : 0;
      mat.needsUpdate = true;
    }
  }

  private setupParticleSystem() {
    // Zero-GC Particle Pool
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.particlePool.push({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        scale: 0.1,
        r: 1,
        g: 1,
        b: 1,
        active: false,
      });
    }

    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleInstancedMesh = new THREE.InstancedMesh(geo, mat, this.MAX_PARTICLES);
    this.particleInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleInstancedMesh.frustumCulled = false;
    this.scene.add(this.particleInstancedMesh);
  }

  public spawnParticles(
    origin: { x: number; y: number; z: number },
    count: number,
    colorHex: number,
    speed = 4,
    size = 0.14
  ) {
    const col = new THREE.Color(colorHex);
    let spawned = 0;
    for (let i = 0; i < this.MAX_PARTICLES && spawned < count; i++) {
      const p = this.particlePool[i];
      if (!p.active) {
        p.active = true;
        p.x = origin.x;
        p.y = origin.y;
        p.z = origin.z;
        p.vx = (Math.random() - 0.5) * speed;
        p.vy = Math.random() * speed * 0.8 + 1.2;
        p.vz = (Math.random() - 0.5) * speed;
        p.life = 0;
        p.maxLife = 0.5 + Math.random() * 0.4;
        p.scale = size * (0.8 + Math.random() * 0.4);
        p.r = col.r;
        p.g = col.g;
        p.b = col.b;
        spawned++;
      }
    }
  }

  private setupClouds() {
    // Distant procedural floating cloud groups & mountain peaks for depth
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    const puffGeo = new THREE.SphereGeometry(6, 12, 10);
    for (let i = 0; i < 16; i++) {
      const cloudPuff = new THREE.Group();
      const x = (Math.sin(i * 1.7) * 90) + (i % 2 === 0 ? 30 : -30);
      const y = -10 - (i % 3) * 6;
      const z = i * 14 - 10;

      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set((p - 1.5) * 5, Math.sin(p) * 2, (Math.random() - 0.5) * 4);
        puff.scale.set(1.2, 0.6, 1.2);
        cloudPuff.add(puff);
      }
      cloudPuff.position.set(x, y, z);
      this.cloudGroup.add(cloudPuff);
    }
  }

  public loadLevel(level: LevelData) {
    this.currentLevel = level;
    this.levelElapsedTime = 0;
    this.isLevelCompleted = false;
    this.isFallingOut = false;
    this.coinsCount = 0;
    this.gemsCount = 0;

    // Sky & Fog Theme
    this.scene.background = new THREE.Color(level.skyColorBottom);
    this.scene.fog = new THREE.FogExp2(level.fogColor, 0.012);

    if (this.hemiLight) {
      this.hemiLight.color.setHex(level.ambientColor);
    }
    if (this.keyLight) {
      this.keyLight.color.setHex(level.keyLightColor);
    }

    // Clean previous level meshes
    while (this.platformMeshes.children.length > 0) {
      const child = this.platformMeshes.children[0];
      this.platformMeshes.remove(child);
    }
    while (this.portalGroup.children.length > 0) {
      const child = this.portalGroup.children[0];
      this.portalGroup.remove(child);
    }
    this.hazardMeshes = [];
    this.collectibleMeshes = [];
    this.checkpointMeshes = [];

    // Build Platforms
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.2 });

    level.platforms.forEach((p) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(p.position[0], p.position[1], p.position[2]);
      if (p.rotation) {
        pGroup.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
      }

      // Base platform slab (3-part composite design: main slab, rim edge, tapered rock underside)
      const mainMat = new THREE.MeshStandardMaterial({
        color: p.color || 0x475569,
        roughness: 0.6,
        metalness: 0.15,
      });

      const slab = new THREE.Mesh(boxGeo, mainMat);
      slab.scale.set(p.size[0], p.size[1], p.size[2]);
      if (!this.isSoftwareGl) slab.receiveShadow = true;
      pGroup.add(slab);

      // Decorative top border trim
      const rim = new THREE.Mesh(boxGeo, borderMat);
      rim.scale.set(p.size[0] + 0.15, 0.1, p.size[2] + 0.15);
      rim.position.y = p.size[1] * 0.5 - 0.05;
      pGroup.add(rim);

      // Tapered floating rock underside (prevents flat box feeling)
      const underMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.9,
        metalness: 0.1,
      });
      const underGeo = new THREE.ConeGeometry(Math.min(p.size[0], p.size[2]) * 0.45, p.size[1] * 2.2, 5);
      const under = new THREE.Mesh(underGeo, underMat);
      under.rotation.x = Math.PI;
      under.position.y = -p.size[1] * 1.1;
      pGroup.add(under);

      // Special platform details
      if (p.type === 'bouncy') {
        // High launch bounce pad
        const padGeo = new THREE.CylinderGeometry(p.size[0] * 0.35, p.size[0] * 0.4, 0.2, 16);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.5,
          roughness: 0.2,
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = p.size[1] * 0.5 + 0.1;
        pGroup.add(pad);
      } else if (p.type === 'speed_strip') {
        // Neon directional chevron strips
        const stripGeo = new THREE.BoxGeometry(p.size[0] * 0.6, 0.05, p.size[2] * 0.8);
        const stripMat = new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00c4d6,
          emissiveIntensity: 0.8,
          roughness: 0.1,
        });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.y = p.size[1] * 0.5 + 0.03;
        pGroup.add(strip);
      }

      (pGroup as unknown as { platformDef: PlatformDef }).platformDef = p;
      this.platformMeshes.add(pGroup);
    });

    // Build Hazards
    level.hazards.forEach((h) => {
      const hGroup = new THREE.Group();
      hGroup.position.set(h.position[0], h.position[1], h.position[2]);

      // Composite mechanical spinning hazard: central cylinder pillar, sweeping cross arm, spiked end caps
      const armGeo = new THREE.BoxGeometry(h.size[0], h.size[1], h.size[2]);
      const hazardMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0x991b1b,
        emissiveIntensity: 0.4,
      });
      const arm = new THREE.Mesh(armGeo, hazardMat);
      hGroup.add(arm);

      // Center pivot spindle
      const pivotGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12);
      const pivotMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      const pivot = new THREE.Mesh(pivotGeo, pivotMat);
      hGroup.add(pivot);

      // Warning end cap spheres
      const capGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.5 });
      const cap1 = new THREE.Mesh(capGeo, capMat);
      cap1.position.x = h.size[0] * 0.5;
      const cap2 = new THREE.Mesh(capGeo, capMat);
      cap2.position.x = -h.size[0] * 0.5;
      hGroup.add(cap1);
      hGroup.add(cap2);

      this.scene.add(hGroup);
      this.hazardMeshes.push({ group: hGroup, def: h });
    });

    // Build Collectibles (Coins & Gems)
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
    });

    const gemGeo = new THREE.OctahedronGeometry(0.45, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.1,
      metalness: 0.7,
      emissive: 0x0891b2,
      emissiveIntensity: 0.45,
    });

    level.collectibles.forEach((c) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(c.position[0], c.position[1], c.position[2]);

      if (c.type === 'coin') {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.z = Math.PI / 2;
        cGroup.add(coin);
      } else {
        const gem = new THREE.Mesh(gemGeo, gemMat);
        cGroup.add(gem);
      }

      this.scene.add(cGroup);
      this.collectibleMeshes.push({ group: cGroup, def: c, collected: false });
    });

    // Build Checkpoints
    level.checkpoints.forEach((cp) => {
      const cpGroup = new THREE.Group();
      cpGroup.position.set(cp.position[0], cp.position[1], cp.position[2]);

      // Ornate stone pedestal
      const pedGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.4, 16);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      cpGroup.add(ped);

      // Flag pole
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.4;
      cpGroup.add(pole);

      // Energy ring indicator
      const ringGeo = new THREE.TorusGeometry(0.7, 0.08, 12, 24);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.5;
      cpGroup.add(ring);

      this.scene.add(cpGroup);
      this.checkpointMeshes.push({ group: cpGroup, def: cp, activated: false, ring });
    });

    // Build Finish Portal (Composite 3D archway + spinning vortex)
    this.portalGroup.position.set(level.portal.position[0], level.portal.position[1], level.portal.position[2]);

    const archOuterGeo = new THREE.TorusGeometry(1.9, 0.24, 16, 32);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3,
    });
    const arch = new THREE.Mesh(archOuterGeo, archMat);
    this.portalGroup.add(arch);

    // Inner glowing energy vortex
    const vortexGeo = new THREE.CircleGeometry(1.65, 32);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    this.portalVortex = new THREE.Mesh(vortexGeo, vortexMat);
    this.portalGroup.add(this.portalVortex);

    // Stone base plinths
    const baseGeo = new THREE.BoxGeometry(1.2, 0.6, 1.2);
    const plinth1 = new THREE.Mesh(baseGeo, borderMat);
    plinth1.position.set(-1.8, -1.6, 0);
    const plinth2 = new THREE.Mesh(baseGeo, borderMat);
    plinth2.position.set(1.8, -1.6, 0);
    this.portalGroup.add(plinth1);
    this.portalGroup.add(plinth2);

    // Reset ball position to level spawn
    this.respawnAt(level.spawnPoint);
  }

  public respawnAt(pos: [number, number, number]) {
    this.ballPos.set(pos[0], pos[1], pos[2]);
    this.ballVel.set(0, 0, 0);
    this.ballAngularVel.set(0, 0, 0);
    this.isGrounded = false;
    this.isFallingOut = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.cameraTarget.copy(this.ballPos);
    this.camera.position.set(this.ballPos.x + this.cameraOffset.x, this.ballPos.y + this.cameraOffset.y, this.ballPos.z + this.cameraOffset.z);
    this.camera.lookAt(this.ballPos.x, this.ballPos.y + 0.8, this.ballPos.z + 3);
    this.activeCheckpointPos.set(pos[0], pos[1], pos[2]);
  }

  public respawnAtLastCheckpoint() {
    this.respawnAt([this.activeCheckpointPos.x, this.activeCheckpointPos.y, this.activeCheckpointPos.z]);
    this.spawnParticles(this.ballPos, 24, 0x06b6d4, 5, 0.16);
    sounds.playCheckpoint();
  }

  public startPlaying() {
    this.isTitleMode = false;
    this.isPaused = false;
    this.isLevelCompleted = false;
    this.levelElapsedTime = 0;
    if (this.currentLevel) {
      this.respawnAt(this.currentLevel.spawnPoint);
    }
  }

  public returnToTitle() {
    this.isTitleMode = true;
    this.isPaused = false;
    sounds.stopRollingSound();
    if (this.currentLevel) {
      this.respawnAt(this.currentLevel.spawnPoint);
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      sounds.stopRollingSound();
    }
  }

  public setInput(x: number, z: number, jumpJustPressed: boolean, jumpHeld: boolean) {
    this.inputX = x;
    this.inputZ = z;
    if (jumpJustPressed) {
      this.jumpJustPressed = true;
    }
    this.jumpHeld = jumpHeld;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.inputZ = 1;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.inputZ = -1;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputX = -1;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputX = 1;

    if (e.code === 'Space') {
      if (!this.jumpHeld) {
        this.jumpJustPressed = true;
      }
      this.jumpHeld = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if ((e.code === 'KeyW' || e.code === 'ArrowUp') && this.inputZ > 0) this.inputZ = 0;
    if ((e.code === 'KeyS' || e.code === 'ArrowDown') && this.inputZ < 0) this.inputZ = 0;
    if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && this.inputX < 0) this.inputX = 0;
    if ((e.code === 'KeyD' || e.code === 'ArrowRight') && this.inputX > 0) this.inputX = 0;

    if (e.code === 'Space') {
      this.jumpHeld = false;
    }
  };

  private onBlur = () => {
    this.inputX = 0;
    this.inputZ = 0;
    this.jumpJustPressed = false;
    this.jumpHeld = false;
    sounds.stopRollingSound();
  };

  private onResize = () => {
    if (!this.container) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) * 0.001;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05); // clamped simulation delta

    if (!this.isPaused) {
      if (this.isTitleMode) {
        this.updateTitleMode(dt);
      } else {
        this.updateGameplay(dt);
      }
    }

    this.updateParticles(dt);
    this.render();

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateTitleMode(dt: number) {
    this.titleOrbitAngle += dt * 0.35;
    const radius = 14;
    const cx = this.ballPos.x + Math.sin(this.titleOrbitAngle) * radius;
    const cz = this.ballPos.z + Math.cos(this.titleOrbitAngle) * radius;
    const cy = this.ballPos.y + 6;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.ballPos.x, this.ballPos.y + 0.5, this.ballPos.z);

    // Gentle ball turntable spin in title preview
    if (this.ballMesh) {
      this.ballMesh.rotation.y += dt * 0.8;
      this.ballGroup.position.copy(this.ballPos);
      if (this.ballShadow) {
        this.ballShadow.position.set(this.ballPos.x, this.ballPos.y - this.ballRadius + 0.02, this.ballPos.z);
      }
    }

    // Animate moving platforms and collectibles in title view
    this.animateLevelDecor(dt);
  }

  private updateGameplay(dt: number) {
    if (this.isLevelCompleted) {
      // Portal completion animation
      if (this.ballMesh) {
        this.ballMesh.scale.multiplyScalar(Math.max(0.01, 1 - dt * 2.5));
        this.ballPos.y += dt * 1.5;
        this.ballGroup.position.copy(this.ballPos);
      }
      return;
    }

    this.levelElapsedTime += dt;
    this.callbacks.onTimeUpdate(this.levelElapsedTime);

    // Moving platforms position updates
    this.animateLevelDecor(dt);

    // Timers
    if (this.isGrounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.jumpJustPressed) {
      this.jumpBufferTimer = 0.12;
      this.jumpJustPressed = false;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // Kinematic Acceleration
    const accel = this.isGrounded ? 32.0 : 16.0;
    this.ballVel.x += this.inputX * accel * dt;
    this.ballVel.z += this.inputZ * accel * dt;

    // Friction
    const friction = this.isGrounded ? 0.94 : 0.99;
    this.ballVel.x *= Math.pow(friction, dt * 60);
    this.ballVel.z *= Math.pow(friction, dt * 60);

    // Gravity
    this.ballVel.y -= 26.0 * dt;

    // Jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.ballVel.y = 11.2;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.ballScaleY = 1.25;
      this.ballScaleX = 0.82;
      this.ballScaleZ = 0.82;
      sounds.playJump();
      this.spawnParticles(this.ballPos, 6, 0xffffff, 2, 0.09);
    } else if (!this.jumpHeld && this.ballVel.y > 0) {
      // Variable jump cut
      this.ballVel.y *= Math.pow(0.5, dt * 60);
    }

    // Integrate position
    this.ballPos.x += this.ballVel.x * dt;
    this.ballPos.y += this.ballVel.y * dt;
    this.ballPos.z += this.ballVel.z * dt;

    // Platform Collisions
    this.resolvePlatformCollisions();

    // Hazard Collisions
    this.checkHazardCollisions();

    // Collectible Collisions
    this.checkCollectibleCollisions();

    // Checkpoint Collisions
    this.checkCheckpointCollisions();

    // Finish Portal Collision
    this.checkPortalCollision();

    // Fall out-of-bounds detection
    if (this.ballPos.y < -12 && !this.isFallingOut) {
      this.isFallingOut = true;
      sounds.playHazardHit();
      this.callbacks.onBallFell();
    }

    // Ball Rolling Rotation
    const speed = Math.sqrt(this.ballVel.x * this.ballVel.x + this.ballVel.z * this.ballVel.z);
    this.callbacks.onSpeedUpdate(speed);
    sounds.updateRollingSound(speed, this.isGrounded);

    if (this.ballMesh) {
      // Rolling torque rotation matching velocity
      const rollAngleZ = -(this.ballVel.x / this.ballRadius) * dt;
      const rollAngleX = (this.ballVel.z / this.ballRadius) * dt;

      _quat.setFromAxisAngle(_v1.set(1, 0, 0), rollAngleX);
      this.ballMesh.quaternion.multiply(_quat);
      _quat.setFromAxisAngle(_v2.set(0, 0, 1), rollAngleZ);
      this.ballMesh.quaternion.multiply(_quat);

      // Smooth squash-stretch restoration
      this.ballScaleX = THREE.MathUtils.damp(this.ballScaleX, 1, 14, dt);
      this.ballScaleY = THREE.MathUtils.damp(this.ballScaleY, 1, 14, dt);
      this.ballScaleZ = THREE.MathUtils.damp(this.ballScaleZ, 1, 14, dt);
      this.ballMesh.scale.set(this.ballScaleX, this.ballScaleY, this.ballScaleZ);

      this.ballGroup.position.copy(this.ballPos);

      // Contact Shadow update
      if (this.ballShadow) {
        this.ballShadow.position.set(this.ballPos.x, this.ballPos.y - this.ballRadius + 0.02, this.ballPos.z);
        const shadowScale = Math.max(0.2, 1 - Math.max(0, (this.ballPos.y - 0.5) * 0.12));
        this.ballShadow.scale.set(shadowScale, shadowScale, 1);
      }
    }

    // Camera follow with smooth damping & subtle camera trauma
    this.updateCamera(dt);
  }

  private resolvePlatformCollisions() {
    if (!this.currentLevel) return;

    let foundGround = false;

    for (let i = 0; i < this.platformMeshes.children.length; i++) {
      const pGroup = this.platformMeshes.children[i] as THREE.Group;
      const p = (pGroup as unknown as { platformDef: PlatformDef }).platformDef;

      // Platform world bounding box
      const halfW = p.size[0] * 0.5;
      const halfH = p.size[1] * 0.5;
      const halfD = p.size[2] * 0.5;

      const px = pGroup.position.x;
      const py = pGroup.position.y;
      const pz = pGroup.position.z;

      const minX = px - halfW;
      const maxX = px + halfW;
      const minY = py - halfH;
      const maxY = py + halfH;
      const minZ = pz - halfD;
      const maxZ = pz + halfD;

      // Check top surface collision
      const margin = 0.05;
      if (
        this.ballPos.x >= minX - this.ballRadius * 0.7 &&
        this.ballPos.x <= maxX + this.ballRadius * 0.7 &&
        this.ballPos.z >= minZ - this.ballRadius * 0.7 &&
        this.ballPos.z <= maxZ + this.ballRadius * 0.7
      ) {
        const topY = maxY + this.ballRadius;
        if (this.ballPos.y <= topY + margin && this.ballPos.y >= topY - 0.75) {
          // Landing impact squash
          if (!this.isGrounded && this.ballVel.y < -3) {
            sounds.playLand(Math.abs(this.ballVel.y));
            this.ballScaleY = 0.75;
            this.ballScaleX = 1.2;
            this.ballScaleZ = 1.2;
            this.spawnParticles(this.ballPos, 4, 0xffffff, 2, 0.08);
          }

          this.ballPos.y = topY;
          this.ballVel.y = Math.max(0, this.ballVel.y);
          this.isGrounded = true;
          foundGround = true;

          // Special platform triggers
          if (p.type === 'bouncy') {
            this.ballVel.y = 20.5; // Super high launch!
            this.isGrounded = false;
            this.ballScaleY = 1.45;
            this.ballScaleX = 0.7;
            this.ballScaleZ = 0.7;
            sounds.playBouncePad();
            this.spawnParticles(this.ballPos, 18, 0x10b981, 6, 0.16);
            this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35);
          } else if (p.type === 'speed_strip') {
            this.ballVel.z += 8.0 * (1 / 60);
            sounds.playSpeedBoost();
            this.spawnParticles(this.ballPos, 8, 0x00f0ff, 4, 0.12);
          }

          // If platform is moving, apply its velocity
          if (p.type === 'moving' && p.moveAxis) {
            const time = this.levelElapsedTime;
            const dist = p.moveDistance || 3;
            const spd = p.moveSpeed || 2;
            const velOffset = Math.cos(time * spd) * dist * spd * (1 / 60);
            if (p.moveAxis === 'x') this.ballPos.x += velOffset;
            if (p.moveAxis === 'y') this.ballPos.y += velOffset;
          }
        }
      }
    }

    if (!foundGround) {
      this.isGrounded = false;
    }
  }

  private checkHazardCollisions() {
    for (const h of this.hazardMeshes) {
      const dist = this.ballPos.distanceTo(h.group.position);
      const hazardRadius = h.def.size[0] * 0.5 + this.ballRadius * 0.8;
      if (dist < hazardRadius) {
        // Push ball backward with knockback impulse
        const knockDir = _v1.subVectors(this.ballPos, h.group.position).normalize();
        this.ballVel.x += knockDir.x * 12;
        this.ballVel.z += knockDir.z * 12;
        this.ballVel.y += 6;

        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.6);
        sounds.playHazardHit();
        this.spawnParticles(this.ballPos, 20, 0xef4444, 7, 0.18);
      }
    }
  }

  private checkCollectibleCollisions() {
    for (const c of this.collectibleMeshes) {
      if (c.collected) continue;
      const dist = this.ballPos.distanceTo(c.group.position);
      if (dist < 1.1) {
        c.collected = true;
        c.group.visible = false;

        if (c.def.type === 'coin') {
          this.coinsCount += c.def.value;
          this.callbacks.onCoinCollected(this.coinsCount);
          sounds.playCoin();
          this.spawnParticles(c.group.position, 12, 0xf59e0b, 4, 0.14);
        } else {
          this.gemsCount += 1;
          this.callbacks.onGemCollected(this.gemsCount);
          sounds.playGem();
          this.spawnParticles(c.group.position, 22, 0x06b6d4, 6, 0.2);
        }
      }
    }
  }

  private checkCheckpointCollisions() {
    for (const cp of this.checkpointMeshes) {
      if (cp.activated) continue;
      const dist = this.ballPos.distanceTo(cp.group.position);
      if (dist < 2.2) {
        cp.activated = true;
        this.activeCheckpointPos.set(cp.def.respawnPosition[0], cp.def.respawnPosition[1], cp.def.respawnPosition[2]);

        // Ring changes from orange to emerald green
        const ringMat = cp.ring.material as THREE.MeshStandardMaterial;
        ringMat.color.setHex(0x10b981);
        ringMat.emissive.setHex(0x059669);
        ringMat.emissiveIntensity = 1.0;

        sounds.playCheckpoint();
        this.callbacks.onCheckpointReached(cp.def.name || `Checkpoint ${cp.def.index + 1}`);
        this.spawnParticles(cp.group.position, 30, 0x10b981, 7, 0.2);
      }
    }
  }

  private checkPortalCollision() {
    if (this.isLevelCompleted || !this.currentLevel) return;
    const portalPos = _v1.set(
      this.currentLevel.portal.position[0],
      this.currentLevel.portal.position[1],
      this.currentLevel.portal.position[2]
    );
    const dist = this.ballPos.distanceTo(portalPos);
    if (dist < 2.0) {
      this.isLevelCompleted = true;
      sounds.playLevelComplete();
      sounds.stopRollingSound();
      this.spawnParticles(this.ballPos, 60, 0x38bdf8, 8, 0.24);
      this.callbacks.onLevelComplete(this.levelElapsedTime);
    }
  }

  private animateLevelDecor(dt: number) {
    const time = this.levelElapsedTime;

    // Moving platforms
    for (let i = 0; i < this.platformMeshes.children.length; i++) {
      const pGroup = this.platformMeshes.children[i] as THREE.Group;
      const p = (pGroup as unknown as { platformDef: PlatformDef }).platformDef;
      if (p.type === 'moving' && p.moveAxis) {
        const dist = p.moveDistance || 3;
        const spd = p.moveSpeed || 2;
        const offset = Math.sin(time * spd) * dist;
        if (p.moveAxis === 'x') pGroup.position.x = p.position[0] + offset;
        if (p.moveAxis === 'y') pGroup.position.y = p.position[1] + offset;
        if (p.moveAxis === 'z') pGroup.position.z = p.position[2] + offset;
      }
    }

    // Hazards
    for (const h of this.hazardMeshes) {
      const rot = (h.def.rotationSpeed || 2) * dt;
      if (h.def.axis === 'y' || !h.def.axis) h.group.rotation.y += rot;
      if (h.def.axis === 'x') h.group.rotation.x += rot;
      if (h.def.axis === 'z') h.group.rotation.z += rot;
    }

    // Collectibles (hover & spin)
    for (const c of this.collectibleMeshes) {
      if (!c.collected) {
        c.group.rotation.y += dt * 3;
        c.group.position.y = c.def.position[1] + Math.sin(time * 3 + c.group.position.z) * 0.15;
      }
    }

    // Portal vortex rotation
    if (this.portalVortex) {
      this.portalVortex.rotation.z += dt * 1.8;
    }

    // Floating cloud drift
    this.cloudGroup.children.forEach((c, idx) => {
      c.position.x += dt * (0.4 + (idx % 3) * 0.2);
      if (c.position.x > 120) c.position.x = -120;
    });
  }

  private updateCamera(dt: number) {
    // Desired camera position behind ball
    const targetCamX = this.ballPos.x + this.cameraOffset.x;
    const targetCamY = this.ballPos.y + this.cameraOffset.y;
    const targetCamZ = this.ballPos.z + this.cameraOffset.z;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 7, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 7, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 7, dt);

    const targetLookX = this.ballPos.x;
    const targetLookY = this.ballPos.y + 0.8;
    const targetLookZ = this.ballPos.z + 4.5;

    this.cameraTarget.x = THREE.MathUtils.damp(this.cameraTarget.x, targetLookX, 9, dt);
    this.cameraTarget.y = THREE.MathUtils.damp(this.cameraTarget.y, targetLookY, 9, dt);
    this.cameraTarget.z = THREE.MathUtils.damp(this.cameraTarget.z, targetLookZ, 9, dt);

    // Apply decaying camera trauma shake
    if (this.cameraTrauma > 0) {
      const shake = this.cameraTrauma * this.cameraTrauma * 0.4;
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake;
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.2);
    }

    this.camera.lookAt(this.cameraTarget);
  }

  private updateParticles(dt: number) {
    if (!this.particleInstancedMesh) return;

    let activeCount = 0;
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const p = this.particlePool[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.dummyTransform.scale.set(0, 0, 0);
          this.dummyTransform.updateMatrix();
          this.particleInstancedMesh.setMatrixAt(i, this.dummyTransform.matrix);
          continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 9.8 * dt; // gravity on particles

        const progress = p.life / p.maxLife;
        const scale = p.scale * (1 - progress);

        this.dummyTransform.position.set(p.x, p.y, p.z);
        this.dummyTransform.scale.set(scale, scale, scale);
        this.dummyTransform.updateMatrix();
        this.particleInstancedMesh.setMatrixAt(i, this.dummyTransform.matrix);
        activeCount++;
      } else {
        this.dummyTransform.scale.set(0, 0, 0);
        this.dummyTransform.updateMatrix();
        this.particleInstancedMesh.setMatrixAt(i, this.dummyTransform.matrix);
      }
    }

    this.particleInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.isRunning = false;
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);

    sounds.stopRollingSound();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
