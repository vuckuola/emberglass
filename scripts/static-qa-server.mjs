import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '../dist');
const PORT = 4173;
const BASE = '/emberglass';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Strip the base path prefix for serving from dist/
  if (urlPath.startsWith(BASE)) {
    urlPath = urlPath.slice(BASE.length);
  }
  if (!urlPath.startsWith('/')) {
    urlPath = '/' + urlPath;
  }

  const filePath = path.join(DIST, urlPath);
  const ext = path.extname(filePath);

  const serve = (code, content, type) => {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(content);
  };

  fs.readFile(filePath, (err, data) => {
    if (!err) {
      serve(200, data, CONTENT_TYPES[ext] || 'application/octet-stream');
      return;
    }
    if (err.code === 'EISDIR' || err.code === 'ENOENT') {
      // SPA fallback
      fs.readFile(path.join(DIST, 'index.html'), (e2, d2) => {
        if (e2) { serve(404, 'Not found', 'text/plain'); return; }
        serve(200, d2, 'text/html; charset=utf-8');
      });
      return;
    }
    serve(404, 'Not found', 'text/plain');
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Static QA server on http://127.0.0.1:${PORT}`);
});
