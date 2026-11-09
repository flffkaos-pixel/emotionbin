// Play Console 조작용 CDP 도우미 (지속 실행형)
// usage:
//   node tools/marketing/cdp_play.mjs launch          # 크롬 종료·프로필 복사·실행·콘솔 접속
//   node tools/marketing/cdp_play.mjs eval "<expr>"   # 실행 중 브라우저에서 JS 실행
//   node tools/marketing/cdp_play.mjs click "<text>"  # 텍스트로 요소 클릭
//   node tools/marketing/cdp_play.mjs goto "<url>"    # 페이지 이동
//   node tools/marketing/cdp_play.mjs shot <path>     # 스크린샷
//   node tools/marketing/cdp_play.mjs file <selector> <absPath>  # 파일 업로드(input)
import { spawn, execSync } from 'child_process';
import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SRC = join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
const PROFILE = join(tmpdir(), 'eb-play-profile');
const PORT = 9446;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const target = list.find((x) => x.type === 'page' && /play\.google\.com|about:blank|google\.com/.test(x.url)) || list.find((x) => x.type === 'page');
  if (!target) throw new Error('no page target');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
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
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  return { send, ws };
}

function copyProfile() {
  rmSync(PROFILE, { recursive: true, force: true });
  mkdirSync(join(PROFILE, 'Default', 'Network'), { recursive: true });
  const files = ['Local State', 'Default/Preferences', 'Default/Network/Cookies', 'Default/Secure Preferences'];
  for (const rel of files) {
    const src = join(SRC, ...rel.split('/'));
    const dst = join(PROFILE, ...rel.split('/'));
    if (existsSync(src)) { cpSync(src, dst); console.log('copied', rel); }
  }
  const ls = join(SRC, 'Default', 'Local Storage');
  if (existsSync(ls)) { cpSync(ls, join(PROFILE, 'Default', 'Local Storage'), { recursive: true }); console.log('copied Local Storage'); }
}

const cmd = process.argv[2];

if (cmd === 'launch') {
  console.log('Chrome 종료 중...');
  try { execSync('taskkill /IM chrome.exe /F /T', { stdio: 'ignore' }); } catch {}
  await sleep(4000);
  copyProfile();
  spawn(CHROME, [
    `--user-data-dir=${PROFILE}`,
    `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--no-default-browser-check',
    '--window-size=1400,950',
    'https://play.google.com/console',
  ], { stdio: 'ignore', detached: true }).unref();
  console.log('Chrome 실행됨 (프로필 복사본)');
  await sleep(10000);
  const { send } = await connect();
  const info = (await send('Runtime.evaluate', {
    expression: `JSON.stringify({href: location.href, title: document.title, txt: document.body.innerText.slice(0,400)})`,
    returnByValue: true,
  })).result.value;
  console.log('PROBE:', info);
  process.exit(0);
}

if (cmd === 'eval') {
  const { send } = await connect();
  const expr = process.argv[3];
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  console.log(typeof r.result.value === 'string' ? r.result.value : JSON.stringify(r.result.value, null, 2));
  process.exit(0);
}

if (cmd === 'goto') {
  const { send } = await connect();
  await send('Page.navigate', { url: process.argv[3] });
  await sleep(7000);
  const info = (await send('Runtime.evaluate', { expression: `JSON.stringify({href:location.href,title:document.title})`, returnByValue: true })).result.value;
  console.log(info);
  process.exit(0);
}

if (cmd === 'click') {
  const { send } = await connect();
  const text = process.argv[3];
  const expr = `(() => {
    const t = ${JSON.stringify(text)};
    const all = Array.from(document.querySelectorAll('button,a,[role="menuitem"],[role="button"],span,div'));
    const cands = all.filter(e => (e.innerText||'').trim() === t);
    const pool = cands.length ? cands : all.filter(e => (e.innerText||'').includes(t) && e.innerText.length < t.length + 40);
    if (!pool.length) return 'NOT_FOUND';
    const el = pool.sort((a,b) => (a.innerText||'').length - (b.innerText||'').length)[0];
    el.scrollIntoView({block:'center'});
    el.click();
    return 'CLICKED: ' + (el.innerText||'').slice(0,40);
  })()`;
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  console.log(r.result.value);
  await sleep(2500);
  process.exit(0);
}

if (cmd === 'shot') {
  const { send } = await connect();
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const { writeFileSync } = await import('fs');
  writeFileSync(process.argv[3], Buffer.from(shot.data, 'base64'));
  console.log('saved', process.argv[3]);
  process.exit(0);
}

if (cmd === 'file') {
  const { send } = await connect();
  const sel = process.argv[3];
  const doc = await send('DOM.getDocument', {});
  const node = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel });
  if (!node.nodeId) { console.log('SELECTOR_NOT_FOUND'); process.exit(1); }
  await send('DOM.setFileInputFiles', { nodeId: node.nodeId, files: [process.argv[4]] });
  console.log('FILE_SET');
  process.exit(0);
}

console.log('unknown command');
