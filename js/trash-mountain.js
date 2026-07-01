let scene, camera, renderer, controls;
let trashObjects = [];
let landingImpacts = [];
let ground;
let isSceneReady = false;
let dumpAnimations = [];

const PILE_GRID = 36;
const PILE_RADIUS = 4;
let pileGrid = new Float32Array(PILE_GRID * PILE_GRID);

function initPileGrid() {
  pileGrid.fill(0);
}

function getPileIdx(x, z) {
  const half = PILE_RADIUS;
  const cell = PILE_GRID / (half * 2);
  const gi = Math.floor((x + half) * cell);
  const gj = Math.floor((z + half) * cell);
  if (gi < 0 || gi >= PILE_GRID || gj < 0 || gj >= PILE_GRID) return -1;
  return gi + gj * PILE_GRID;
}

function getPileHeight(x, z) {
  const idx = getPileIdx(x, z);
  return idx >= 0 ? pileGrid[idx] : 0;
}

function placeOnPile(category, objHeight) {
  let bestX = 0, bestZ = 0, bestY = Infinity;
  for (let attempt = 0; attempt < 25; attempt++) {
    const g = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
    const x = g * PILE_RADIUS * 1.8;
    const z = g * PILE_RADIUS * 1.8;
    const h = getPileHeight(x, z);
    if (h < bestY) {
      bestX = x; bestZ = z; bestY = h;
    }
  }
  const idx = getPileIdx(bestX, bestZ);
  if (idx >= 0) {
    pileGrid[idx] += objHeight;
    const xIdx = idx % PILE_GRID;
    const zIdx = Math.floor(idx / PILE_GRID);
    const spreadFactor = objHeight * 0.5;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        const ni = xIdx + dx;
        const nj = zIdx + dz;
        if (ni >= 0 && ni < PILE_GRID && nj >= 0 && nj < PILE_GRID) {
          pileGrid[ni + nj * PILE_GRID] += spreadFactor;
        }
      }
    }
  }
  const jitter = 0.2;
  return { x: bestX + (Math.random() - 0.5) * jitter, z: bestZ + (Math.random() - 0.5) * jitter, y: bestY + 0.1 };
}

const TRASH_COLORS = {
  '분노': 0xff1744,
  '짜증': 0xff6d00,
  '후회': 0x9c27b0,
  '실망': 0x4a148c,
  '서운함': 0x5c6bc0,
  '상처': 0x7b1fa2,
  '슬픔': 0x1565c0,
  '불안': 0x827717,
  '스트레스': 0xe65100,
  '외로움': 0x37474f,
  '무기력': 0x616161,
  '지침': 0x78909c,
};

const DEFAULT_COLOR = 0x888888;

function initScene() {
  const container = document.getElementById('three-container');
  if (!container) return;

  let w = container.clientWidth;
  let h = container.clientHeight;
  if (w === 0 || h === 0) {
    w = window.innerWidth;
    h = window.innerHeight;
  }
  container.style.height = h + 'px';

  if (!window.WebGLRenderingContext) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-family:sans-serif;text-align:center;padding:2rem"><div><div style="font-size:4rem;margin-bottom:1rem">🗑️</div><h2 style="color:#39ff14;margin-bottom:.5rem">WebGL을 지원하지 않는 브라우저입니다</h2><p style="color:#888">Chrome, Safari, Firefox 최신 버전으로 접속해주세요</p></div></div>';
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 30, 60);

  camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
  camera.position.set(16, 11, 22);
  camera.lookAt(0, 3, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.minPolarAngle = 0.1;
  controls.maxDistance = 45;
  controls.minDistance = 8;
  controls.target.set(0, 3, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  initPileGrid();
  setupLights();
  createGround();
  createBaseTrash();
  addAtmosphere();

  window.addEventListener('resize', onResize);
  isSceneReady = true;
  animate();
}

function setupLights() {
  const ambient = new THREE.AmbientLight(0x444444, 0.7);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xfff0d0, 1.4);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  const d = 25;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x88aaff, 0.6);
  fillLight.position.set(-10, 5, -10);
  scene.add(fillLight);

  const pointLight = new THREE.PointLight(0xffaa55, 0.5, 25);
  pointLight.position.set(0, 5, 0);
  scene.add(pointLight);
}

function createGround() {
  const geo = new THREE.CircleGeometry(25, 64);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 0.8,
  });
  ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  const ringGeo = new THREE.RingGeometry(0.5, 22, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x39ff14,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.05;
  scene.add(ring);

  const innerRingGeo = new THREE.RingGeometry(0.5, 4, 32);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0xff6633,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = -0.03;
  scene.add(innerRing);
}

function createBaseTrash() {
  const categories = ['can', 'can', 'can', 'box', 'box', 'tv', 'tv', 'fridge', 'car'];
  const colors = [0xff1744, 0xff6d00, 0xffee00, 0x00e676, 0x2979ff, 0xb388ff, 0xff88aa, 0x88ddff, 0xffaa44];
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const fakeContentLen = cat === 'can' ? 30 : cat === 'box' ? 120 : cat === 'tv' ? 350 : cat === 'fridge' ? 600 : 1200;
    const color = colors[i % colors.length];
    const w = [20, 30, 15, 60, 80, 100, 150, 200, 300][i];
    const objHeight = getObjHeight(cat);
    const pilePos = placeOnPile(cat, objHeight);
    const mesh = createTrashMesh(w, fakeContentLen, color, [], cat);
    mesh.position.set(pilePos.x, pilePos.y + 0.1, pilePos.z);
    mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    trashObjects.push(mesh);
  }
}

function addAtmosphere() {
  const particleCount = 2000;
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const r = 10 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = Math.random() * 15;
    positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
    sizes[i] = 0.02 + Math.random() * 0.08;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0x39ff14,
    size: 0.05,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(geo, mat);
  particles.position.y = 0;
  scene.add(particles);
}

function getTagColor(tags) {
  for (const tag of tags) {
    if (TRASH_COLORS[tag]) return TRASH_COLORS[tag];
  }
  return DEFAULT_COLOR;
}

function hexToRgb(hex) {
  return { r: (hex >> 16) & 0xff, g: (hex >> 8) & 0xff, b: hex & 0xff };
}

function createCanTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const { r, g, b } = hexToRgb(accentColor);

  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, `rgb(${r>>1},${g>>1},${b>>1})`);
  grad.addColorStop(0.08, `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`);
  grad.addColorStop(0.2, '#eee');
  grad.addColorStop(0.35, `rgb(${r},${g},${b})`);
  grad.addColorStop(0.5, '#ddd');
  grad.addColorStop(0.65, `rgb(${r},${g},${b})`);
  grad.addColorStop(0.8, '#ccc');
  grad.addColorStop(0.92, `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`);
  grad.addColorStop(1, `rgb(${r>>1},${g>>1},${b>>1})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(30, 0, 4, 256);
  ctx.fillRect(120, 0, 4, 256);
  ctx.fillRect(180, 0, 4, 256);

  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(0, 0, 256, 2);
  ctx.fillRect(0, 254, 256, 2);

  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 3;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🥫', 128, 78);

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,255,255,0.12)`;
  ctx.fillRect(40, 100, 176, 1);
  ctx.fillRect(40, 160, 176, 1);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('EMOTION', 128, 135);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('ENERGY DRINK', 128, 155);

  ctx.fillStyle = `rgba(255,255,255,0.06)`;
  ctx.fillRect(30, 175, 196, 40);

  ctx.font = '9px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('500ml   ·   감정쓰레기통', 128, 200);
  ctx.fillText('★ ★ ★ ★ ★', 128, 218);

  ctx.fillStyle = '#888';
  ctx.font = '8px sans-serif';
  ctx.fillText('www.emotionbin.com', 128, 238);

  ctx.shadowBlur = 6;
  ctx.shadowColor = `rgba(${r},${g},${b},0.3)`;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('🍺', 128, 250);
  ctx.shadowBlur = 0;

  return new THREE.CanvasTexture(c);
}

function createBoxTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const { r, g, b } = hexToRgb(accentColor);

  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#d4a86a');
  grad.addColorStop(0.5, '#c89b5e');
  grad.addColorStop(1, '#b0884e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.01 + Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 4, 1);
  }

  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.04})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const y = Math.random() * 256;
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + (Math.random() - 0.5) * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, 226, 226);

  ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 196, 196);

  ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
  ctx.fillRect(90, 70, 76, 120);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(88, 68, 80, 4);
  ctx.fillRect(88, 188, 80, 4);
  ctx.fillRect(88, 68, 4, 124);
  ctx.fillRect(164, 68, 4, 124);

  ctx.fillStyle = '#666';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 2;
  ctx.fillText('📦', 128, 118);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#a33';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('FRAGILE', 128, 160);

  ctx.fillStyle = '#333';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('HANDLE WITH CARE', 128, 180);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('⚠', 128, 200);

  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, 256, 3);
  ctx.fillRect(0, 253, 256, 3);
  ctx.fillRect(0, 0, 3, 256);
  ctx.fillRect(253, 0, 3, 256);

  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(60, 220, 136, 20);

  return new THREE.CanvasTexture(c);
}

function createTVTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  const { r, g, b } = hexToRgb(accentColor);

  const bezelGrad = ctx.createLinearGradient(0, 0, 0, 256);
  bezelGrad.addColorStop(0, '#2a2a2a');
  bezelGrad.addColorStop(0.5, '#1a1a1a');
  bezelGrad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = bezelGrad;
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#080808';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillRect(25, 15, 462, 210);
  ctx.shadowBlur = 0;

  const screenGrad = ctx.createRadialGradient(256, 120, 10, 256, 120, 200);
  screenGrad.addColorStop(0, `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`);
  screenGrad.addColorStop(0.2, `rgb(${r},${g},${b})`);
  screenGrad.addColorStop(0.5, `rgb(${r>>1},${g>>1},${b>>1})`);
  screenGrad.addColorStop(0.8, `rgb(${r>>2},${g>>2},${b>>2})`);
  screenGrad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = screenGrad;
  ctx.fillRect(30, 20, 452, 200);

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(30, 20, 452, 200);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(30, 20, 452, 4);
  ctx.fillRect(30, 216, 452, 4);

  ctx.shadowColor = `rgba(${r},${g},${b},0.3)`;
  ctx.shadowBlur = 25;
  ctx.fillRect(30, 20, 452, 200);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('감정쓰레기통', 256, 130);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.font = '12px sans-serif';
  ctx.fillText('EMOTION BIN', 256, 155);

  ctx.fillStyle = '#333';
  ctx.fillRect(200, 228, 112, 12);

  ctx.fillStyle = '#666';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('POWER', 256, 238);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.shadowColor = `rgb(${r},${g},${b})`;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(256, 248, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#222';
  ctx.fillRect(470, 238, 30, 6);
  ctx.fillStyle = '#444';
  ctx.fillRect(472, 240, 4, 2);
  ctx.fillRect(480, 240, 4, 2);
  ctx.fillRect(488, 240, 4, 2);

  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(25, 0, 462, 15);
  ctx.fillRect(25, 241, 462, 15);

  return new THREE.CanvasTexture(c);
}

function createFridgeTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const ctx = c.getContext('2d');
  const { r, g, b } = hexToRgb(accentColor);

  const metalGrad = ctx.createLinearGradient(0, 0, 128, 0);
  metalGrad.addColorStop(0, '#666');
  metalGrad.addColorStop(0.08, '#c0c0c0');
  metalGrad.addColorStop(0.15, '#e8e8e8');
  metalGrad.addColorStop(0.35, '#f5f5f5');
  metalGrad.addColorStop(0.5, '#fafafa');
  metalGrad.addColorStop(0.65, '#f5f5f5');
  metalGrad.addColorStop(0.85, '#e8e8e8');
  metalGrad.addColorStop(0.92, '#c0c0c0');
  metalGrad.addColorStop(1, '#666');
  ctx.fillStyle = metalGrad;
  ctx.fillRect(0, 0, 128, 256);

  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(0, 0, 128, 2);
  ctx.fillRect(0, 254, 128, 2);

  ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, 116, 116);
  ctx.strokeRect(6, 126, 116, 124);

  ctx.fillStyle = `rgba(${r},${g},${b},0.1)`;
  ctx.fillRect(10, 10, 108, 108);
  ctx.fillRect(10, 130, 108, 116);

  ctx.fillStyle = '#555';
  ctx.fillRect(58, 48, 12, 24);
  ctx.fillRect(58, 172, 12, 24);

  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, 126);
  ctx.lineTo(122, 126);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(12, 12, 104, 104);
  ctx.fillRect(12, 132, 104, 112);

  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(12, 38, 104, 2);
  ctx.fillRect(12, 78, 104, 2);
  ctx.fillRect(12, 150, 104, 2);
  ctx.fillRect(12, 190, 104, 2);

  ctx.fillStyle = '#888';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEZER', 64, 112);
  ctx.fillText('FRIDGE', 64, 244);

  ctx.fillStyle = '#666';
  ctx.font = '7px sans-serif';
  ctx.fillText('-18°C', 64, 105);
  ctx.fillText('4°C', 64, 237);

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(10, 128, 108, 1);

  ctx.fillStyle = `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`;
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('EMOTION', 64, 36);
  ctx.fillText('EMOTION', 64, 160);

  ctx.fillStyle = '#444';
  ctx.font = '6px sans-serif';
  ctx.fillText('감정쓰레기통', 64, 124);
  ctx.fillText('감정쓰레기통', 64, 248);

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, 0, 4, 256);
  ctx.fillRect(124, 0, 4, 256);

  return new THREE.CanvasTexture(c);
}

function createCarTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  const { r, g, b } = hexToRgb(accentColor);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 65, 256, 63);

  const bodyGrad = ctx.createLinearGradient(0, 0, 0, 64);
  bodyGrad.addColorStop(0, `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`);
  bodyGrad.addColorStop(0.3, `rgb(${Math.min(255,r+30)},${Math.min(255,g+30)},${Math.min(255,b+30)})`);
  bodyGrad.addColorStop(0.6, `rgb(${r>>1},${g>>1},${b>>1})`);
  bodyGrad.addColorStop(1, `rgb(${r>>2},${g>>2},${b>>2})`);
  ctx.fillStyle = bodyGrad;

  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.lineTo(40, 14);
  ctx.lineTo(130, 14);
  ctx.lineTo(165, 60);
  ctx.lineTo(236, 60);
  ctx.lineTo(236, 84);
  ctx.lineTo(20, 84);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.moveTo(25, 56);
  ctx.lineTo(42, 18);
  ctx.lineTo(128, 18);
  ctx.lineTo(160, 56);
  ctx.closePath();
  ctx.fill();

  const glossGrad = ctx.createLinearGradient(0, 0, 0, 60);
  glossGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
  glossGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
  glossGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = glossGrad;
  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.lineTo(40, 14);
  ctx.lineTo(130, 14);
  ctx.lineTo(165, 60);
  ctx.lineTo(236, 60);
  ctx.lineTo(236, 50);
  ctx.lineTo(20, 50);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.lineTo(40, 14);
  ctx.lineTo(130, 14);
  ctx.lineTo(165, 60);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#335577';
  ctx.beginPath();
  ctx.moveTo(55, 18);
  ctx.lineTo(120, 18);
  ctx.lineTo(140, 55);
  ctx.lineTo(35, 55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(160,210,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(58, 20);
  ctx.lineTo(117, 20);
  ctx.lineTo(136, 53);
  ctx.lineTo(38, 53);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#335577';
  ctx.beginPath();
  ctx.moveTo(145, 24);
  ctx.lineTo(162, 24);
  ctx.lineTo(170, 55);
  ctx.lineTo(142, 55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(160,210,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(147, 26);
  ctx.lineTo(159, 26);
  ctx.lineTo(166, 53);
  ctx.lineTo(144, 53);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(85, 18);
  ctx.lineTo(85, 55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(110, 18);
  ctx.lineTo(110, 55);
  ctx.stroke();

  ctx.fillStyle = '#888';
  ctx.fillRect(30, 57, 20, 5);
  ctx.fillRect(180, 57, 40, 5);

  ctx.fillStyle = '#ffeb3b';
  ctx.shadowColor = '#ffeb3b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(228, 70, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.arc(228, 70, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff2222';
  ctx.shadowColor = '#ff2222';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(28, 70, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('EMOTION', 210, 42);

  ctx.fillStyle = '#555';
  ctx.font = '6px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('감정쓰레기통', 130, 76);

  ctx.fillStyle = '#333';
  ctx.fillRect(215, 55, 8, 4);
  ctx.fillRect(225, 55, 8, 4);

  return new THREE.CanvasTexture(c);
}

const CATEGORY_MAP = {
  '캔': 'can', '박스': 'box', 'TV': 'tv', '냉장고': 'fridge', '자동차': 'car',
};

function createTrashMesh(weight, contentLength, color, tags, forceType) {
  const w = weight / 200;
  const lenFactor = Math.min(3.0, 1.2 + contentLength / 150);
  const accentColor = color || 0x888888;
  let category;
  if (forceType && forceType !== 'auto') {
    category = CATEGORY_MAP[forceType] || forceType;
  } else if (contentLength <= 50) category = 'can';
  else if (contentLength <= 200) category = 'box';
  else if (contentLength <= 500) category = 'tv';
  else if (contentLength <= 1000) category = 'fridge';
  else category = 'car';

  const group = new THREE.Group();

  if (category === 'can') {
    const tex = createCanTexture(accentColor);
    const h = (1.0 + w * 1.2) * lenFactor;
    const r = (0.4 + w * 0.5) * lenFactor;

    const canMat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.2, metalness: 0.7,
      emissive: accentColor, emissiveIntensity: 0.1,
    });
    const geo = new THREE.CylinderGeometry(r * 0.9, r * 1.02, h, 14);
    const mesh = new THREE.Mesh(geo, canMat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.x = (Math.random() - 0.5) * 0.08;
    mesh.rotation.z = (Math.random() - 0.5) * 0.06;
    group.add(mesh);

    const topMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const top = new THREE.Mesh(new THREE.CircleGeometry(r * 0.88, 14), topMat);
    top.position.y = h * 0.5 + 0.01;
    top.rotation.x = -Math.PI / 2;
    group.add(top);

    const tabMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.6, roughness: 0.3 });
    const tab = new THREE.Mesh(new THREE.TorusGeometry(r * 0.26, 0.06, 6, 8), tabMat);
    tab.position.y = h * 0.5 + 0.04;
    tab.rotation.x = Math.PI / 2;
    tab.castShadow = true;
    group.add(tab);

    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.3 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.92, 0.06, 6, 14), rimMat);
    rim.position.y = h * 0.5;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);
  }

  else if (category === 'box') {
    const tex = createBoxTexture(accentColor);
    const sx = (1.2 + w * 1.0) * lenFactor;
    const sy = (0.9 + w * 0.7) * lenFactor;
    const sz = (1.2 + w * 1.0) * lenFactor;

    const bodyBMat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.85, metalness: 0,
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), bodyBMat);
    box.castShadow = true; box.receiveShadow = true;
    group.add(box);

    const tapeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7, metalness: 0 });
    [-1, 1].forEach(side => {
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, sy * 0.85, 0.1), tapeMat);
      t1.position.x = side * sx * 0.45;
      t1.castShadow = true;
      group.add(t1);
      const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, sy * 0.85, 0.05), tapeMat);
      t2.position.z = side * sz * 0.45;
      t2.castShadow = true;
      group.add(t2);
    });

    const topTape = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.3, 0.02, sz * 0.3), tapeMat);
    topTape.position.y = sy * 0.49;
    group.add(topTape);

    const cornerMat = new THREE.MeshStandardMaterial({ color: 0x9a8060, roughness: 0.9 });
    [-1, 1].forEach(sx2 => [-1, 1].forEach(sz2 => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), cornerMat);
      c.position.set(sx2 * sx * 0.48, sy * 0.48, sz2 * sz * 0.48);
      group.add(c);
    }));

    const foldMat = new THREE.MeshStandardMaterial({ color: 0x7a6a50, roughness: 0.9 });
    const fold = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.48, 0.02, 0.08), foldMat);
    fold.position.set(0, sy * 0.49, sz * 0.35);
    group.add(fold);
    const fold2 = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.48, 0.02, 0.08), foldMat);
    fold2.position.set(0, sy * 0.49, -sz * 0.35);
    group.add(fold2);
  }

  else if (category === 'tv') {
    const tex = createTVTexture(accentColor);
    const sx = (2.5 + w * 1.2) * lenFactor;
    const sy = (0.9 + w * 0.5) * lenFactor;
    const sz = (0.25 + w * 0.18) * lenFactor;

    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.05 });
    const bOuter = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.1, sy + 0.1, sz * 0.6), bezelMat);
    bOuter.castShadow = true; bOuter.receiveShadow = true;
    group.add(bOuter);

    const screenMat = new THREE.MeshStandardMaterial({
      map: tex, emissive: new THREE.Color(0x4488ff), emissiveIntensity: 0.15,
      roughness: 0.1, metalness: 0.05,
    });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(sx - 0.12, sy - 0.12, sz * 0.45), screenMat);
    screen.position.z = sz * 0.07;
    screen.castShadow = true;
    group.add(screen);

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.08,
    });
    const glow = new THREE.Mesh(new THREE.BoxGeometry(sx - 0.06, sy - 0.06, sz * 0.2), glowMat);
    glow.position.z = sz * 0.15;
    group.add(glow);

    const ledMat = new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 0.6 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), ledMat);
    led.position.set(sx * 0.4, -sy * 0.42, sz * 0.32);
    group.add(led);

    const standMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.2 });
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, sy * 0.2, 6), standMat);
    stand.position.y = -(sy * 0.5 + sy * 0.1);
    stand.castShadow = true;
    group.add(stand);
    const base = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.4, 0.08, sz * 0.8), standMat);
    base.position.y = -(sy * 0.5 + sy * 0.2);
    base.castShadow = true;
    group.add(base);
  }

  else if (category === 'fridge') {
    const tex = createFridgeTexture(accentColor);
    const sx = (1.5 + w * 1.0) * lenFactor;
    const sy = (2.5 + w * 1.5) * lenFactor;
    const sz = (1.0 + w * 0.7) * lenFactor;

    const bodyFMat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.15, metalness: 0.85,
    });
    const bodyF = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), bodyFMat);
    bodyF.castShadow = true; bodyF.receiveShadow = true;
    group.add(bodyF);

    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const seal = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.02, 0.03, sz + 0.04), rubberMat);
    seal.position.y = sy * 0.02;
    seal.position.z = sz * 0.51;
    group.add(seal);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.15 });
    const handleShape = new THREE.Shape();
    handleShape.moveTo(-0.02, 0);
    handleShape.lineTo(-0.02, 0.15);
    handleShape.quadraticCurveTo(0, 0.18, 0.02, 0.15);
    handleShape.lineTo(0.02, 0);
    handleShape.lineTo(-0.02, 0);
    const hExtrude = { steps: 1, depth: 0.06, bevelEnabled: false };
    [-1, 1].forEach(side => {
      ['top', 'bot'].forEach((part, i) => {
        const hGeo = new THREE.ExtrudeGeometry(handleShape, hExtrude);
        hGeo.translate(0, 0, -0.03);
        const h = new THREE.Mesh(hGeo, handleMat);
        const yOff = i === 0 ? sy * 0.22 : -sy * 0.22;
        h.position.set(side * sx * 0.44, yOff, sz * 0.52);
        h.rotation.y = side > 0 ? Math.PI : 0;
        h.castShadow = true;
        group.add(h);
      });
    });

    const divMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.4, roughness: 0.3 });
    const div = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.04, 0.04, sz + 0.04), divMat);
    div.position.y = 0.06;
    group.add(div);

    const ventMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    const vent = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.5, 0.04, sz * 0.1), ventMat);
    vent.position.set(0, -sy * 0.46, sz * 0.52);
    group.add(vent);

    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, emissive: 0x88ccff, emissiveIntensity: 0.12,
      transparent: true, opacity: 0.25,
    });
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), lightMat);
    light.position.set(0, sy * 0.38, sz * 0.52);
    group.add(light);

    const labelMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.05 });
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.01), labelMat);
    label.position.set(0, sy * 0.12, sz * 0.52);
    group.add(label);
  }

  else if (category === 'car') {
    const tex = createCarTexture(accentColor);
    const s = (1.8 + w * 1.2) * lenFactor;

    const bodyMat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.25, metalness: 0.7,
      emissive: accentColor, emissiveIntensity: 0.03,
    });

    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-0.9 * s, -0.3 * s);
    bodyShape.quadraticCurveTo(-0.5 * s, -0.1 * s, 0.1 * s, -0.35 * s);
    bodyShape.quadraticCurveTo(0.5 * s, -0.35 * s, 0.9 * s, -0.25 * s);
    bodyShape.quadraticCurveTo(0.95 * s, 0.1 * s, 0.85 * s, 0.25 * s);
    bodyShape.quadraticCurveTo(0.6 * s, 0.32 * s, 0.1 * s, 0.32 * s);
    bodyShape.quadraticCurveTo(-0.3 * s, 0.32 * s, -0.7 * s, 0.2 * s);
    bodyShape.quadraticCurveTo(-0.95 * s, 0.05 * s, -0.9 * s, -0.3 * s);

    const extrudeSettings = { steps: 1, depth: 0.7 * s, bevelEnabled: true, bevelThickness: 0.03 * s, bevelSize: 0.02 * s, bevelSegments: 3 };
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeo.translate(0, 0, -0.35 * s);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.25 * s;
    body.castShadow = true; body.receiveShadow = true;
    group.add(body);

    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.12 * s, 0.6 * s), bumperMat);
    frontBumper.position.set(0.85 * s, 0.08 * s, 0);
    group.add(frontBumper);
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.12 * s, 0.6 * s), bumperMat);
    rearBumper.position.set(-0.85 * s, 0.08 * s, 0);
    group.add(rearBumper);

    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x88bbdd, metalness: 0.1, roughness: 0.1,
      transparent: true, opacity: 0.35,
    });
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(-0.55 * s, 0);
    cabinShape.quadraticCurveTo(-0.35 * s, 0.35 * s, 0.1 * s, 0.38 * s);
    cabinShape.quadraticCurveTo(0.4 * s, 0.38 * s, 0.65 * s, 0);
    cabinShape.lineTo(-0.55 * s, 0);

    const cabinExtrude = { steps: 1, depth: 0.6 * s, bevelEnabled: true, bevelThickness: 0.02 * s, bevelSize: 0.01 * s, bevelSegments: 2 };
    const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, cabinExtrude);
    cabinGeo.translate(0, 0, -0.3 * s);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = 0.3 * s;
    cabin.castShadow = true;
    group.add(cabin);

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, metalness: 0.3, roughness: 0.1,
      transparent: true, opacity: 0.2,
    });
    const wShape = new THREE.Shape();
    wShape.moveTo(-0.4 * s, 0.02 * s);
    wShape.quadraticCurveTo(-0.2 * s, 0.28 * s, 0.1 * s, 0.3 * s);
    wShape.quadraticCurveTo(0.35 * s, 0.3 * s, 0.5 * s, 0.02 * s);
    wShape.lineTo(-0.4 * s, 0.02 * s);
    const wExtrude = { steps: 1, depth: 0.55 * s, bevelEnabled: false };
    const wGeo = new THREE.ExtrudeGeometry(wShape, wExtrude);
    wGeo.translate(0, 0, -0.275 * s);
    const windows = new THREE.Mesh(wGeo, windowMat);
    windows.position.y = 0.32 * s;
    group.add(windows);

    const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 0.4 });
    [-1, 1].forEach(z => {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 8, 8), headlightMat);
      hl.position.set(0.92 * s, 0.22 * s, z * 0.22 * s);
      group.add(hl);
      const hl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.05 * s, 0.06 * s, 8), headlightMat);
      hl2.rotation.z = Math.PI / 2;
      hl2.position.set(0.95 * s, 0.22 * s, z * 0.22 * s);
      group.add(hl2);
    });

    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 0.15 });
    [-1, 1].forEach(z => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.04 * s, 0.06 * s, 0.08 * s), tailMat);
      tl.position.set(-0.92 * s, 0.2 * s, z * 0.2 * s);
      group.add(tl);
    });

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    const rimMat2 = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.2 });
    const wheelPos = [
      [-0.5 * s, -0.05 * s, 0.36 * s], [0.5 * s, -0.05 * s, 0.36 * s],
      [-0.5 * s, -0.05 * s, -0.36 * s], [0.5 * s, -0.05 * s, -0.36 * s],
    ];
    wheelPos.forEach(pos => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.11 * s, 0.04 * s, 12), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      group.add(wheel);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.06 * s, 0.015 * s, 6, 8), rimMat2);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(pos[0], pos[1], pos[2]);
      group.add(rim);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 6, 6), rimMat2);
      hub.position.set(pos[0], pos[1], pos[2]);
      group.add(hub);
    });

    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.05 * s, 0.15 * s), spoilerMat);
    spoiler.position.set(-0.75 * s, 0.42 * s, 0);
    group.add(spoiler);
    const spoilerLegMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [-1, 1].forEach(z => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.02 * s, 0.1 * s, 0.02 * s), spoilerLegMat);
      leg.position.set(-0.75 * s, 0.34 * s, z * 0.06 * s);
      group.add(leg);
    });
  }

  return group;
}

let pendingDumps = [];

function scheduleTrashItem(data) {
  pendingDumps.push(data);
}

function processDumpAnimation() {
  if (pendingDumps.length === 0) return;
  const data = pendingDumps.shift();
  createTrashItem(data);
}

function getObjHeight(category) {
  switch (category) {
    case 'can': return 1.3;
    case 'box': return 1.1;
    case 'tv': return 1.0;
    case 'fridge': return 2.8;
    case 'car': return 2.2;
    default: return 1.0;
  }
}

let trailParticles = [];

function createTrashItem(data) {
  const color = getTagColor(data.tags || []);
  const weight = Math.max(20, data.weightAfter !== undefined ? data.weightAfter : 50);

  const contentLength = (data.content || '').length;
  let category;
  if (data.trashType && data.trashType !== 'auto') {
    category = data.trashType;
  } else if (contentLength <= 50) category = 'can';
  else if (contentLength <= 200) category = 'box';
  else if (contentLength <= 500) category = 'tv';
  else if (contentLength <= 1000) category = 'fridge';
  else category = 'car';

  console.log('[DEBUG] createTrashItem:', { contentLength, content: data.content?.substring(0, 30), weight, category, tags: data.tags });
  const mesh = createTrashMesh(weight, contentLength, color, data.tags, data.trashType);

  const angle = Math.random() * Math.PI * 2;
  const dist = 6 + Math.random() * 3;
  const startY = 9 + Math.random() * 4;

  mesh.position.set(
    Math.cos(angle) * dist,
    startY,
    Math.sin(angle) * dist
  );
  mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0);

  scene.add(mesh);

  const objHeight = getObjHeight(category);
  const pilePos = placeOnPile(category, objHeight);

  const arcHeight = 5 + Math.random() * 3;
  const duration = 2500 + Math.random() * 1200;
  const startTime = Date.now();
  const wobbleX = (Math.random() - 0.5) * 1.2;
  const wobbleZ = (Math.random() - 0.5) * 1.2;

  mesh.scale.set(0.3, 0.3, 0.3);

  dumpAnimations.push({
    mesh,
    startX: mesh.position.x,
    startY,
    startZ: mesh.position.z,
    targetX: pilePos.x,
    targetY: pilePos.y,
    targetZ: pilePos.z,
    arcHeight,
    startRot: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
    wobbleX, wobbleZ,
    startTime,
    duration,
    trailColor: color,
  });

  trashObjects.push(mesh);

  setTimeout(() => {
    processDumpAnimation();
  }, 100 + Math.random() * 200);
}

function spawnTrailParticle(pos, color) {
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 4, 4),
    new THREE.MeshBasicMaterial({
      color: color || 0x39ff14,
      transparent: true,
      opacity: 0.6,
    })
  );
  particle.position.copy(pos);
  scene.add(particle);
  trailParticles.push({
    mesh: particle,
    life: 1.0,
    decay: 0.035 + Math.random() * 0.02,
  });
}

function updateTrailParticles() {
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const p = trailParticles[i];
    p.life -= p.decay;
    p.mesh.material.opacity = p.life * 0.6;
    const sc = 1 + (1 - p.life) * 0.5;
    p.mesh.scale.set(sc, sc, sc);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      trailParticles.splice(i, 1);
    }
  }
}

function updateDumpAnimations() {
  const now = Date.now();
  for (let i = dumpAnimations.length - 1; i >= 0; i--) {
    const anim = dumpAnimations[i];
    let t = (now - anim.startTime) / anim.duration;
    const wasNotDone = t < 1;
    if (t > 1) t = 1;

    const ease = 1 - Math.pow(1 - t, 3);

    anim.mesh.position.x = anim.startX + (anim.targetX - anim.startX) * ease;
    anim.mesh.position.z = anim.startZ + (anim.targetZ - anim.startZ) * ease;
    const baseY = anim.startY + (anim.targetY - anim.startY) * ease;
    const arcY = Math.sin(Math.PI * t) * (anim.arcHeight || 0);
    anim.mesh.position.y = baseY + arcY;

    anim.mesh.rotation.x = anim.startRot.x + anim.wobbleX * ease;
    anim.mesh.rotation.y = anim.startRot.y + t * Math.PI * 6;
    anim.mesh.rotation.z = anim.startRot.z + anim.wobbleZ * ease;

    const scale = 0.5 + 0.7 * t;
    anim.mesh.scale.set(scale, scale, scale);

    if (t > 0.15 && t < 0.95 && Math.random() < 0.3) {
      spawnTrailParticle(anim.mesh.position, anim.trailColor || 0x888888);
    }

    if (wasNotDone && t >= 1) {
      spawnLandingImpact(anim.mesh.position.x, anim.mesh.position.y, anim.mesh.position.z, anim.trailColor);
    }

    if (t >= 1) {
      dumpAnimations.splice(i, 1);
    }
  }
}

function spawnLandingImpact(x, y, z, accentColor) {
  const colorObj = accentColor ? new THREE.Color(accentColor) : new THREE.Color(0xffdd44);

  const flashLight = new THREE.PointLight(0xffeecc, 4.0, 10);
  flashLight.position.set(x, y + 0.5, z);
  scene.add(flashLight);
  landingImpacts.push({
    mesh: flashLight,
    vx: 0, vy: 0, vz: 0,
    life: 1.0,
    decay: 0.03,
    scale: 1,
    maxScale: 1,
    isLight: true,
  });

  const ringGeo = new THREE.RingGeometry(0.1, 0.3, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorObj,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(x, y + 0.05, z);
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  landingImpacts.push({
    mesh: ring,
    vx: 0, vy: 0, vz: 0,
    life: 1.0,
    decay: 0.025,
    scale: 1,
    maxScale: 5.0,
    isRing: true,
  });

  const dustCount = 14;
  for (let i = 0; i < dustCount; i++) {
    const dust = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + Math.random() * 0.14, 5, 5),
      new THREE.MeshBasicMaterial({
        color: colorObj,
        transparent: true,
        opacity: 0.7,
      })
    );
    dust.position.set(x, y, z);
    scene.add(dust);
    landingImpacts.push({
      mesh: dust,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 0.8 + Math.random() * 2.0,
      vz: (Math.random() - 0.5) * 2.5,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.015,
      scale: 1,
      maxScale: 2.0 + Math.random() * 1.5,
    });
  }
  const sparkCount = 12;
  for (let i = 0; i < sparkCount; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 4, 4),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
      })
    );
    spark.position.set(x, y, z);
    scene.add(spark);
    landingImpacts.push({
      mesh: spark,
      vx: (Math.random() - 0.5) * 3.5,
      vy: 1.2 + Math.random() * 2.5,
      vz: (Math.random() - 0.5) * 3.5,
      life: 1.0,
      decay: 0.05,
      scale: 1,
      maxScale: 1.0,
    });
  }
}

function updateLandingImpacts() {
  for (let i = landingImpacts.length - 1; i >= 0; i--) {
    const p = landingImpacts[i];
    p.life -= p.decay;
    if (p.isLight) {
      p.mesh.intensity = Math.max(0, 4.0 * p.life);
    } else if (p.isRing) {
      p.scale = Math.min(p.scale + 0.08, p.maxScale);
      p.mesh.scale.set(p.scale, p.scale, p.scale);
      p.mesh.material.opacity = Math.max(0, p.life * 0.8);
    } else {
      p.mesh.position.x += p.vx * 0.016;
      p.mesh.position.y += p.vy * 0.016;
      p.mesh.position.z += p.vz * 0.016;
      p.vy -= 1.8 * 0.016;
      p.scale = Math.min(p.scale + 0.06, p.maxScale);
      p.mesh.scale.set(p.scale, p.scale, p.scale);
      p.mesh.material.opacity = Math.max(0, p.life * (p.mesh.material.color.r > 0.5 ? 1.0 : 0.6));
    }
    if (p.life <= 0) {
      scene.remove(p.mesh);
      if (!p.isLight) {
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      }
      landingImpacts.splice(i, 1);
    }
  }
}

function onResize() {
  const container = document.getElementById('three-container');
  if (!container || !camera || !renderer) return;
  let w = container.clientWidth;
  let h = container.clientHeight;
  if (w === 0 || h === 0) {
    w = window.innerWidth;
    h = window.innerHeight;
  }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('orientationchange', () => {
  setTimeout(onResize, 300);
});

function animate() {
  requestAnimationFrame(animate);
  if (!isSceneReady) return;

  updateDumpAnimations();
  updateTrailParticles();
  updateLandingImpacts();
  controls.update();
  renderer.render(scene, camera);
}

function setAutoRotate(enabled) {
  if (controls) controls.autoRotate = enabled;
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initScene, 800);
});
