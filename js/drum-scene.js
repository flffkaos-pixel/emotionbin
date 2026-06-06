let drumScene, drumCamera, drumRenderer, drumControls;
let drumTrashObjects = [];
let drumFlames = [];
let drumSmokes = [];
let drumAmbientFlames = [];
let isDrumReady = false;
let drumAnimating = false;
let drumAnimations = [];
let drumBaseTrash = [];
let drumAmbientLight = null;

const DRUM_RADIUS = 1.6;
const DRUM_HEIGHT = 2.2;

function initDrumScene() {
  const container = document.getElementById('drum-canvas-wrap');
  if (!container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w === 0 || h === 0) {
    setTimeout(initDrumScene, 150);
    return;
  }

  drumScene = new THREE.Scene();
  drumScene.background = new THREE.Color(0x0a0a0a);
  drumScene.fog = new THREE.Fog(0x0a0a0a, 8, 18);

  drumCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  drumCamera.position.set(3.5, 2.5, 4.5);
  drumCamera.lookAt(0, 0.5, 0);

  drumRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  drumRenderer.setSize(w, h);
  drumRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  drumRenderer.shadowMap.enabled = true;
  drumRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  drumRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  drumRenderer.toneMappingExposure = 1.0;
  container.appendChild(drumRenderer.domElement);

  drumControls = new THREE.OrbitControls(drumCamera, drumRenderer.domElement);
  drumControls.enableDamping = true;
  drumControls.dampingFactor = 0.08;
  drumControls.maxPolarAngle = Math.PI / 2.1;
  drumControls.minPolarAngle = 0.3;
  drumControls.maxDistance = 8;
  drumControls.minDistance = 3;
  drumControls.target.set(0, 0.4, 0);
  drumControls.autoRotate = true;
  drumControls.autoRotateSpeed = 0.6;

  setupDrumLights();
  createDrum();
  createDrumBaseTrash();

  window.addEventListener('resize', onDrumResize);
  isDrumReady = true;
  animateDrum();
}

function setupDrumLights() {
  const ambient = new THREE.AmbientLight(0x331a0a, 0.5);
  drumScene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffaa66, 1.3);
  dirLight.position.set(4, 8, 4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  const d = 5;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 20;
  drumScene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0x4488ff, 0.25);
  rimLight.position.set(-4, 3, -4);
  drumScene.add(rimLight);

  const pointLight = new THREE.PointLight(0xff5500, 1.2, 5);
  pointLight.position.set(0, 0.6, 0);
  drumScene.add(pointLight);
  drumScene.userData.innerLight = pointLight;
  drumAmbientLight = pointLight;
}

function createDrum() {
  const drumGroup = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x4a3a2a,
    roughness: 0.5,
    metalness: 0.7,
  });

  const bodyGeo = new THREE.CylinderGeometry(DRUM_RADIUS, DRUM_RADIUS, DRUM_HEIGHT, 32, 1, true);
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
    color: 0x2a2018,
    roughness: 0.6,
    metalness: 0.5,
    side: THREE.DoubleSide,
  }));
  body.position.y = DRUM_HEIGHT / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  drumGroup.add(body);

  const innerGeo = new THREE.CylinderGeometry(DRUM_RADIUS * 0.96, DRUM_RADIUS * 0.96, DRUM_HEIGHT, 24, 1, true);
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x1a1208,
    roughness: 0.9,
    metalness: 0.2,
    side: THREE.BackSide,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.position.y = DRUM_HEIGHT / 2;
  drumGroup.add(inner);

  const ringMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.4, metalness: 0.8 });
  [0.05, DRUM_HEIGHT - 0.05, DRUM_HEIGHT / 2].forEach(y => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(DRUM_RADIUS + 0.02, 0.04, 8, 32),
      ringMat
    );
    ring.position.y = y;
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    drumGroup.add(ring);
  });

  const innerShadowGeo = new THREE.CircleGeometry(DRUM_RADIUS * 0.95, 32);
  const innerShadow = new THREE.Mesh(innerShadowGeo, new THREE.MeshBasicMaterial({ color: 0x050505 }));
  innerShadow.rotation.x = -Math.PI / 2;
  innerShadow.position.y = 0.02;
  drumGroup.add(innerShadow);

  const dirtMat = new THREE.MeshStandardMaterial({
    color: 0x1a1408,
    roughness: 1.0,
    metalness: 0.0,
  });
  const dirt = new THREE.Mesh(
    new THREE.CircleGeometry(DRUM_RADIUS * 0.92, 24),
    dirtMat
  );
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.y = 0.03;
  dirt.receiveShadow = true;
  drumGroup.add(dirt);

  drumScene.add(drumGroup);
}

function createDrumBaseTrash() {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (DRUM_RADIUS * 0.7);
    const size = 0.06 + Math.random() * 0.1;
    const geo = new THREE.DodecahedronGeometry(size);
    const mat = new THREE.MeshStandardMaterial({
      color: [0x3a2a1a, 0x4a3a2a, 0x2a2018][Math.floor(Math.random() * 3)],
      roughness: 0.9,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(Math.cos(angle) * dist, 0.1 + size / 2, Math.sin(angle) * dist);
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    m.castShadow = true;
    drumScene.add(m);
    drumBaseTrash.push(m);
  }
}

function addTrashToDrum(data) {
  if (!isDrumReady) return;
  const startY = DRUM_HEIGHT + 0.5;
  const startX = (Math.random() - 0.5) * 0.4;
  const startZ = (Math.random() - 0.5) * 0.4;
  const targetAngle = Math.random() * Math.PI * 2;
  const targetDist = Math.random() * (DRUM_RADIUS * 0.7);
  const targetX = Math.cos(targetAngle) * targetDist;
  const targetZ = Math.sin(targetAngle) * targetDist;
  const targetY = 0.1 + Math.random() * 0.3;
  const contentLength = (data.content || '').length;
  const weight = data.weightAfter || 50;

  const trashMesh = createTrashMesh(weight, contentLength, getTagColor(data.tags || []), data.tags);
  const scaleFactor = 0.5;
  trashMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
  trashMesh.position.set(startX, startY, startZ);
  trashMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  drumScene.add(trashMesh);
  drumTrashObjects.push(trashMesh);

  const dropHeight = DRUM_HEIGHT;
  drumAnimations.push({
    mesh: trashMesh,
    type: 'drop',
    progress: 0,
    startY: dropHeight,
    targetX,
    targetY,
    targetZ,
    startX,
    startZ,
    duration: 600,
    startTime: Date.now(),
  });
}

function burnInDrum(data, onComplete) {
  if (!isDrumReady || drumAnimating) return;
  drumAnimating = true;

  const lightIntensity = { value: 0.4 };
  const startIntensity = 0.4;
  const peakIntensity = 3.0;
  const duration = 2200;
  const startTime = Date.now();

  for (let i = 0; i < drumTrashObjects.length; i++) {
    const m = drumTrashObjects[i];
    const offset = i * 60;
    setTimeout(() => spawnDrumFlames(m.position.x, m.position.y, m.position.z), offset);
  }

  function tick() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1);

    if (t < 0.3) {
      lightIntensity.value = startIntensity + (peakIntensity - startIntensity) * (t / 0.3);
    } else if (t < 0.7) {
      lightIntensity.value = peakIntensity;
    } else {
      lightIntensity.value = peakIntensity * (1 - (t - 0.7) / 0.3);
    }
    if (drumScene.userData.innerLight) {
      drumScene.userData.innerLight.intensity = lightIntensity.value;
    }

    updateDrumFlames();
    updateDrumSmokes();

    const scale = 1 - t * 0.85;
    drumTrashObjects.forEach(m => {
      m.scale.set(0.5 * scale, 0.5 * scale, 0.5 * scale);
    });

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      drumTrashObjects.forEach(m => drumScene.remove(m));
      drumTrashObjects = [];
      if (drumScene.userData.innerLight) {
        drumScene.userData.innerLight.intensity = startIntensity;
      }
      drumAnimating = false;
      if (onComplete) onComplete();
    }
  }

  tick();
}

function spawnDrumFlames(x, y, z) {
  const flameCount = 30 + Math.floor(Math.random() * 20);
  for (let i = 0; i < flameCount; i++) {
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 + Math.random() * 0.18, 8, 8),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 1, 0.55 + Math.random() * 0.3),
        transparent: true,
        opacity: 1.0,
      })
    );
    flame.position.set(
      x + (Math.random() - 0.5) * 0.4,
      y + 0.1,
      z + (Math.random() - 0.5) * 0.4
    );
    drumScene.add(flame);
    drumFlames.push({
      mesh: flame,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 1.8 + Math.random() * 2.0,
      vz: (Math.random() - 0.5) * 0.6,
      life: 1.0,
      decay: 0.010 + Math.random() * 0.006,
      scale: 1,
      maxScale: 2.0 + Math.random() * 1.0,
    });
  }

  const smokeCount = 8;
  for (let i = 0; i < smokeCount; i++) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 + Math.random() * 0.15, 6, 6),
      new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.4,
      })
    );
    smoke.position.set(
      x + (Math.random() - 0.5) * 0.2,
      y + 0.3,
      z + (Math.random() - 0.5) * 0.2
    );
    drumScene.add(smoke);
    drumSmokes.push({
      mesh: smoke,
      vx: (Math.random() - 0.5) * 0.2,
      vy: 0.5 + Math.random() * 0.3,
      vz: (Math.random() - 0.5) * 0.2,
      life: 1.0,
      decay: 0.006,
    });
  }
}

function updateDrumFlames() {
  for (let i = drumFlames.length - 1; i >= 0; i--) {
    const f = drumFlames[i];
    f.life -= f.decay;
    f.mesh.position.x += f.vx * 0.016;
    f.mesh.position.y += f.vy * 0.016;
    f.mesh.position.z += f.vz * 0.016;
    f.vy *= 0.98;
    f.scale = Math.min(f.scale + 0.05, f.maxScale);
    f.mesh.scale.set(f.scale, f.scale, f.scale);
    f.mesh.material.opacity = f.life * 0.9;
    if (f.life <= 0) {
      drumScene.remove(f.mesh);
      f.mesh.geometry.dispose();
      f.mesh.material.dispose();
      drumFlames.splice(i, 1);
    }
  }
}

function updateDrumSmokes() {
  for (let i = drumSmokes.length - 1; i >= 0; i--) {
    const s = drumSmokes[i];
    s.life -= s.decay;
    s.mesh.position.x += s.vx * 0.016;
    s.mesh.position.y += s.vy * 0.016;
    s.mesh.position.z += s.vz * 0.016;
    const sc = 1 + (1 - s.life) * 3;
    s.mesh.scale.set(sc, sc, sc);
    s.mesh.material.opacity = s.life * 0.4;
    if (s.life <= 0) {
      drumScene.remove(s.mesh);
      s.mesh.geometry.dispose();
      s.mesh.material.dispose();
      drumSmokes.splice(i, 1);
    }
  }
}

function clearDrumTrash() {
  drumTrashObjects.forEach(m => drumScene.remove(m));
  drumTrashObjects = [];
  drumFlames.forEach(f => { drumScene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); });
  drumFlames = [];
  drumSmokes.forEach(s => { drumScene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); });
  drumSmokes = [];
  drumAmbientFlames.forEach(f => { drumScene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); });
  drumAmbientFlames = [];
}

function animateDrum() {
  requestAnimationFrame(animateDrum);
  if (!isDrumReady) return;
  spawnAmbientFire();
  updateDrumAnimations();
  updateAmbientFire();
  updateDrumFlames();
  updateDrumSmokes();
  drumControls.update();
  drumRenderer.render(drumScene, drumCamera);
}

function spawnAmbientFire() {
  if (drumAmbientFlames.length > 40) return;
  const trashCount = drumTrashObjects.length;
  const intensity = Math.min(1, 0.6 + trashCount * 0.1);
  if (Math.random() > intensity * 0.7) return;

  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * DRUM_RADIUS * 0.65;
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;
  const baseY = 0.1 + Math.random() * 0.4;

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.14 + Math.random() * 0.14, 7, 7),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.03 + Math.random() * 0.06, 1, 0.55 + Math.random() * 0.25),
      transparent: true,
      opacity: 0.95,
    })
  );
  flame.position.set(x, baseY, z);
  drumScene.add(flame);
  drumAmbientFlames.push({
    mesh: flame,
    baseX: x,
    baseZ: z,
    baseY,
    vx: (Math.random() - 0.5) * 0.2,
    vy: 0.7 + Math.random() * 0.6,
    vz: (Math.random() - 0.5) * 0.2,
    life: 1.0,
    decay: 0.012 + Math.random() * 0.006,
    scale: 0.9,
    maxScale: 1.6 + Math.random() * 0.6,
  });
}

function updateAmbientFire() {
  for (let i = drumAmbientFlames.length - 1; i >= 0; i--) {
    const f = drumAmbientFlames[i];
    f.life -= f.decay;
    f.mesh.position.x = f.baseX + Math.sin(Date.now() * 0.003 + i) * 0.05;
    f.mesh.position.y += f.vy * 0.016;
    f.mesh.position.z = f.baseZ + Math.cos(Date.now() * 0.003 + i) * 0.05;
    f.vy *= 0.97;
    f.scale = Math.min(f.scale + 0.04, f.maxScale);
    f.mesh.scale.set(f.scale, f.scale, f.scale);
    f.mesh.material.opacity = Math.max(0, f.life * 0.95);
    if (f.life <= 0 || f.mesh.position.y > DRUM_HEIGHT * 0.95) {
      drumScene.remove(f.mesh);
      f.mesh.geometry.dispose();
      f.mesh.material.dispose();
      drumAmbientFlames.splice(i, 1);
    }
  }
  if (drumAmbientLight) {
    const target = 1.0 + drumTrashObjects.length * 0.15;
    const cur = drumAmbientLight.intensity;
    drumAmbientLight.intensity = cur + (target - cur) * 0.1;
    drumAmbientLight.position.y = 0.3 + Math.sin(Date.now() * 0.002) * 0.1;
  }
}

function updateDrumAnimations() {
  const now = Date.now();
  for (let i = drumAnimations.length - 1; i >= 0; i--) {
    const a = drumAnimations[i];
    const t = Math.min((now - a.startTime) / a.duration, 1);
    a.progress = t;
    const eased = 1 - Math.pow(1 - t, 3);
    a.mesh.position.y = a.startY + (a.targetY - a.startY) * eased;
    a.mesh.position.x = a.startX + (a.targetX - a.startX) * eased;
    a.mesh.position.z = a.startZ + (a.targetZ - a.startZ) * eased;
    a.mesh.rotation.x += 0.04;
    a.mesh.rotation.z += 0.025;
    if (t >= 1) drumAnimations.splice(i, 1);
  }
}

function onDrumResize() {
  if (!drumRenderer) return;
  const container = document.getElementById('drum-canvas-wrap');
  if (!container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  drumCamera.aspect = w / h;
  drumCamera.updateProjectionMatrix();
  drumRenderer.setSize(w, h);
}

function getTagColor(tags) {
  if (!tags || tags.length === 0) return 0x888888;
  const map = {
    '분노': 0xff1744, '짜증': 0xff6d00, '후회': 0x9c27b0,
    '실망': 0x4a148c, '서운함': 0x5c6bc0, '상처': 0x7b1fa2,
    '슬픔': 0x1565c0, '불안': 0x827717, '스트레스': 0xe65100,
    '외로움': 0x37474f, '무기력': 0x616161, '지침': 0x78909c,
  };
  return map[tags[0]] || 0x888888;
}

function ensureDrumReady() {
  if (!isDrumReady) {
    initDrumScene();
  } else {
    onDrumResize();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 초기화는 showSection('mytrash')에서 처리
});
