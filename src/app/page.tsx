'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { parseUrl, buildCurlCommand, buildFetchCode, COMMON_HEADERS } from '@/lib/url';
import Link from 'next/link';
import { Copy, Check, Zap, Globe, Code2, Terminal, Sun, Moon, Clock, Sparkles, Share2, Bookmark, BookmarkCheck, Trash2, FolderOpen } from 'lucide-react';

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

interface Preset {
  name: string;
  url: string;
  method: string;
  headers: { key: string; value: string }[];
  body?: string;
}

const API_PRESETS: Preset[] = [
  {
    name: 'GitHub',
    url: 'api.github.com/users/octocat',
    method: 'GET',
    headers: [
      { key: 'Accept', value: 'application/vnd.github.v3+json' },
      { key: 'Authorization', value: 'Bearer YOUR_GITHUB_TOKEN' },
    ],
  },
  {
    name: 'OpenAI',
    url: 'api.openai.com/v1/chat/completions',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer YOUR_OPENAI_KEY' },
    ],
    body: '{\n  "model": "gpt-4",\n  "messages": [{"role": "user", "content": "Hello!"}]\n}',
  },
  {
    name: 'Anthropic',
    url: 'api.anthropic.com/v1/messages',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'x-api-key', value: 'YOUR_ANTHROPIC_KEY' },
      { key: 'anthropic-version', value: '2023-06-01' },
    ],
    body: '{\n  "model": "claude-sonnet-4-20250514",\n  "max_tokens": 1024,\n  "messages": [{"role": "user", "content": "Hello!"}]\n}',
  },
  {
    name: 'Stripe',
    url: 'api.stripe.com/v1/charges',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
      { key: 'Authorization', value: 'Bearer ***' },
    ],
    body: 'amount=2000&currency=usd&source=tok_visa&description=Test charge',
  },
  {
    name: 'Notion',
    url: 'api.notion.com/v1/pages',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer YOUR_NOTION_TOKEN' },
      { key: 'Notion-Version', value: '2022-06-28' },
    ],
    body: '{\n  "parent": {"database_id": "YOUR_DB_ID"},\n  "properties": {\n    "Name": {"title": [{"text": {"content": "New page"}}]}\n  }\n}',
  },
  {
    name: 'Supabase',
    url: 'YOUR_PROJECT.supabase.co/rest/v1/users',
    method: 'GET',
    headers: [
      { key: 'apikey', value: 'YOUR_SUPABASE_ANON_KEY' },
      { key: 'Authorization', value: 'Bearer YOUR_SUPABASE_ANON_KEY' },
    ],
  },
];

const TYPEWRITER_PHRASES = [
  'Stop digging through docs.',
  'Paste an endpoint, pick your method, copy the code.',
  'From URL to production-ready request in seconds.',
  'Works with any REST API — public or private.',
];

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('apicaller-theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('apicaller-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

function useUrlHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('apicaller-url-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const addToHistory = useCallback((url: string) => {
    if (!url.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((u) => u !== url);
      const next = [url, ...filtered].slice(0, 10);
      localStorage.setItem('apicaller-url-history', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((url: string) => {
    setHistory((prev) => {
      const next = prev.filter((u) => u !== url);
      localStorage.setItem('apicaller-url-history', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('apicaller-url-history');
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}

interface CollectionItem {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: { key: string; value: string }[];
  body?: string;
  savedAt: number;
}

function useCollection() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('apicaller-collection');
      if (saved) setCollection(JSON.parse(saved));
    } catch {}
  }, []);

  const saveToCollection = useCallback((item: Omit<CollectionItem, 'id' | 'savedAt'>) => {
    const newItem: CollectionItem = {
      ...item,
      id: Date.now().toString(),
      savedAt: Date.now(),
    };
    setCollection((prev) => {
      const next = [newItem, ...prev].slice(0, 50);
      localStorage.setItem('apicaller-collection', JSON.stringify(next));
      return next;
    });
    return newItem.id;
  }, []);

  const removeFromCollection = useCallback((id: string) => {
    setCollection((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem('apicaller-collection', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCollection = useCallback(() => {
    setCollection([]);
    localStorage.removeItem('apicaller-collection');
  }, []);

  return { collection, showPanel, setShowPanel, saveToCollection, removeFromCollection, clearCollection };
}

function TypewriterText({ phrases }: { phrases: string[] }) {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const timeout = isDeleting ? 30 : 60;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setText(currentPhrase.slice(0, text.length + 1));
        if (text.length + 1 === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setText(currentPhrase.slice(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [text, isDeleting, phraseIndex, phrases]);

  return (
    <span>
      {text}
      <span className="animate-pulse text-cyan-400">|</span>
    </span>
  );
}

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { history, addToHistory, removeFromHistory, clearHistory } = useUrlHistory();
  const { collection, showPanel, setShowPanel, saveToCollection, removeFromCollection, clearCollection } = useCollection();
  const [urlInput, setUrlInput] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('GET');
  const [headers, setHeaders] = useState(COMMON_HEADERS);
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'curl' | 'fetch'>('curl');
  const [showHistory, setShowHistory] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const parsed = parseUrl(urlInput);
  const fullUrl = parsed.isValid
    ? `${parsed.protocol}://${parsed.host}${parsed.pathname}${parsed.search}`
    : urlInput.startsWith('http') ? urlInput : '';

  const curlCommand = parsed.isValid
    ? outputFormat === 'fetch'
      ? buildFetchCode(selectedMethod, fullUrl, headers, body)
      : buildCurlCommand(selectedMethod, fullUrl, headers, body)
    : '# Enter a valid URL above to generate a curl command';

  // Keyboard shortcut: Ctrl/Cmd+K to focus URL input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        urlInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const formatJsonBody = useCallback(() => {
    if (!body.trim()) return;
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
    } catch {
      // Not valid JSON, ignore
    }
  }, [body]);

  const addHeader = () => setHeaders((h) => [...h, { key: '', value: '' }]);
  const removeHeader = (i: number) => setHeaders((h) => h.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) =>
    setHeaders((h) => h.map((header, idx) => (idx === i ? { ...header, [field]: val } : header)));

  const copyCommand = useCallback(async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [curlCommand]);

  const shareLink = useCallback(async () => {
    const state = {
      url: urlInput,
      method: selectedMethod,
      headers,
      body,
      outputFormat,
    };
    const encoded = btoa(JSON.stringify(state));
    const shareableUrl = `${window.location.origin}${window.location.pathname}#${encoded}`;
    await navigator.clipboard.writeText(shareableUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [urlInput, selectedMethod, headers, body, outputFormat]);

  const saveToCol = useCallback(() => {
    if (!urlInput.trim()) return;
    const name = prompt('Name this request:');
    if (!name) return;
    saveToCollection({ name, url: urlInput, method: selectedMethod, headers, body });
  }, [urlInput, selectedMethod, headers, body, saveToCollection]);

  // Load state from URL hash on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        const encoded = window.location.hash.slice(1);
        const decoded = JSON.parse(atob(encoded));
        if (decoded.url) setUrlInput(decoded.url);
        if (decoded.method) setSelectedMethod(decoded.method);
        if (decoded.headers) setHeaders(decoded.headers);
        if (decoded.body !== undefined) setBody(decoded.body);
        if (decoded.outputFormat) setOutputFormat(decoded.outputFormat);
      } catch {
        // Invalid hash, ignore
      }
    }
  }, []);

  const fillAuth = () => {
    setHeaders((h) => {
      const hasAuth = h.some((x) => x.key === 'Authorization');
      if (hasAuth) return h;
      return [...h, { key: 'Authorization', value: 'Bearer YOUR_TOKEN' }];
    });
  };

  const applyPreset = (preset: Preset) => {
    setUrlInput(preset.url);
    setSelectedMethod(preset.method);
    setHeaders(preset.headers);
    if (preset.body) setBody(preset.body);
    setShowPresets(false);
  };

  const handleSubmit = () => {
    if (parsed.isValid && urlInput.trim()) {
      addToHistory(urlInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--surface-border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-sm tracking-wide">
              <span className="text-cyan-400">api</span>
              <span className="text-[var(--text-secondary)]">caller</span>
              <span className="text-[var(--text-muted)]">.dev</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] hover:bg-white/10 transition-all"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
            <Link
              href="/compare"
              className="text-xs text-[var(--text-muted)] hover:text-cyan-400 transition-colors"
            >
              Compare APIs
            </Link>
            <a
              href="https://github.com/thakoreh/apicaller"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-cyan-400 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Collection
              {collection.length > 0 && (
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                  {collection.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero with animated orbs */}
      <section className="px-6 pt-16 pb-12 text-center relative overflow-hidden">
        {/* Floating gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-[float1_8s_ease-in-out_infinite]" />
          <div className="absolute top-20 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-[float2_10s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 left-1/2 w-56 h-56 bg-violet-500/8 rounded-full blur-3xl animate-[float3_12s_ease-in-out_infinite]" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs mb-6">
            <Zap className="w-3 h-3" />
            Paste any API URL — get every curl command instantly
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            <span className="text-[var(--text-primary)]">API calls, </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              no guesswork
            </span>
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
            <TypewriterText phrases={TYPEWRITER_PHRASES} />
          </p>
        </div>
      </section>

      {/* Main tool */}
      <main className="max-w-5xl mx-auto px-6 pb-20 relative z-10">
        {/* API Presets */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--text-muted)] text-xs">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Quick presets:
            </span>
            {API_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1 rounded-lg text-xs font-medium border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-cyan-500/30 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* URL input with history */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-[var(--surface-border)] bg-[var(--surface)] focus-within:border-cyan-500/50 transition-colors">
            <div className="pl-4 pr-2 py-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              <select
                value={parsed.isValid ? parsed.protocol : 'https'}
                onChange={() => {}}
                className="bg-transparent text-[var(--text-muted)] text-sm outline-none cursor-pointer pr-2"
              >
                <option value="https">https://</option>
                <option value="http">http://</option>
              </select>
            </div>
            <input
              ref={urlInputRef}
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={() => { if (history.length > 0 && !urlInput) setShowHistory(true); }}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="api.github.com/users/octocat  ⌘K to focus"
              className="flex-1 bg-transparent text-[var(--text-primary)] text-sm py-3 pr-4 outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
          {urlInput && !parsed.isValid && (
            <p className="text-red-400 text-xs mt-2 pl-1">Enter a valid URL</p>
          )}

          {/* URL History dropdown */}
          {showHistory && history.length > 0 && (
            <div className="url-history-dropdown border border-[var(--surface-border)] bg-[var(--background)] rounded-b-xl shadow-lg mt-0 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--surface-border)]">
                <span className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recent URLs
                </span>
                <button
                  onClick={clearHistory}
                  className="text-[var(--text-muted)] text-xs hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              </div>
              {history.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2 hover:bg-[var(--surface)] cursor-pointer group"
                  onMouseDown={() => { setUrlInput(url); setShowHistory(false); }}
                >
                  <span className="text-xs font-mono text-[var(--text-secondary)] truncate flex-1">{url}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromHistory(url); }}
                    className="text-[var(--text-muted)] hover:text-red-400 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => { e.stopPropagation(); removeFromHistory(url); }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Method selector */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-[var(--text-muted)] text-xs w-16">METHOD</span>
          {(showAllMethods ? METHODS : METHODS.slice(0, 4)).map(({ method, color }) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedMethod === method
                  ? `${COLOR_MAP[color]} border border-current`
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              {method}
            </button>
          ))}
          <button
            onClick={() => setShowAllMethods(!showAllMethods)}
            className="text-[var(--text-muted)] text-xs px-2 py-1 hover:text-[var(--text-secondary)] transition-colors"
          >
            {showAllMethods ? '− less' : '+ more'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: config */}
          <div className="lg:col-span-3 space-y-5">
            {/* Headers */}
            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Headers</h3>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">Common headers — edit or add more</p>
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
                      className="flex-1 bg-white/5 border border-[var(--surface-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-cyan-500/50 placeholder:text-[var(--text-muted)]"
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) => updateHeader(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 bg-white/5 border border-[var(--surface-border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-cyan-500/50 placeholder:text-[var(--text-muted)]"
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors text-xs px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addHeader}
                className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                + Add header
              </button>
            </div>

            {/* Body */}
            {selectedMethod !== 'GET' && selectedMethod !== 'HEAD' && (
              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Request Body</h3>
                    <p className="text-[var(--text-muted)] text-xs mt-0.5">JSON body for POST/PUT/PATCH</p>
                  </div>
                  <button
                    onClick={formatJsonBody}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded border border-cyan-500/20 hover:border-cyan-500/40"
                    title="Format JSON"
                  >
                    { } Format
                  </button>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  rows={5}
                  className="w-full bg-white/5 border border-[var(--surface-border)] rounded-lg px-4 py-3 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-cyan-500/50 placeholder:text-[var(--text-muted)] resize-none"
                />
              </div>
            )}
          </div>

          {/* Right: output */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-cyan-500/20 bg-[var(--code-bg)] p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedMethod === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : selectedMethod === 'POST' ? 'bg-blue-500/20 text-blue-400' : selectedMethod === 'PUT' ? 'bg-amber-500/20 text-amber-400' : selectedMethod === 'PATCH' ? 'bg-violet-500/20 text-violet-400' : selectedMethod === 'DELETE' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-[var(--text-muted)]'}`}>
                    {selectedMethod}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[140px]">
                    {parsed.isValid ? parsed.pathname || '/' : '...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Output format toggle */}
                  <div className="flex items-center rounded-lg border border-[var(--surface-border)] overflow-hidden">
                    <button
                      onClick={() => setOutputFormat('curl')}
                      className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                        outputFormat === 'curl'
                          ? 'bg-cyan-500/20 text-cyan-400 border-r border-[var(--surface-border)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      curl
                    </button>
                    <button
                      onClick={() => setOutputFormat('fetch')}
                      className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                        outputFormat === 'fetch'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      fetch()
                    </button>
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
                  <button
                    onClick={shareLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      shared
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30'
                    }`}
                  >
                    {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    {shared ? 'Link Copied!' : 'Share'}
                  </button>
                  <button
                    onClick={saveToCol}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
              <pre className="font-mono text-xs text-[var(--text-secondary)] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                {curlCommand}
              </pre>
            </div>

            {/* Quick tips */}
            {parsed.isValid && (
              <div className="mt-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4">
                <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Endpoint info
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Host</span>
                    <span className="text-[var(--text-secondary)] font-mono">{parsed.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Path</span>
                    <span className="text-[var(--text-secondary)] font-mono">{parsed.pathname || '/'}</span>
                  </div>
                  {parsed.search && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Query</span>
                      <span className="text-[var(--text-secondary)] font-mono text-right max-w-[180px] truncate">
                        {parsed.search}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Protocol</span>
                    <span className="text-[var(--text-secondary)] font-mono">{parsed.protocol.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Collection Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => setShowPanel(false)}>
          <div
            className="w-full max-w-md h-full bg-[var(--background)] border-l border-[var(--surface-border)] shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--surface-border)] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">My Collection</h2>
                <span className="text-[var(--text-muted)] text-xs">({collection.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {collection.length > 0 && (
                  <button
                    onClick={clearCollection}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              {collection.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
                  <p className="text-[var(--text-muted)] text-sm">No saved requests yet.</p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">Click "Save" next to any request to add it here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collection.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4 hover:border-cyan-500/20 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            item.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                            item.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                            item.method === 'PUT' ? 'bg-amber-500/20 text-amber-400' :
                            item.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                            'bg-white/10 text-[var(--text-muted)]'
                          }`}>
                            {item.method}
                          </span>
                          <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[180px]">{item.name}</span>
                        </div>
                        <button
                          onClick={() => removeFromCollection(item.id)}
                          className="text-[var(--text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-[var(--text-muted)] truncate mb-2">{item.url}</p>
                      <button
                        onClick={() => {
                          setUrlInput(item.url);
                          setSelectedMethod(item.method);
                          setHeaders(item.headers.length > 0 ? item.headers : COMMON_HEADERS);
                          if (item.body) setBody(item.body);
                          setShowPanel(false);
                        }}
                        className="w-full text-xs text-center py-1.5 rounded border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      >
                        Load request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--surface-border)] mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            <span className="text-cyan-400">apicaller</span>.dev — built for devs who hate docs
          </span>
          <span>
            <a href="https://github.com/thakoreh/apicaller" className="hover:text-[var(--text-secondary)] transition-colors">
              GitHub
            </a>
            {' · '}
            <a href="https://www.producthunt.com" className="hover:text-[var(--text-secondary)] transition-colors">
              Product Hunt
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
