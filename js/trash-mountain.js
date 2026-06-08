let scene, camera, renderer, controls;
let trashObjects = [];
let landingImpacts = [];
let ground;
let isSceneReady = false;
let dumpAnimations = [];

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
  const count = 30;
  for (let i = 0; i < count; i++) {
    const radius = 0.3 + Math.random() * 0.8;
    const height = 0.3 + Math.random() * 0.6;
    const geo = new THREE.DodecahedronGeometry(radius);
    const color = [0x444444, 0x555555, 0x333333, 0x2a2a2a, 0x1a1a1a][Math.floor(Math.random() * 5)];
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.5 + Math.random() * 4;
    mesh.position.set(
      Math.cos(angle) * dist,
      height / 2 + Math.random() * 2.5,
      Math.sin(angle) * dist
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
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
  grad.addColorStop(0.15, `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`);
  grad.addColorStop(0.3, '#ddd');
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(0.7, '#bbb');
  grad.addColorStop(0.85, `rgb(${Math.min(255,r+40)},${Math.min(255,g+40)},${Math.min(255,b+40)})`);
  grad.addColorStop(1, `rgb(${r>>1},${g>>1},${b>>1})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🥫', 128, 80);

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,255,255,0.15)`;
  ctx.fillRect(40, 100, 176, 2);
  ctx.fillRect(40, 160, 176, 2);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('EMOTION', 128, 135);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('ENERGY DRINK', 128, 155);

  ctx.fillStyle = `rgba(255,255,255,0.08)`;
  ctx.fillRect(30, 175, 196, 40);

  ctx.font = '10px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('500ml   ·   감정쓰레기통', 128, 200);
  ctx.fillText('★ ★ ★ ★ ★', 128, 220);

  ctx.shadowBlur = 8;
  ctx.shadowColor = `rgba(${r},${g},${b},0.3)`;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 14px sans-serif';
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
  grad.addColorStop(0.5, '#c4955a');
  grad.addColorStop(1, '#a87d4a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 6, 1);
  }

  ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
  ctx.lineWidth = 6;
  ctx.strokeRect(15, 15, 226, 226);

  ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 196, 196);

  ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
  ctx.fillRect(90, 70, 76, 120);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(88, 68, 80, 4);
  ctx.fillRect(88, 188, 80, 4);
  ctx.fillRect(88, 68, 4, 124);
  ctx.fillRect(164, 68, 4, 124);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 2;
  ctx.fillText('📦', 128, 115);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#222';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('FRAGILE', 128, 160);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('⚠', 128, 195);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, 256, 4);
  ctx.fillRect(0, 252, 256, 4);
  ctx.fillRect(0, 0, 4, 256);
  ctx.fillRect(252, 0, 4, 256);

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

  ctx.fillStyle = '#0a0a0a';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillRect(30, 15, 452, 210);
  ctx.shadowBlur = 0;

  const screenGrad = ctx.createRadialGradient(256, 120, 10, 256, 120, 200);
  screenGrad.addColorStop(0, `rgb(${Math.min(255,r+100)},${Math.min(255,g+100)},${Math.min(255,b+100)})`);
  screenGrad.addColorStop(0.3, `rgb(${r},${g},${b})`);
  screenGrad.addColorStop(0.7, `rgb(${r>>1},${g>>1},${b>>1})`);
  screenGrad.addColorStop(1, '#111');
  ctx.fillStyle = screenGrad;
  ctx.fillRect(35, 20, 442, 200);

  ctx.shadowColor = `rgba(${r},${g},${b},0.4)`;
  ctx.shadowBlur = 30;
  ctx.fillRect(35, 20, 442, 200);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#333';
  ctx.fillRect(200, 230, 112, 12);

  ctx.fillStyle = '#444';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('POWER', 256, 240);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.shadowColor = `rgb(${r},${g},${b})`;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(256, 248, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#222';
  ctx.fillRect(470, 240, 30, 6);

  return new THREE.CanvasTexture(c);
}

function createFridgeTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const ctx = c.getContext('2d');
  const { r, g, b } = hexToRgb(accentColor);

  const metalGrad = ctx.createLinearGradient(0, 0, 128, 0);
  metalGrad.addColorStop(0, '#888');
  metalGrad.addColorStop(0.15, '#e8e8e8');
  metalGrad.addColorStop(0.3, '#ddd');
  metalGrad.addColorStop(0.5, '#f0f0f0');
  metalGrad.addColorStop(0.7, '#ddd');
  metalGrad.addColorStop(0.85, '#e8e8e8');
  metalGrad.addColorStop(1, '#888');
  ctx.fillStyle = metalGrad;
  ctx.fillRect(0, 0, 128, 256);

  ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`;
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 120, 118);
  ctx.strokeRect(4, 126, 120, 126);

  ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
  ctx.fillRect(10, 10, 108, 106);
  ctx.fillRect(10, 132, 108, 114);

  ctx.fillStyle = '#666';
  ctx.fillRect(60, 48, 8, 20);
  ctx.fillRect(60, 170, 8, 20);

  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 126);
  ctx.lineTo(124, 126);
  ctx.stroke();

  ctx.fillStyle = `rgba(${r},${g},${b},0.06)`;
  ctx.fillRect(14, 14, 100, 98);
  ctx.fillRect(14, 136, 100, 106);

  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(10, 40, 108, 2);
  ctx.fillRect(10, 80, 108, 2);
  ctx.fillRect(10, 150, 108, 2);
  ctx.fillRect(10, 190, 108, 2);

  ctx.fillStyle = '#555';
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('❄ FREEZER', 64, 110);
  ctx.fillText('❄ FRIDGE', 64, 240);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('감정쓰레기통', 64, 132);

  return new THREE.CanvasTexture(c);
}

function createCarTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  const { r, g, b } = hexToRgb(accentColor);

  ctx.fillStyle = '#222';
  ctx.fillRect(0, 65, 256, 63);

  const bodyGrad = ctx.createLinearGradient(0, 0, 0, 64);
  bodyGrad.addColorStop(0, `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`);
  bodyGrad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  bodyGrad.addColorStop(1, `rgb(${r>>1},${g>>1},${b>>1})`);
  ctx.fillStyle = bodyGrad;

  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.lineTo(40, 15);
  ctx.lineTo(130, 15);
  ctx.lineTo(165, 60);
  ctx.lineTo(236, 60);
  ctx.lineTo(236, 80);
  ctx.lineTo(20, 80);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.lineTo(40, 15);
  ctx.lineTo(130, 15);
  ctx.lineTo(165, 60);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#446688';
  ctx.beginPath();
  ctx.moveTo(55, 18);
  ctx.lineTo(120, 18);
  ctx.lineTo(140, 55);
  ctx.lineTo(35, 55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(150,200,255,0.3)';
  ctx.beginPath();
  ctx.moveTo(58, 20);
  ctx.lineTo(117, 20);
  ctx.lineTo(136, 53);
  ctx.lineTo(38, 53);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(85, 18);
  ctx.lineTo(85, 55);
  ctx.stroke();

  ctx.fillStyle = '#ffeb3b';
  ctx.shadowColor = '#ffeb3b';
  ctx.shadowBlur = 8;
  ctx.fillRect(28, 65, 20, 12);
  ctx.fillRect(195, 65, 20, 12);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ff4444';
  ctx.fillRect(10, 68, 8, 8);
  ctx.fillRect(230, 68, 10, 8);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('EMOTION', 128, 95);

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

  const baseMat = (texture) => new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.4 + Math.random() * 0.3,
    metalness: 0.2 + Math.random() * 0.3,
    emissive: accentColor,
    emissiveIntensity: 0.15,
  });

  const group = new THREE.Group();

  if (category === 'can') {
    const tex = createCanTexture(accentColor);
    const h = (1.0 + w * 1.2) * lenFactor;
    const r = (0.4 + w * 0.5) * lenFactor;
    const geo = new THREE.CylinderGeometry(r * 0.85, r * 1.05, h, 16);
    const mesh = new THREE.Mesh(geo, baseMat(tex));
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);

    const tabMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.6, roughness: 0.3 });
    const tab = new THREE.Mesh(new THREE.TorusGeometry(r * 0.28, 0.08, 8, 10), tabMat);
    tab.position.y = h / 2 + 0.06;
    tab.rotation.x = Math.PI / 2;
    tab.castShadow = true;
    group.add(tab);

    const rimMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.5, roughness: 0.4 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 8, 16), rimMat);
    rim.position.y = h / 2;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);
  }

  else if (category === 'box') {
    const tex = createBoxTexture(accentColor);
    const sx = (1.2 + w * 1.0) * lenFactor;
    const sy = (0.9 + w * 0.7) * lenFactor;
    const sz = (1.2 + w * 1.0) * lenFactor;
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const box = new THREE.Mesh(geo, baseMat(tex));
    box.castShadow = true; box.receiveShadow = true;
    group.add(box);

    const tapeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    [-1, 1].forEach(side => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.06, sy * 0.9, 0.12), tapeMat);
      t.position.x = side * sx * 0.45;
      t.castShadow = true;
      group.add(t);
      const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, sy * 0.9, 0.06), tapeMat);
      t2.position.z = side * sz * 0.45;
      t2.castShadow = true;
      group.add(t2);
    });

    const cornerMat = new THREE.MeshStandardMaterial({ color: 0x9a8060, roughness: 0.9 });
    [-1, 1].forEach(sx2 => [-1, 1].forEach(sz2 => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), cornerMat);
      c.position.set(sx2 * sx * 0.48, sy * 0.48, sz2 * sz * 0.48);
      group.add(c);
    }));
  }

  else if (category === 'tv') {
    const tex = createTVTexture(accentColor);
    const sx = (2.5 + w * 1.2) * lenFactor;
    const sy = (0.9 + w * 0.5) * lenFactor;
    const sz = (0.25 + w * 0.18) * lenFactor;
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const screen = new THREE.Mesh(geo, baseMat(tex));
    screen.castShadow = true; screen.receiveShadow = true;
    group.add(screen);

    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.1 });
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.12, sy + 0.12, sz * 0.5), bezelMat);
    bezel.position.z = -sz * 0.25;
    bezel.castShadow = true;
    group.add(bezel);

    const standMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.18), standMat);
    stand.position.y = -(sy * 0.5 + 0.12);
    stand.castShadow = true;
    group.add(stand);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.3), standMat);
    base.position.y = -(sy * 0.5 + 0.24);
    base.castShadow = true;
    group.add(base);
  }

  else if (category === 'fridge') {
    const tex = createFridgeTexture(accentColor);
    const sx = (1.5 + w * 1.0) * lenFactor;
    const sy = (2.5 + w * 1.5) * lenFactor;
    const sz = (1.0 + w * 0.7) * lenFactor;
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const fridge = new THREE.Mesh(geo, baseMat(tex));
    fridge.castShadow = true; fridge.receiveShadow = true;
    group.add(fridge);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.2 });
    [-1, 1].forEach(side => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.1), handleMat);
      h.position.set(side * 0.66, 0.75, sz * 0.52);
      group.add(h);
      const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.1), handleMat);
      h2.position.set(side * 0.66, -0.75, sz * 0.52);
      group.add(h2);
    });

    const divMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.3 });
    const div = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.06, 0.06, sz + 0.06), divMat);
    div.position.y = 0.06;
    group.add(div);

    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, emissive: 0x88ccff, emissiveIntensity: 0.1, transparent: true, opacity: 0.3
    });
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), lightMat);
    light.position.set(0, sy * 0.4, sz * 0.52);
    group.add(light);
  }

  else if (category === 'car') {
    const tex = createCarTexture(accentColor);
    const scale = (1.8 + w * 1.2) * lenFactor;

    const bodyMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.3,
      metalness: 0.6,
      emissive: accentColor,
      emissiveIntensity: 0.03,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8 * scale, 0.35 * scale, 0.8 * scale), bodyMat);
    body.position.y = 0.2 * scale;
    body.castShadow = true; body.receiveShadow = true;
    group.add(body);

    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x88bbdd, metalness: 0.1, roughness: 0.1,
      transparent: true, opacity: 0.35,
    });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.22 * scale, 0.7 * scale), cabinMat);
    cabin.position.set(-0.15 * scale, 0.4 * scale, 0);
    cabin.castShadow = true;
    group.add(cabin);

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, metalness: 0.3, roughness: 0.1,
      transparent: true, opacity: 0.25,
    });
    const fWindow = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.15 * scale, 0.65 * scale), windowMat);
    fWindow.position.set(-0.5 * scale, 0.38 * scale, 0);
    group.add(fWindow);

    const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 0.2 });
    [-1, 1].forEach(side => {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.05 * scale, 6, 6), headlightMat);
      hl.position.set(0.9 * scale, 0.18 * scale, side * 0.25 * scale);
      group.add(hl);
    });

    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 0.1 });
    [-1, 1].forEach(side => {
      const tl = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 6, 6), tailMat);
      tl.position.set(-0.9 * scale, 0.18 * scale, side * 0.25 * scale);
      group.add(tl);
    });

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const wheelPos = [
      [-0.5 * scale, -0.06 * scale, 0.4 * scale],
      [0.5 * scale, -0.06 * scale, 0.4 * scale],
      [-0.5 * scale, -0.06 * scale, -0.4 * scale],
      [0.5 * scale, -0.06 * scale, -0.4 * scale],
    ];
    wheelPos.forEach(pos => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 0.05 * scale, 12), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      group.add(wheel);

      const rimMat2 = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6 });
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.051 * scale, 8), rimMat2);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(pos[0], pos[1], pos[2]);
      group.add(rim);
    });

    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.06 * scale, 0.02 * scale), spoilerMat);
    spoiler.position.set(-0.7 * scale, 0.4 * scale, 0);
    group.add(spoiler);
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

let trailParticles = [];

function createTrashItem(data) {
  const color = getTagColor(data.tags || []);
  const weight = Math.max(20, data.weightAfter !== undefined ? data.weightAfter : 50);

  const contentLength = (data.content || '').length;
  const mesh = createTrashMesh(weight, contentLength, color, data.tags, data.trashType);

  const angle = Math.random() * Math.PI * 2;
  const dist = 0.5 + Math.random() * 1.5;
  const startY = 14 + Math.random() * 3;

  mesh.position.set(
    Math.cos(angle) * dist,
    startY,
    Math.sin(angle) * dist
  );
  mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0);

  scene.add(mesh);

  const targetX = (Math.random() - 0.5) * 1.5;
  const targetZ = (Math.random() - 0.5) * 1.5;
  const targetY = 0.5 + Math.random() * 1.2;
  const arcHeight = 3 + Math.random() * 2;
  const duration = 1800 + Math.random() * 800;
  const startTime = Date.now();

  mesh.scale.set(0.5, 0.5, 0.5);

  dumpAnimations.push({
    mesh,
    startX: mesh.position.x,
    startY,
    startZ: mesh.position.z,
    targetX,
    targetY,
    targetZ,
    arcHeight,
    startRot: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
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

    anim.mesh.rotation.x = anim.startRot.x + (Math.random() - 0.5) * 3 * ease;
    anim.mesh.rotation.y = anim.startRot.y + t * Math.PI * 6;
    anim.mesh.rotation.z = anim.startRot.z + (Math.random() - 0.5) * 3 * ease;

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
