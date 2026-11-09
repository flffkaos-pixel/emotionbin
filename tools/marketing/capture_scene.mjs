// Capture live 3D trash mountain scene via Chrome DevTools Protocol
// usage: node tools/marketing/capture_scene.mjs
import { spawn } from 'child_process';
import { writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9444;
const URL = process.argv[2] || 'https://emotionbin.pages.dev/';
const OUT = process.argv[3] || 'store/scene-live-1280x640.png';
const PROFILE = join(tmpdir(), 'emotionbin-capture-profile');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

rmSync(PROFILE, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
  '--disable-background-networking', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--window-size=1280,640', 'about:blank',
], { stdio: 'ignore', detached: false });

let wsUrl = null;
for (let i = 0; i < 40 && !wsUrl; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const list = await res.json();
    const page = list.find((t) => t.type === 'page');
    if (page) wsUrl = page.webSocketDebuggerUrl;
  } catch { /* not up yet */ }
  if (!wsUrl) await sleep(500);
}
if (!wsUrl) { chrome.kill(); throw new Error('Chrome DevTools not reachable'); }

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  }
};
const cdp = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
await cdp('Page.enable', {}, sessionId);
await cdp('Runtime.enable', {}, sessionId);
const ev = (expr) => cdp('Runtime.evaluate', { expression: expr, awaitPromise: false, returnByValue: true }, sessionId);

console.log('navigating', URL);
await cdp('Page.navigate', { url: URL }, sessionId);

for (let i = 0; i < 30; i++) {
  try {
    const r = await ev('document.readyState');
    if (r.result.value === 'complete') break;
  } catch { /* retry */ }
  await sleep(500);
}
console.log('page loaded, waiting for scene init');
await sleep(5000);

const rounds = Number(process.env.INJECT_ROUNDS || 1);
const waitMs = Number(process.env.STATS_WAIT_MS || 30000);

const prep = await ev(`(function(){
  if (typeof allTrash === 'undefined' || typeof createTrashItem !== 'function')
    return JSON.stringify({ok:false, reason:'globals missing'});
  const ov = document.getElementById('canvas-overlay');
  if (ov) ov.style.display = 'none';
  const tk = document.getElementById('ticker');
  if (tk) tk.style.display = 'none';
  const pr = document.getElementById('app-promo');
  if (pr) pr.remove();
  const pub = allTrash.filter(t => t.privacy !== 'private');
  for (let r = 0; r < ${rounds}; r++) {
    pub.forEach(t => { try { createTrashItem(t); } catch (e) {} });
  }
  return JSON.stringify({ok:true, items: pub.length * ${rounds}});
})()`);
console.log('scene:', prep.result.value);

await sleep(waitMs);

const stats = await ev(`(function(){
  if (typeof trashObjects === 'undefined') return JSON.stringify({ok:false});
  const v = new THREE.Vector3();
  // 媛??ㅻ툕?앺듃??"諛붾떏 ?믪씠" = 以묒떖 y - ?ㅼ젣 ?믪씠/2  (?뺤갑 ???ㅼ젣 ?곸옱 ?믪씠)
  const bases = trashObjects.map(o => {
    const box = new THREE.Box3().setFromObject(o);
    box.getSize(v);
    return o.position.y - v.y / 2;
  });
  const sorted = bases.slice().sort((a,b)=>a-b);
  const grid = Array.from(pileGrid);
  const nz = grid.filter(x => x > 0.01);
  const radii = trashObjects.map(o => Math.hypot(o.position.x, o.position.z));

  // ??臾쇨굔(?됱옣怨졖룹옄?숈감湲??쇰━ 愿??寃뱀묠 媛쒖닔 痢≪젙
  const items = trashObjects.map(o => {
    const box = new THREE.Box3().setFromObject(o);
    const size = new THREE.Vector3(); box.getSize(size);
    const c = new THREE.Vector3(); box.getCenter(c);
    return { x: c.x, z: c.z, r: Math.max(size.x, size.z) / 2, bottom: c.y - size.y / 2, top: c.y + size.y / 2 };
  });
  let bigCount = 0, bigPairs = 0, clipPairs = 0;
  for (let i = 0; i < items.length; i++) {
    if (items[i].r < 1.4) continue;
    bigCount++;
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (b.r < 1.4) continue;
      bigPairs++;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      const vOverlap = Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom);
      if (d < (a.r + b.r) * 0.85 && vOverlap > 0.2) clipPairs++;
    }
  }
  return JSON.stringify({
    count: bases.length,
    baseMin: +sorted[0].toFixed(2),
    baseMedian: +sorted[Math.floor(sorted.length/2)].toFixed(2),
    baseP90: +sorted[Math.floor(sorted.length*0.9)].toFixed(2),
    baseMax: +sorted[sorted.length-1].toFixed(2),
    onGround: bases.filter(b => b < 0.6).length,
    stacked: bases.filter(b => b > 1.5).length,
    gridMax: +Math.max(...grid).toFixed(2),
    gridAvgNonZero: +(nz.reduce((a,b)=>a+b,0)/Math.max(1,nz.length)).toFixed(2),
    maxRadius: +Math.max(...radii).toFixed(2),
    animsLeft: dumpAnimations.length,
    pileDebug: JSON.stringify(window.__pileDebug || {}),
    avgPlacedH: window.__pileDebug && window.__pileDebug.hN ? +(window.__pileDebug.hSum / window.__pileDebug.hN).toFixed(2) : null,
    bigItems: bigCount,
    bigPairs,
    clipPairs,
  });
})()`);
console.log('SCENE STATS:', stats.result.value);

const shot = await cdp('Page.captureScreenshot', { format: 'png' }, sessionId);
writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
console.log('saved', OUT);

ws.close();
chrome.kill();
try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
process.exit(0);

