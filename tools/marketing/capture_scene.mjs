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
  for (let r = 0; r < 3; r++) {
    pub.forEach(t => { try { createTrashItem(t); } catch (e) {} });
  }
  return JSON.stringify({ok:true, items: pub.length * 3});
})()`);
console.log('scene:', prep.result.value);

await sleep(14000);

const shot = await cdp('Page.captureScreenshot', { format: 'png' }, sessionId);
writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
console.log('saved', OUT);

ws.close();
chrome.kill();
try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
process.exit(0);
