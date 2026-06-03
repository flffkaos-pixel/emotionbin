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

function getTrashGeometry(weight, contentLength) {
  const w = weight / 200;

  const trashTypes = {
    tiny: [
      () => new THREE.TetrahedronGeometry(0.2 + w * 0.15),
      () => new THREE.SphereGeometry(0.15 + w * 0.15, 4, 4),
      () => new THREE.CylinderGeometry(0.05 + w * 0.08, 0.08 + w * 0.1, 0.25 + w * 0.2, 6),
    ],
    small: [
      () => new THREE.BoxGeometry(0.3 + w * 0.25, 0.2 + w * 0.15, 0.3 + w * 0.25),
      () => new THREE.OctahedronGeometry(0.2 + w * 0.2),
      () => new THREE.CylinderGeometry(0.2 + w * 0.15, 0.25 + w * 0.2, 0.3 + w * 0.2, 8),
    ],
    medium: [
      () => new THREE.BoxGeometry(0.4 + w * 0.35, 0.35 + w * 0.3, 0.4 + w * 0.35),
      () => new THREE.TorusGeometry(0.25 + w * 0.2, 0.08 + w * 0.08, 8, 8),
      () => new THREE.DodecahedronGeometry(0.3 + w * 0.25),
      () => new THREE.CylinderGeometry(0.25 + w * 0.2, 0.15 + w * 0.15, 0.5 + w * 0.35, 6),
    ],
    large: [
      () => new THREE.BoxGeometry(0.6 + w * 0.4, 0.15 + w * 0.15, 0.45 + w * 0.35),
      () => new THREE.BoxGeometry(0.15 + w * 0.15, 0.55 + w * 0.4, 0.15 + w * 0.15),
      () => new THREE.IcosahedronGeometry(0.35 + w * 0.3),
      () => new THREE.TorusKnotGeometry(0.25 + w * 0.15, 0.06 + w * 0.06, 20, 8),
    ],
    huge: [
      () => new THREE.BoxGeometry(0.8 + w * 0.5, 0.6 + w * 0.45, 0.3 + w * 0.25),
      () => new THREE.BoxGeometry(0.5 + w * 0.35, 0.8 + w * 0.5, 0.5 + w * 0.35),
      () => new THREE.DodecahedronGeometry(0.5 + w * 0.4),
      () => new THREE.CylinderGeometry(0.3 + w * 0.25, 0.4 + w * 0.35, 0.8 + w * 0.5, 10),
    ],
  };

  let category;
  if (contentLength <= 50) {
    category = trashTypes.tiny;
  } else if (contentLength <= 200) {
    category = trashTypes.small;
  } else if (contentLength <= 500) {
    category = trashTypes.medium;
  } else {
    category = trashTypes.large;
  }

  if (contentLength >= 1000) {
    category = trashTypes.huge;
  }

  const fn = category[Math.floor(Math.random() * category.length)];
  return fn();
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
  const geo = getTrashGeometry(weight, contentLength);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6 + Math.random() * 0.3,
    metalness: 0.1 + Math.random() * 0.3,
    emissive: color,
    emissiveIntensity: 0.05,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

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
