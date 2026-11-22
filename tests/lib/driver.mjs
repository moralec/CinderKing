// driver.mjs -- a small Chrome DevTools Protocol driver for headless Chromium (Node 22+, no dependencies).
//
//   import * as D from './driver.mjs';
//   const b = await D.launch({ width: 1280, height: 800 });
//   const p = await D.openPage(b, 'file:///path/index.html?seed=1', { preload: '...js run before page scripts...' });
//   await D.press(p, 'Space'); await D.keyDown(p, 'Space'); await D.wait(500); await D.keyUp(p, 'Space');
//   const v = await D.evaluate(p, 'window.game.state');
//   await D.screenshot(p, 'out.png');
//   p.errors   -> console errors, uncaught exceptions, Log errors (strings)
//   p.requests -> every URL the page requested (document included)
//   await D.close(b);
//
// One page per browser keeps every page visible and focused, so requestAnimationFrame runs at full rate.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CHROMIUM = process.env.Q1_CHROMIUM || '/usr/bin/chromium';

export const KEYS = {
  Space: { key: ' ', code: 'Space', keyCode: 32, text: ' ' },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  A: { key: 'a', code: 'KeyA', keyCode: 65, text: 'a' },
  D: { key: 'd', code: 'KeyD', keyCode: 68, text: 'd' },
  R: { key: 'r', code: 'KeyR', keyCode: 82, text: 'r' },
  M: { key: 'm', code: 'KeyM', keyCode: 77, text: 'm' },
  Escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
  Enter: { key: 'Enter', code: 'Enter', keyCode: 13, text: '\r' },
};

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

class Conn {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = new Set();
    ws.onmessage = (ev) => {
      const m = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString());
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? rej(new Error(`${m.error.message} ${m.error.data || ''}`)) : res(m.result);
      } else for (const f of this.listeners) f(m);
    };
    ws.onclose = () => { for (const { rej } of this.pending.values()) rej(new Error('CDP connection closed')); this.pending.clear(); };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    });
  }
}

const LIVE = new Map(); // pid -> profile dir of browsers still running; killed and removed if this Node process exits first
function killAll() { for (const [pid, dir] of LIVE) { try { process.kill(-pid, 'SIGKILL'); } catch {} try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} } LIVE.clear(); }
process.on('exit', killAll);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(sig, () => { killAll(); process.exit(130); });

/** Start headless Chromium; returns a browser handle. */
export async function launch({ width = 1280, height = 800, args = [] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'q1-cdp-'));
  const proc = spawn(CHROMIUM, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
    '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--window-size=${width},${height}`,
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--disable-extensions', '--disable-component-update', '--disable-sync', '--no-sandbox', ...args, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'], detached: true }); // own process group: close() kills every child too
  LIVE.set(proc.pid, dir);
  const portFile = path.join(dir, 'DevToolsActivePort');
  const t0 = Date.now();
  while (!fs.existsSync(portFile) || fs.readFileSync(portFile, 'utf8').split('\n').length < 2) {
    if (Date.now() - t0 > 20000 || proc.exitCode !== null) { try { process.kill(-proc.pid, 'SIGKILL'); } catch {} LIVE.delete(proc.pid); throw new Error('chromium did not start'); }
    await wait(50);
  }
  const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
  const ws = new WebSocket(`ws://127.0.0.1:${port}${wsPath}`);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP websocket failed')); });
  return { proc, dir, conn: new Conn(ws), width, height };
}

/** Close the browser (all its processes) and remove its profile. */
export async function close(browser) {
  const { proc } = browser;
  const exited = new Promise((r) => { if (proc.exitCode !== null || proc.signalCode !== null) r(); else proc.once('exit', r); });
  let timer;
  try { browser.conn.send('Browser.close').catch(() => {}); } catch {}
  await Promise.race([exited, new Promise((r) => { timer = setTimeout(r, 3000); })]);
  clearTimeout(timer);
  try { browser.conn.ws.close(); } catch {}
  try { process.kill(-proc.pid, 'SIGKILL'); } catch {}
  try { proc.kill('SIGKILL'); } catch {}
  LIVE.delete(proc.pid);
  await wait(200);
  try { fs.rmSync(browser.dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch {}
}

/** Open a page (in its own window) and navigate to url. opts.preload = JS evaluated before any page script. */
export async function openPage(browser, url, { preload = null, width = browser.width, height = browser.height, timeout = 15000 } = {}) {
  const { conn } = browser;
  const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank', newWindow: true });
  const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
  const page = { browser, conn, sessionId, targetId, errors: [], requests: [], events: [], loaded: false };
  const send = (m, p) => conn.send(m, p, sessionId);
  page.send = send;
  let onLoad = null;
  conn.listeners.add((m) => {
    if (m.sessionId !== sessionId) return;
    const p = m.params || {};
    switch (m.method) {
      case 'Runtime.exceptionThrown': {
        const d = p.exceptionDetails || {};
        page.errors.push('exception: ' + ((d.exception && d.exception.description) || d.text || 'unknown').split('\n')[0]);
        break;
      }
      case 'Runtime.consoleAPICalled':
        if (p.type === 'error' || p.type === 'assert')
          page.errors.push('console.' + p.type + ': ' + (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
        break;
      case 'Log.entryAdded':
        if (p.entry && p.entry.level === 'error') page.errors.push('log: ' + (p.entry.text || '').slice(0, 300) + (p.entry.url ? ' ' + p.entry.url : ''));
        break;
      case 'Network.requestWillBeSent': page.requests.push(p.request.url); break;
      case 'Network.webSocketCreated': page.requests.push(p.url); break;
      case 'Page.loadEventFired': page.loaded = true; if (onLoad) onLoad(); break;
    }
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  try { await send('Emulation.setFocusEmulationEnabled', { enabled: true }); } catch {}
  if (preload) await send('Page.addScriptToEvaluateOnNewDocument', { source: preload });
  await navigate(page, url, timeout);
  return page;
}

/** Navigate (or reload) and wait for the load event. */
export async function navigate(page, url, timeout = 15000) {
  page.loaded = false;
  let timer;
  const done = new Promise((res) => {
    const f = (m) => { if (m.sessionId === page.sessionId && m.method === 'Page.loadEventFired') { page.conn.listeners.delete(f); clearTimeout(timer); res(true); } };
    page.conn.listeners.add(f);
    timer = setTimeout(() => { page.conn.listeners.delete(f); res(false); }, timeout);
  });
  const r = await page.send('Page.navigate', { url });
  if (r.errorText) page.errors.push('navigate: ' + r.errorText);
  const ok = await done;
  try { await page.send('Page.bringToFront'); } catch {}
  return ok;
}

/** Evaluate an expression in the page; returns its value (promises awaited). Throws on exceptions. */
export async function evaluate(page, expr, { timeout = 60000 } = {}) {
  let timer;
  const r = await Promise.race([
    page.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, userGesture: false }),
    new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('evaluate timeout')), timeout); }),
  ]).finally(() => clearTimeout(timer));
  if (r.exceptionDetails) throw new Error('page exception: ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text));
  return r.result.value;
}

/** Like evaluate but returns `fallback` instead of throwing. */
export async function tryEval(page, expr, fallback = null, opts) {
  try { return await evaluate(page, expr, opts); } catch { return fallback; }
}

function keyParams(name) {
  const k = KEYS[name];
  if (!k) throw new Error('unknown key ' + name);
  return { key: k.key, code: k.code, windowsVirtualKeyCode: k.keyCode, nativeVirtualKeyCode: k.keyCode };
}

export async function keyDown(page, name) {
  const k = KEYS[name];
  await page.send('Input.dispatchKeyEvent', { type: k.text ? 'keyDown' : 'rawKeyDown', text: k.text, unmodifiedText: k.text, ...keyParams(name) });
}

export async function keyUp(page, name) {
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...keyParams(name) });
}

/** Press and release a key (holdMs between down and up). */
export async function press(page, name, holdMs = 40) {
  await keyDown(page, name); await wait(holdMs); await keyUp(page, name);
}

/** Hold a key for ms milliseconds. */
export async function hold(page, name, ms) { return press(page, name, ms); }

/** PNG screenshot of the viewport; writes it to file if given, returns a Buffer. */
export async function screenshot(page, file = null) {
  const r = await page.send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(r.data, 'base64');
  if (file) fs.writeFileSync(file, buf);
  return buf;
}

/** Change the viewport size (fires resize in the page). */
export async function resize(page, width, height) {
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
}

/** Poll a JS expression inside the page (every animation frame / 10 ms) until truthy; returns its value, or null on timeout. */
export async function waitFor(page, expr, timeoutMs = 5000) {
  const js = `new Promise((res) => { const t0 = performance.now();
    const f = () => { let v = null; try { v = (${expr}); } catch (e) {}
      if (v) return res(v); if (performance.now() - t0 > ${timeoutMs}) return res(null); setTimeout(f, 8); }; f(); })`;
  return tryEval(page, js, null, { timeout: timeoutMs + 5000 });
}
