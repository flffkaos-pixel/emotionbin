let scene, camera, renderer, controls;
let trashObjects = [];
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
  const w = container.clientWidth;
  const h = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 30, 60);

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(15, 12, 20);
  camera.lookAt(0, 0, 0);

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
  controls.maxDistance = 50;
  controls.minDistance = 5;
  controls.target.set(0, 1, 0);
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
  const ambient = new THREE.AmbientLight(0x222222, 0.3);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xff6633, 1.2);
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

  const fillLight = new THREE.DirectionalLight(0x0066ff, 0.3);
  fillLight.position.set(-10, 5, -10);
  scene.add(fillLight);

  const pointLight = new THREE.PointLight(0x39ff14, 0.3, 20);
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

  const ringGeo = new THREE.RingGeometry(0.5, 25, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x1a1a1a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.05;
  scene.add(ring);
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

function createCanTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  const r = (accentColor >> 16) & 0xff;
  const g = (accentColor >> 8) & 0xff;
  const b = accentColor & 0xff;
  grad.addColorStop(0, `rgb(${r},${g},${b})`);
  grad.addColorStop(0.3, '#ccc');
  grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
  grad.addColorStop(0.7, '#aaa');
  grad.addColorStop(1, `rgb(${r>>1},${g>>1},${b>>1})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍺', 64, 45);
  ctx.font = '10px sans-serif';
  ctx.fillText('EMOTION', 64, 80);
  return new THREE.CanvasTexture(c);
}

function createBoxTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b8956a';
  ctx.fillRect(0, 0, 128, 128);
  const r = (accentColor >> 16) & 0xff;
  const g = (accentColor >> 8) & 0xff;
  const b = accentColor & 0xff;
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 108, 108);
  ctx.strokeRect(20, 20, 88, 88);
  ctx.fillStyle = `rgba(${r},${g},${b},0.3)`;
  ctx.fillRect(48, 48, 32, 32);
  ctx.fillStyle = '#333';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRAGILE', 64, 70);
  return new THREE.CanvasTexture(c);
}

function createTVTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, 256, 128);
  const r = (accentColor >> 16) & 0xff;
  const g = (accentColor >> 8) & 0xff;
  const b = accentColor & 0xff;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.shadowColor = `rgb(${r},${g},${b})`;
  ctx.shadowBlur = 20;
  ctx.fillRect(20, 10, 216, 100);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#111';
  ctx.fillRect(100, 116, 56, 10);
  ctx.fillRect(120, 126, 16, 2);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 10, 216, 100);
  return new THREE.CanvasTexture(c);
}

function createCarTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const ctx = c.getContext('2d');
  const r = (accentColor >> 16) & 0xff;
  const g = (accentColor >> 8) & 0xff;
  const b = accentColor & 0xff;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.moveTo(15, 40);
  ctx.lineTo(20, 10);
  ctx.lineTo(60, 10);
  ctx.lineTo(80, 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 40, 108, 18);
  ctx.fillStyle = '#555';
  ctx.fillRect(25, 14, 30, 14);
  ctx.fillRect(65, 14, 30, 14);
  ctx.fillStyle = '#ffeb3b';
  ctx.fillRect(20, 42, 18, 14);
  ctx.fillRect(90, 42, 18, 14);
  return new THREE.CanvasTexture(c);
}

function createFridgeTexture(accentColor) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, 64, 128);
  const r = (accentColor >> 16) & 0xff;
  const g = (accentColor >> 8) & 0xff;
  const b = accentColor & 0xff;
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 60, 60);
  ctx.strokeRect(2, 64, 60, 62);
  ctx.fillStyle = `rgba(${r},${g},${b},0.2)`;
  ctx.fillRect(8, 8, 48, 48);
  ctx.fillRect(8, 70, 48, 50);
  ctx.fillStyle = '#999';
  ctx.fillRect(30, 30, 4, 8);
  ctx.fillRect(30, 90, 4, 8);
  return new THREE.CanvasTexture(c);
}

function createTrashMesh(weight, contentLength, color, tags) {
  const w = weight / 200;
  const accentColor = color || 0x888888;
  let category;
  if (contentLength <= 50) category = 'can';
  else if (contentLength <= 200) category = 'box';
  else if (contentLength <= 500) category = 'tv';
  else if (contentLength <= 1000) category = 'car';
  else category = 'fridge';

  const baseMat = (texture, color, emissiveIntensity = 0.05) => new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5 + Math.random() * 0.3,
    metalness: 0.1 + Math.random() * 0.3,
    emissive: color,
    emissiveIntensity: emissiveIntensity,
  });

  const group = new THREE.Group();

  if (category === 'can') {
    const tex = createCanTexture(accentColor);
    const h = 0.3 + w * 0.4;
    const r = 0.12 + w * 0.15;
    const geo = new THREE.CylinderGeometry(r * 0.9, r, h, 12);
    const mesh = new THREE.Mesh(geo, baseMat(tex, accentColor));
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);

    const tabGeo = new THREE.TorusGeometry(r * 0.3, 0.02, 6, 8);
    const tabMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });
    const tab = new THREE.Mesh(tabGeo, tabMat);
    tab.position.y = h / 2 + 0.02;
    tab.rotation.x = Math.PI / 2;
    tab.castShadow = true;
    group.add(tab);
  }

  else if (category === 'box') {
    const tex = createBoxTexture(accentColor);
    const geo = new THREE.BoxGeometry(0.4 + w * 0.3, 0.3 + w * 0.2, 0.4 + w * 0.3);
    const mesh = new THREE.Mesh(geo, baseMat(tex, accentColor));
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);

    const tapeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3 + w * 0.2, 0.04), tapeMat);
    tape.position.x = 0.2 + w * 0.15;
    tape.castShadow = true;
    group.add(tape);
    const tape2 = tape.clone();
    tape2.position.x = -(0.2 + w * 0.15);
    group.add(tape2);
  }

  else if (category === 'tv') {
    const tex = createTVTexture(accentColor);
    const geo = new THREE.BoxGeometry(0.8 + w * 0.4, 0.25 + w * 0.15, 0.1 + w * 0.08);
    const mesh = new THREE.Mesh(geo, baseMat(tex, accentColor));
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);

    const standMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.08), standMat);
    stand.position.y = -(0.125 + w * 0.075 + 0.06);
    stand.castShadow = true;
    group.add(stand);
  }

  else if (category === 'car') {
    const tex = createCarTexture(accentColor);
    const bodyGeo = new THREE.BoxGeometry(0.8 + w * 0.4, 0.2 + w * 0.15, 0.35 + w * 0.2);
    const body = new THREE.Mesh(bodyGeo, baseMat(tex, accentColor));
    body.position.y = 0.12 + w * 0.08;
    body.castShadow = true; body.receiveShadow = true;
    group.add(body);

    const cabinGeo = new THREE.BoxGeometry(0.35 + w * 0.2, 0.12 + w * 0.08, 0.3 + w * 0.15);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, metalness: 0.3, roughness: 0.2, transparent: true, opacity: 0.6 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-0.05, 0.28 + w * 0.15, 0);
    cabin.castShadow = true;
    group.add(cabin);

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const wheelPositions = [[-0.25, -0.04, 0.2], [0.25, -0.04, 0.2], [-0.25, -0.04, -0.2], [0.25, -0.04, -0.2]];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      group.add(wheel);
    });
  }

  else if (category === 'fridge') {
    const tex = createFridgeTexture(accentColor);
    const geo = new THREE.BoxGeometry(0.5 + w * 0.35, 0.9 + w * 0.5, 0.35 + w * 0.25);
    const mesh = new THREE.Mesh(geo, baseMat(tex, accentColor));
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3 + w * 0.2, 0.04, 0.02), handleMat);
    handle.position.set(0, 0.15, 0.18 + w * 0.12);
    group.add(handle);
    const handle2 = handle.clone();
    handle2.position.y = -0.25;
    group.add(handle2);

    const lineMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.5 + w * 0.35, 0.02, 0.36 + w * 0.25), lineMat);
    line.position.y = 0.02;
    group.add(line);
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

function createTrashItem(data) {
  const color = getTagColor(data.tags || []);
  const weight = data.weightAfter !== undefined ? data.weightAfter : 50;

  const contentLength = (data.content || '').length;
  const mesh = createTrashMesh(weight, contentLength, color, data.tags);

  const angle = Math.random() * Math.PI * 2;
  const dist = 8 + Math.random() * 5;
  const startY = 8 + Math.random() * 5;

  mesh.position.set(
    Math.cos(angle) * dist,
    startY,
    Math.sin(angle) * dist
  );
  mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0);

  scene.add(mesh);

  const targetX = (Math.random() - 0.5) * 6;
  const targetZ = (Math.random() - 0.5) * 6;
  const targetY = 0.2 + Math.random() * 2;
  const duration = 1000 + Math.random() * 1000;
  const startTime = Date.now();

  dumpAnimations.push({
    mesh,
    startX: mesh.position.x,
    startY,
    startZ: mesh.position.z,
    targetX,
    targetY,
    targetZ,
    startRot: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
    startTime,
    duration,
  });

  trashObjects.push(mesh);

  setTimeout(() => {
    processDumpAnimation();
  }, 100 + Math.random() * 200);
}

function updateDumpAnimations() {
  const now = Date.now();
  for (let i = dumpAnimations.length - 1; i >= 0; i--) {
    const anim = dumpAnimations[i];
    let t = (now - anim.startTime) / anim.duration;
    if (t > 1) t = 1;

    const ease = 1 - Math.pow(1 - t, 3);

    anim.mesh.position.x = anim.startX + (anim.targetX - anim.startX) * ease;
    anim.mesh.position.y = anim.startY + (anim.targetY - anim.startY) * ease;
    anim.mesh.position.z = anim.startZ + (anim.targetZ - anim.startZ) * ease;

    anim.mesh.rotation.x = anim.startRot.x + (Math.random() - 0.5) * 3 * ease;
    anim.mesh.rotation.y = anim.startRot.y + t * Math.PI * 4;
    anim.mesh.rotation.z = anim.startRot.z + (Math.random() - 0.5) * 3 * ease;

    const s = 0.5 + 0.5 * (1 - ease);
    const scale = 1 + s * 0.5;
    anim.mesh.scale.set(scale, scale, scale);

    if (t >= 1) {
      dumpAnimations.splice(i, 1);
    }
  }
}

function onResize() {
  const container = document.getElementById('three-container');
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  requestAnimationFrame(animate);
  if (!isSceneReady) return;

  updateDumpAnimations();
  controls.update();
  renderer.render(scene, camera);
}

function setAutoRotate(enabled) {
  if (controls) controls.autoRotate = enabled;
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initScene, 800);
});
