const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { createServer } = require('node:net');
const script = resolve('scripts/serve.mjs');

test('preview CLI gives actionable help, missing-build and invalid-port errors', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'apicaller-preview-'));
  try {
    const help = spawnSync(process.execPath, [script, '--help'], { cwd, encoding: 'utf8' });
    assert.equal(help.status, 0);
    assert.match(help.stdout, /npm run build/);
    const missing = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /Run npm run build/);
    for (const args of [['--port', 'oops'], ['--port', '0'], ['--unknown']]) {
      assert.equal(spawnSync(process.execPath, [script, ...args], { cwd }).status, 1);
    }
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test('static preview serves base path, compare, assets and HEAD without exposing other files', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'apicaller-preview-'));
  const reserve = createServer();
  await new Promise((resolve) => reserve.listen(0, '127.0.0.1', resolve));
  const port = reserve.address().port;
  await new Promise((resolve) => reserve.close(resolve));
  mkdirSync(join(cwd, 'out'));
  writeFileSync(join(cwd, 'out', 'index.html'), '<h1>fixture</h1>');
  writeFileSync(join(cwd, 'out', 'compare.html'), '<h1>compare</h1>');
  writeFileSync(join(cwd, 'out', 'fixture.css'), 'body{color:red}');
  writeFileSync(join(cwd, 'private.txt'), 'outside export');
  const child = spawn(process.execPath, [script, '--port', String(port)], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Preview startup timeout')), 10000);
      child.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
      child.once('error', reject);
      child.once('exit', (code) => { clearTimeout(timeout); if (code) reject(Error(`Preview exited ${code}`)); });
    });
    const base = `http://127.0.0.1:${port}`;
    for (const route of ['/apicaller', '/apicaller/']) assert.match(await (await fetch(base + route)).text(), /fixture/);
    assert.match(await (await fetch(base + '/apicaller/compare')).text(), /compare/);
    assert.match((await fetch(base + '/apicaller/fixture.css')).headers.get('content-type'), /text\/css/);
    assert.equal(await (await fetch(base + '/apicaller', { method: 'HEAD' })).text(), '');
    assert.equal((await fetch(base + '/apicaller', { method: 'POST' })).status, 405);
    for (const route of ['/private.txt', '/apicaller/../private.txt', '/apicaller/%2e%2e%5cprivate.txt', '/apicaller/%zz', '/apicaller/missing']) {
      assert.equal((await fetch(base + route)).status, 404, route);
    }
    assert.equal((await fetch(base + '/', { redirect: 'manual' })).headers.get('location'), '/apicaller/');
  } finally {
    const stopped = new Promise((resolve) => child.once('exit', resolve));
    child.kill();
    await stopped;
    rmSync(cwd, { recursive: true, force: true });
  }
});
