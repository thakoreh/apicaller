'use client';

import { useState, useCallback } from 'react';
import { parseUrl, buildCurlCommand, COMMON_HEADERS } from '@/lib/url';
import { Copy, Check, Zap, Globe, Code2, Terminal } from 'lucide-react';

const METHODS = [
  { method: 'GET', label: 'GET', color: 'emerald' },
  { method: 'POST', label: 'POST', color: 'blue' },
  { method: 'PUT', label: 'PUT', color: 'amber' },
  { method: 'PATCH', label: 'PATCH', color: 'violet' },
  { method: 'DELETE', label: 'DELETE', color: 'red' },
  { method: 'HEAD', label: 'HEAD', color: 'cyan' },
  { method: 'OPTIONS', label: 'OPTIONS', color: 'slate' },
];

const COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500 text-white',
  blue: 'bg-blue-500 text-white',
  amber: 'bg-amber-500 text-white',
  violet: 'bg-violet-500 text-white',
  red: 'bg-red-500 text-white',
  cyan: 'bg-cyan-500 text-white',
  slate: 'bg-slate-500 text-white',
};

const COLOR_BORDER: Record<string, string> = {
  emerald: 'border-emerald-500 text-emerald-600',
  blue: 'border-blue-500 text-blue-600',
  amber: 'border-amber-500 text-amber-600',
  violet: 'border-violet-500 text-violet-600',
  red: 'border-red-500 text-red-600',
  cyan: 'border-cyan-500 text-cyan-600',
  slate: 'border-slate-500 text-slate-600',
};

export default function HomePage() {
  const [urlInput, setUrlInput] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('GET');
  const [headers, setHeaders] = useState(COMMON_HEADERS);
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAllMethods, setShowAllMethods] = useState(false);

  const parsed = parseUrl(urlInput);
  const fullUrl = parsed.isValid
    ? `${parsed.protocol}://${parsed.host}${parsed.pathname}${parsed.search}`
    : urlInput.startsWith('http') ? urlInput : '';

  const curlCommand = parsed.isValid
    ? buildCurlCommand(selectedMethod, fullUrl, headers, body)
    : '# Enter a valid URL above to generate a curl command';

  const addHeader = () => setHeaders((h) => [...h, { key: '', value: '' }]);
  const removeHeader = (i: number) => setHeaders((h) => h.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) =>
    setHeaders((h) => h.map((header, idx) => (idx === i ? { ...header, [field]: val } : header)));

  const copyCommand = useCallback(async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [curlCommand]);

  const fillAuth = () => {
    setHeaders((h) => {
      const hasAuth = h.some((x) => x.key === 'Authorization');
      if (hasAuth) return h;
      return [...h, { key: 'Authorization', value: 'Bearer YOUR_TOKEN' }];
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-sm tracking-wide">
              <span className="text-cyan-400">api</span>
              <span className="text-white/80">caller</span>
              <span className="text-white/40">.dev</span>
            </span>
          </div>
          <a
            href="https://github.com/thakoreh/apicaller"
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            Open on GitHub
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs mb-6">
          <Zap className="w-3 h-3" />
          Paste any API URL — get every curl command instantly
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          <span className="text-white">API calls, </span>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            no guesswork
          </span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Stop digging through docs. Paste an endpoint, pick your method, copy the curl.
        </p>
      </section>

      {/* Main tool */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        {/* URL input */}
        <div className="mb-6">
          <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-white/10 bg-white/5 focus-within:border-cyan-500/50 transition-colors">
            <div className="pl-4 pr-2 py-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-white/40 flex-shrink-0" />
              <select
                value={parsed.isValid ? parsed.protocol : 'https'}
                onChange={() => {}}
                className="bg-transparent text-white/60 text-sm outline-none cursor-pointer pr-2"
              >
                <option value="https">https://</option>
                <option value="http">http://</option>
              </select>
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="api.github.com/users/octocat"
              className="flex-1 bg-transparent text-white text-sm py-3 pr-4 outline-none placeholder:text-white/20"
            />
          </div>
          {urlInput && !parsed.isValid && (
            <p className="text-red-400 text-xs mt-2 pl-1">Enter a valid URL</p>
          )}
        </div>

        {/* Method selector */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-white/40 text-xs w-16">METHOD</span>
          {(showAllMethods ? METHODS : METHODS.slice(0, 4)).map(({ method, color }) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedMethod === method
                  ? `${COLOR_MAP[color]} border border-current`
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              {method}
            </button>
          ))}
          <button
            onClick={() => setShowAllMethods(!showAllMethods)}
            className="text-white/30 text-xs px-2 py-1 hover:text-white/60 transition-colors"
          >
            {showAllMethods ? '− less' : '+ more'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: config */}
          <div className="lg:col-span-3 space-y-5">
            {/* Headers */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Headers</h3>
                  <p className="text-white/30 text-xs mt-0.5">Common headers — edit or add more</p>
                </div>
                <button
                  onClick={fillAuth}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  + Auth
                </button>
              </div>
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={h.key}
                      onChange={(e) => updateHeader(i, 'key', e.target.value)}
                      placeholder="Header"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50 placeholder:text-white/20"
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) => updateHeader(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50 placeholder:text-white/20"
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      className="text-white/20 hover:text-red-400 transition-colors text-xs px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addHeader}
                className="mt-3 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                + Add header
              </button>
            </div>

            {/* Body */}
            {selectedMethod !== 'GET' && selectedMethod !== 'HEAD' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-white">Request Body</h3>
                  <p className="text-white/30 text-xs mt-0.5">JSON body for POST/PUT/PATCH</p>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs text-white font-mono outline-none focus:border-cyan-500/50 placeholder:text-white/20 resize-none"
                />
              </div>
            )}
          </div>

          {/* Right: output */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-cyan-500/20 bg-[#0d1117] p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedMethod === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : selectedMethod === 'POST' ? 'bg-blue-500/20 text-blue-400' : selectedMethod === 'PUT' ? 'bg-amber-500/20 text-amber-400' : selectedMethod === 'PATCH' ? 'bg-violet-500/20 text-violet-400' : selectedMethod === 'DELETE' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'}`}>
                    {selectedMethod}
                  </span>
                  <span className="text-xs text-white/40 font-mono truncate max-w-[140px]">
                    {parsed.isValid ? parsed.pathname || '/' : '...'}
                  </span>
                </div>
                <button
                  onClick={copyCommand}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="font-mono text-xs text-white/70 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                {curlCommand}
              </pre>
            </div>

            {/* Quick tips */}
            {parsed.isValid && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-xs font-semibold text-white/60 mb-2 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Endpoint info
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Host</span>
                    <span className="text-white/70 font-mono">{parsed.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Path</span>
                    <span className="text-white/70 font-mono">{parsed.pathname || '/'}</span>
                  </div>
                  {parsed.search && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Query</span>
                      <span className="text-white/70 font-mono text-right max-w-[180px] truncate">
                        {parsed.search}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/40">Protocol</span>
                    <span className="text-white/70 font-mono">{parsed.protocol.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-white/30">
          <span>
            <span className="text-cyan-400">apicaller</span>.dev — built for devs who hate docs
          </span>
          <span>
            <a href="https://github.com/thakoreh/apicaller" className="hover:text-white/60 transition-colors">
              GitHub
            </a>
            {' · '}
            <a href="https://www.producthunt.com" className="hover:text-white/60 transition-colors">
              Product Hunt
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
