import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: npm start -- [--port 3000]\nPreview the static build at http://127.0.0.1:3000/apicaller\nRun npm run build first.');
  process.exit(0);
}
if (args.length && (args.length !== 2 || args[0] !== '--port')) {
  console.error('Usage: npm start -- [--port 3000]');
  process.exit(1);
}
const port = Number(args[1] ?? process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Port must be an integer from 1 to 65535.');
  process.exit(1);
}
const root = resolve('out');
try { await stat(resolve(root, 'index.html')); } catch {
  console.error('No static build found. Run npm run build before npm start.');
  process.exit(1);
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/') { res.writeHead(302, { Location: '/apicaller/' }).end(); return; }
    if (pathname !== '/apicaller' && !pathname.startsWith('/apicaller/')) { res.writeHead(404).end('Not found'); return; }
    const relative = pathname.slice('/apicaller'.length).replace(/^\//, '');
    let path = resolve(root, relative || 'index.html');
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(404).end('Not found'); return; }
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    } catch {
      if (!extname(path)) path += '.html';
    }
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Static preview: http://127.0.0.1:${port}/apicaller`));
