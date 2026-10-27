const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { spawnSync } = require('node:child_process');

function loadSource(name, context = {}) {
  const code = ts.transpileModule(fs.readFileSync(`src/lib/${name}.ts`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, URL, TextEncoder, TextDecoder, btoa, atob, require: (name) => {
    if (!/^\.\/[\w-]+$/.test(name)) throw Error(`Unexpected source import: ${name}`);
    return loadSource(name.slice(2), context);
  }, ...context });
  return exports;
}
const { parseUrl, buildCurlCommand, buildFetchCode } = loadSource('url');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

test('rejects empty, non-HTTP, credential and malformed URLs', () => {
  for (const url of ['', ' ', 'ftp://example.com', 'javascript:alert(1)', 'https://', 'https://a b', 'https://user:secret@example.com']) {
    assert.equal(parseUrl(url).isValid, false, url);
  }
  for (const url of ['example.com/path?q=1', 'HTTPS://example.com', 'http://localhost:8080/a']) {
    assert.equal(parseUrl(url).isValid, true, url);
  }
});

test('fetch preserves URL, header and body text without executing it', async () => {
  const url = "https://example.com/O'Reilly?q=';throw new Error('injected');//";
  const body = '  ` ${throwMe()} \\ café\n  ';
  const headers = [{ key: 'X-Note', value: "O'Reilly" }, { key: '__proto__', value: 'literal' }];
  let actual;
  const code = buildFetchCode('POST', url, headers, body);
  await new AsyncFunction('fetch', 'console', code)(async (...args) => {
    actual = args;
    return { text: async () => '', json: async () => { throw Error('empty response'); } };
  }, { log() {} });
  assert.equal(actual[0], url);
  assert.equal(actual[1].body, body);
  assert.equal(new Headers(actual[1].headers).get('__proto__'), 'literal');
});

test('JSON-looking body remains literal even when malformed or executable', async () => {
  for (const body of ['{"bad":', '(() => { throw Error("executed"); })()', '{"__proto__":{"x":1}}']) {
    let actual;
    await new AsyncFunction('fetch', 'console', buildFetchCode('POST', 'https://example.com', [{ key: 'Content-Type', value: 'application/json' }], body))(
      async (_url, options) => { actual = options.body; return { text: async () => 'ok' }; }, { log() {} },
    );
    assert.equal(actual, body);
  }
});

test('only GET and HEAD suppress request bodies', async () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']) {
    let actual;
    await new AsyncFunction('fetch', 'console', buildFetchCode(method, 'https://example.com', [], 'body'))(
      async (_url, options) => { actual = options; return { text: async () => '' }; }, { log() {} },
    );
    assert.equal(actual.method, method);
    assert.equal(actual.body, ['GET', 'HEAD'].includes(method) ? undefined : 'body');
  }
});

const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
test('curl passes exact quoted arguments and literal @ bodies to a fake command', () => {
  const url = "https://example.com/a'b?q=[1]&x=$(false)";
  const headers = [{ key: 'X-Note', value: "a'b $(false)" }];
  const body = '@file\n text';
  const script = `curl() { printf '%s\\0' "$@"; };\n${buildCurlCommand('POST', url, headers, body)}`;
  const result = spawnSync(bash, ['--noprofile', '--norc', '-c', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const args = result.stdout.split('\0').slice(0, -1);
  assert.ok(args.includes('--globoff'));
  assert.equal(args.at(-1), url);
  assert.equal(args[args.indexOf('-H') + 1], "X-Note: a'b $(false)");
  assert.equal(args[args.indexOf('--data-raw') + 1], body);
  assert.match(buildCurlCommand('HEAD', url, [], ''), /--head/);
});

const { encodeRequestState, decodeRequestState, setUrlProtocol, getUrlProtocol, readRequestState } = loadSource('request-state');
const sample = { url: 'https://example.com/你好', method: 'POST', headers: [{ key: 'X-Name', value: 'café' }], body: '🙂', outputFormat: 'fetch' };
test('share links round-trip Unicode and earlier Latin-1 links', () => {
  assert.equal(JSON.stringify(decodeRequestState(encodeRequestState(sample))), JSON.stringify(sample));
  assert.equal(JSON.stringify(decodeRequestState(btoa(JSON.stringify({ ...sample, url: 'example.com', body: 'café' })))), JSON.stringify({ ...sample, url: 'example.com', body: 'café' }));
});

test('malformed share/storage data cannot become request state', () => {
  for (const value of [null, [], 7, {}, { ...sample, url: 2 }, { ...sample, method: 'GET; exit' }, { ...sample, headers: {} }, { ...sample, headers: [null] }, { ...sample, body: {} }, { ...sample, outputFormat: 'other' }, { ...sample, outputFormat: ['fetch'] }]) {
    assert.equal(readRequestState(value), null);
    assert.equal(decodeRequestState(Buffer.from(JSON.stringify(value), 'utf8').toString('base64')), null);
  }
  assert.equal(decodeRequestState('not base64'), null);
  assert.equal(setUrlProtocol('https://example.com/path?q=1', 'http'), 'http://example.com/path?q=1');
  assert.equal(setUrlProtocol('example.com', 'https'), 'https://example.com');
  assert.equal(getUrlProtocol(setUrlProtocol('', 'http')), 'http');
});

test('disabled storage does not break reads or in-memory request updates', () => {
  const storage = loadSource('request-state', {
    localStorage: {
      getItem() { throw Error('denied'); },
      setItem() { throw Error('quota'); },
      removeItem() { throw Error('denied'); },
    },
  });
  assert.equal(storage.storageGet('fixture'), null);
  assert.doesNotThrow(() => storage.storageSet('fixture', 'value'));
  assert.doesNotThrow(() => storage.storageRemove('fixture'));
});

test('duplicate header rows survive fetch generation like curl', async () => {
  const headers = [{ key: 'Accept', value: 'application/json' }, { key: 'Accept', value: 'text/plain' }];
  let actual;
  await new AsyncFunction('fetch', 'console', buildFetchCode('GET', 'https://example.com', headers, ''))(
    async (_url, options) => { actual = new Headers(options.headers); return { text: async () => '' }; }, { log() {} },
  );
  assert.equal(actual.get('accept'), 'application/json, text/plain');
});

test('invalid headers cannot become copied or shared request code', () => {
  for (const headers of [[{ key: 'Bad:Name', value: 'x' }], [{ key: 'X-Note', value: 'a\r\nX-Injected: yes' }], [{ key: 'X-Note', value: '🙂' }]]) {
    assert.throws(() => buildCurlCommand('GET', 'https://example.com', headers, ''), /Header/);
    assert.throws(() => buildFetchCode('GET', 'https://example.com', headers, ''), /Header/);
    assert.equal(readRequestState({ ...sample, headers }), null);
  }
});
