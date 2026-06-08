// Test script: 시뮬레이트 브라우저 환경에서 모든 기능 검증
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.cwd();
const HTML_FILE = path.join(PROJECT_DIR, 'index.html');
const CSS_FILE = path.join(PROJECT_DIR, 'css', 'style.css');
const SCRIPTS = [
  'js/trash-mountain.js',
  'js/ai.js',
  'js/effects.js',
  'js/drum-scene.js',
  'js/app.js',
];

const issues = [];
const passes = [];

// 1. HTML 검증
console.log('=== 1. HTML 검증 ===');
const html = fs.readFileSync(HTML_FILE, 'utf-8');
const htmlChecks = [
  { name: 'canvas/container 3D', pattern: /id="three-container"/, required: true },
  { name: 'drum container', pattern: /id="drum-container"/, required: true },
  { name: 'drum canvas wrap', pattern: /id="drum-canvas-wrap"/, required: true },
  { name: 'feed section', pattern: /id="section-feed"/, required: true },
  { name: 'feed list', pattern: /id="feed-list"/, required: true },
  { name: 'mytrash list', pattern: /id="mytrash-list"/, required: true },
  { name: 'top10 list', pattern: /id="top10-list"/, required: true },
  { name: 'dump modal', pattern: /id="dump-modal"/, required: true },
  { name: 'emotion-text textarea', pattern: /id="emotion-text"/, required: true },
  { name: 'dump-btn', pattern: /id="dump-btn"/, required: true },
  { name: 'trash preview', pattern: /id="trash-preview"/, required: true },
  { name: 'weight sliders', pattern: /id="weight-(before|after)"/, required: true },
  { name: 'AI mode buttons', pattern: /selectAIMode/, required: true },
  { name: 'nav link mountain', pattern: /onclick="showSection\('mountain'\)"/, required: true },
  { name: 'nav link feed', pattern: /onclick="showSection\('feed'\)"/, required: true },
  { name: 'nav link mytrash', pattern: /onclick="showSection\('mytrash'\)"/, required: true },
  { name: 'reset data btn', pattern: /resetAllData\(\)/, required: true },
];
htmlChecks.forEach(check => {
  if (check.pattern.test(html)) {
    passes.push('HTML: ' + check.name);
  } else {
    issues.push('HTML MISSING: ' + check.name);
  }
});

// 2. Script syntax 검증
console.log('\n=== 2. Script Syntax ===');
SCRIPTS.forEach(s => {
  const f = path.join(PROJECT_DIR, s);
  try {
    new Function(fs.readFileSync(f, 'utf-8'));
    passes.push('SYNTAX: ' + s);
  } catch(e) {
    issues.push('SYNTAX ERROR in ' + s + ': ' + e.message);
  }
});

// 3. Script에서 필요한 함수/심볼 검증
console.log('\n=== 3. Script Symbols ===');
const symbolChecks = [
  { file: 'js/trash-mountain.js', symbols: ['function initScene', 'function createTrashMesh', 'function scheduleTrashItem', 'function createTrashItem', 'function setAutoRotate', 'function animate', 'function onResize'] },
  { file: 'js/drum-scene.js', symbols: ['function initDrumScene', 'function addTrashToDrum', 'function burnInDrum', 'function clearDrumTrash', 'function ensureDrumReady', 'function createDrum', 'let drumTrashObjects'] },
  { file: 'js/app.js', symbols: ['function dumpEmotion', 'function closeDumpModal', 'function openDumpModal', 'function renderFeed', 'function renderMyTrash', 'function renderTop10', 'function burnMyTrash', 'function resetForm', 'function reactToFeed', 'function resetAllData', 'function getTrashTypeByLength', 'let pendingDumpData', 'let myTrash', 'let allTrash'] },
  { file: 'js/effects.js', symbols: ['function createBurnEffect', 'function createExplosion'] },
];
symbolChecks.forEach(check => {
  const content = fs.readFileSync(path.join(PROJECT_DIR, check.file), 'utf-8');
  check.symbols.forEach(sym => {
    if (content.includes(sym)) {
      passes.push(check.file + ': ' + sym);
    } else {
      issues.push(check.file + ' MISSING: ' + sym);
    }
  });
});

// 4. CSS 검증
console.log('\n=== 4. CSS ===');
const css = fs.readFileSync(CSS_FILE, 'utf-8');
const cssChecks = [
  { name: 'feed-item', pattern: /\.feed-item/ },
  { name: 'feed-tag', pattern: /\.feed-tag/ },
  { name: 'feed-reaction', pattern: /\.feed-reaction/ },
  { name: 'drum-container', pattern: /\.drum-container/ },
  { name: 'drum-canvas-wrap', pattern: /#drum-canvas-wrap/ },
  { name: 'reset-data-btn', pattern: /\.reset-data-btn/ },
  { name: 'mytrash-item', pattern: /\.mytrash-item/ },
  { name: 'top10-item', pattern: /\.top10-item/ },
  { name: 'section', pattern: /\.section\s*\{/ },
  { name: 'section.active', pattern: /\.section\.active/ },
];
cssChecks.forEach(check => {
  if (check.pattern.test(css)) {
    passes.push('CSS: ' + check.name);
  } else {
    issues.push('CSS MISSING: ' + check.name);
  }
});

// 5. Script load order (index.html)
console.log('\n=== 5. Script Load Order ===');
const scriptTags = [...html.matchAll(/<script\s+src="js\/([^"?]+)[^"]*"\s+defer><\/script>/g)];
const order = scriptTags.map(m => m[1]);
const expectedOrder = ['firebase-db.js', 'trash-mountain.js', 'ai.js', 'effects.js', 'drum-scene.js', 'app.js'];
const orderOk = JSON.stringify(order) === JSON.stringify(expectedOrder);
if (orderOk) {
  passes.push('SCRIPT ORDER: ' + order.join(' → '));
} else {
  issues.push('SCRIPT ORDER WRONG: got ' + order.join(' → '));
}

// 6. Sample data (allTrash 초기화)
console.log('\n=== 6. Sample Data ===');
const appJs = fs.readFileSync(path.join(PROJECT_DIR, 'js/app.js'), 'utf-8');
const sampleMatch = appJs.match(/sampleTrash\s*=\s*\[([\s\S]*?)\];/);
if (sampleMatch) {
  const samples = (sampleMatch[1].match(/content:/g) || []).length;
  passes.push('SAMPLE DATA: ' + samples + ' items');
} else {
  issues.push('SAMPLE DATA: not found');
}

// 7. Public/Private toggle
const hasPublicRadio = html.includes('name="privacy"') && html.includes('value="public"');
const hasPrivateRadio = html.includes('name="privacy"') && html.includes('value="private"');
if (hasPublicRadio && hasPrivateRadio) {
  passes.push('PRIVACY: public + private options');
} else {
  issues.push('PRIVACY: missing radio buttons');
}

// 8. Cache version
const cacheMatch = html.match(/\?v=(\d+)/);
if (cacheMatch) {
  passes.push('CACHE VERSION: v=' + cacheMatch[1]);
} else {
  issues.push('CACHE VERSION: not found');
}

// 결과 출력
console.log('\n=== 결과 ===');
console.log('통과: ' + passes.length);
console.log('실패: ' + issues.length);
if (issues.length > 0) {
  console.log('\n=== 이슈 ===');
  issues.forEach(i => console.log('  ❌ ' + i));
} else {
  console.log('\n✅ 모든 검증 통과');
}

process.exit(issues.length > 0 ? 1 : 0);
