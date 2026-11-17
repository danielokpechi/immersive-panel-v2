// Static file server for the Next export (out/) plus a tiny realtime relay, so
// an operator console can drive fan phones on other devices (Pogoń demo).
// Replaces `serve out` in the Docker image; no dependencies.
//
//   GET  /relay/health          → "ok" (the client probes this to pick the relay)
//   GET  /relay/sub/<topic>     → Server-Sent Events stream of published messages
//   POST /relay/pub/<topic>     → body is one JSON command, fanned out to subscribers
//   GET  /relay/last/<topic>    → the last `state` command (late joiners catch up)
//
// Topics live in memory only; a restart clears them, which is fine for demos.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || 'out');
const PORT = Number(process.env.PORT || 7778);
const MAX_BODY = 8 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.map': 'application/json', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
};

// ── relay ────────────────────────────────────────────────────────────────────
const subs = new Map(); // topic → Set<res>
const lastState = new Map(); // topic → JSON string
const TOPIC = /^[A-Za-z0-9_-]{1,80}$/;

function relay(req, res, url) {
  const [, , action, topic] = url.pathname.split('/'); // '', 'relay', action, topic
  const cors = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
  if (action === 'health') { res.writeHead(200, { ...cors, 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (!topic || !TOPIC.test(topic)) { res.writeHead(400, cors); return res.end('bad topic'); }

  if (action === 'sub' && req.method === 'GET') {
    res.writeHead(200, { ...cors, 'Content-Type': 'text/event-stream', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    const last = lastState.get(topic);
    if (last) res.write(`data: ${last}\n\n`);
    if (!subs.has(topic)) subs.set(topic, new Set());
    subs.get(topic).add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000); // keeps nginx/mobile proxies open
    req.on('close', () => { clearInterval(ping); subs.get(topic)?.delete(res); });
    return;
  }
  if (action === 'last' && req.method === 'GET') {
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
    return res.end(lastState.get(topic) || 'null');
  }
  if (action === 'pub' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on('end', () => {
      let msg;
      try { msg = JSON.parse(body); } catch { res.writeHead(400, cors); return res.end('bad json'); }
      if (!msg || typeof msg.cmd !== 'string') { res.writeHead(400, cors); return res.end('no cmd'); }
      const line = JSON.stringify(msg);
      if (msg.cmd === 'state') lastState.set(topic, line);
      for (const r of subs.get(topic) || []) r.write(`data: ${line}\n\n`);
      res.writeHead(200, cors);
      res.end('ok');
    });
    return;
  }
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...cors, 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': '*' }); return res.end(); }
  res.writeHead(404, cors);
  res.end();
}

// ── static (same behaviour the site relied on from `serve`) ─────────────────
function send(res, file, status = 200) {
  const ext = path.extname(file).toLowerCase();
  const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream' };
  headers['Cache-Control'] = file.includes(`${path.sep}_next${path.sep}static${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(status, headers);
  fs.createReadStream(file).pipe(res);
}
const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

function serveStatic(req, res, url) {
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
  const abs = path.join(ROOT, rel);
  if (!abs.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (isFile(abs)) return send(res, abs);
  if (isDir(abs)) {
    if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' + url.search }); return res.end(); }
    if (isFile(path.join(abs, 'index.html'))) return send(res, path.join(abs, 'index.html'));
  }
  if (isFile(abs + '.html')) return send(res, abs + '.html');
  const notFound = path.join(ROOT, '404.html');
  if (isFile(notFound)) return send(res, notFound, 404);
  res.writeHead(404); res.end('Not found');
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local');
  if (url.pathname.startsWith('/relay/')) return relay(req, res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res, url);
}).listen(PORT, () => console.log(`serving ${ROOT} with /relay on :${PORT}`));
