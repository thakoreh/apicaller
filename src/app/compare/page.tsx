'use client';

import { useState, useCallback } from 'react';
import { parseUrl, buildCurlCommand, COMMON_HEADERS } from '@/lib/url';
import { Copy, Check, ArrowLeft, Terminal, Globe, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const COLOR_MAP: Record<string, string> = {
  GET: 'bg-emerald-500 text-white',
  POST: 'bg-blue-500 text-white',
  PUT: 'bg-amber-500 text-white',
  DELETE: 'bg-red-500 text-white',
};

const COLOR_TEXT: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  DELETE: 'text-red-400',
};

interface PanelState {
  urlInput: string;
  selectedMethod: string;
  headers: { key: string; value: string }[];
}

function ApiPanel({
  label,
  state,
  onChange,
  onCopy,
  copied,
}: {
  label: string;
  state: PanelState;
  onChange: (update: Partial<PanelState>) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const parsed = parseUrl(state.urlInput);
  const fullUrl = parsed.isValid
    ? `${parsed.protocol}://${parsed.host}${parsed.pathname}${parsed.search}`
    : '';

  const curlCommand = parsed.isValid
    ? buildCurlCommand(state.selectedMethod, fullUrl, state.headers, '')
    : '# Enter a valid URL to generate a curl command';

  const addHeader = () => onChange({ headers: [...state.headers, { key: '', value: '' }] });
  const removeHeader = (i: number) =>
    onChange({ headers: state.headers.filter((_, idx) => idx !== i) });
  const updateHeader = (i: number, field: 'key' | 'value', val: string) =>
    onChange({ headers: state.headers.map((h, idx) => (idx === i ? { ...h, [field]: val } : h)) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        {parsed.isValid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        {!parsed.isValid && state.urlInput && <XCircle className="w-4 h-4 text-red-400" />}
      </div>

      {/* URL Input */}
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
          type="text"
          value={state.urlInput}
          onChange={(e) => onChange({ urlInput: e.target.value })}
          placeholder="api.example.com/users"
          className="flex-1 bg-transparent text-[var(--text-primary)] text-sm py-3 pr-4 outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Method Selector */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--text-muted)] text-xs w-16">METHOD</span>
        {METHODS.map((method) => (
          <button
            key={method}
            onClick={() => onChange({ selectedMethod: method })}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              state.selectedMethod === method
                ? `${COLOR_MAP[method]} border border-current`
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] border border-transparent'
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      {/* Headers */}
      <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[var(--text-primary)]">Headers</h3>
          <button
            onClick={addHeader}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {state.headers.map((h, i) => (
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
      </div>

      {/* Generated Curl */}
      <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--code-bg)] p-4 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-[var(--text-secondary)]">curl command</span>
          </div>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="text-xs text-[var(--text-secondary)] font-mono overflow-x-auto whitespace-pre-wrap break-all">
          {curlCommand}
        </pre>
      </div>
    </div>
  );
}

function DiffRow({
  label,
  value1,
  value2,
}: {
  label: string;
  value1: string | undefined;
  value2: string | undefined;
}) {
  const isDifferent = value1 !== value2;
  const isEmpty = !value1 && !value2;

  if (isEmpty) return null;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--surface-border)] last:border-b-0">
      <span className="text-xs text-[var(--text-muted)] w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-2">
        <span className={`text-xs font-mono ${isDifferent ? 'text-red-400' : 'text-emerald-400'}`}>
          {value1 || '(empty)'}
        </span>
        {isDifferent && (
          <>
            <span className="text-[var(--text-muted)]">→</span>
            <span className="text-xs font-mono text-blue-400">{value2 || '(empty)'}</span>
          </>
        )}
      </div>
      {isDifferent && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
    </div>
  );
}

export default function ComparePage() {
  const [panel1, setPanel1] = useState<PanelState>({
    urlInput: '',
    selectedMethod: 'GET',
    headers: [...COMMON_HEADERS],
  });
  const [panel2, setPanel2] = useState<PanelState>({
    urlInput: '',
    selectedMethod: 'GET',
    headers: [...COMMON_HEADERS],
  });
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);

  const parsed1 = parseUrl(panel1.urlInput);
  const parsed2 = parseUrl(panel2.urlInput);

  const fullUrl1 = parsed1.isValid
    ? `${parsed1.protocol}://${parsed1.host}${parsed1.pathname}${parsed1.search}`
    : '';
  const fullUrl2 = parsed2.isValid
    ? `${parsed2.protocol}://${parsed2.host}${parsed2.pathname}${parsed2.search}`
    : '';

  const curl1 = parsed1.isValid
    ? buildCurlCommand(panel1.selectedMethod, fullUrl1, panel1.headers, '')
    : '';
  const curl2 = parsed2.isValid
    ? buildCurlCommand(panel2.selectedMethod, fullUrl2, panel2.headers, '')
    : '';

  const copy1 = useCallback(async () => {
    await navigator.clipboard.writeText(curl1);
    setCopied1(true);
    setTimeout(() => setCopied1(false), 2000);
  }, [curl1]);

  const copy2 = useCallback(async () => {
    await navigator.clipboard.writeText(curl2);
    setCopied2(true);
    setTimeout(() => setCopied2(false), 2000);
  }, [curl2]);

  const hasDiff =
    parsed1.host !== parsed2.host ||
    parsed1.pathname !== parsed2.pathname ||
    parsed1.search !== parsed2.search ||
    panel1.selectedMethod !== panel2.selectedMethod;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--surface-border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <a
            href="/"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </a>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-sm tracking-wide">
              <span className="text-cyan-400">api</span>
              <span className="text-[var(--text-secondary)]">caller</span>
              <span className="text-[var(--text-muted)]">.dev</span>
            </span>
          </div>
          <span className="text-[var(--text-muted)] text-sm">/ Compare</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Compare API Calls
            </span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Paste two API URLs side-by-side to compare endpoints, methods, and generated commands.
          </p>
        </div>

        {/* Side-by-side panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-5">
            <ApiPanel
              label="API #1"
              state={panel1}
              onChange={(update) => setPanel1((prev) => ({ ...prev, ...update }))}
              onCopy={copy1}
              copied={copied1}
            />
          </div>
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-5">
            <ApiPanel
              label="API #2"
              state={panel2}
              onChange={(update) => setPanel2((prev) => ({ ...prev, ...update }))}
              onCopy={copy2}
              copied={copied2}
            />
          </div>
        </div>

        {/* Diff section */}
        {parsed1.isValid && parsed2.isValid && (
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Comparison Results</h2>
            </div>

            {hasDiff ? (
              <div className="space-y-1">
                <DiffRow label="Host" value1={parsed1.host} value2={parsed2.host} />
                <DiffRow label="Path" value1={parsed1.pathname} value2={parsed2.pathname} />
                <DiffRow label="Query" value1={parsed1.search} value2={parsed2.search} />
                <DiffRow label="Method" value1={panel1.selectedMethod} value2={panel2.selectedMethod} />
                <DiffRow
                  label="Protocol"
                  value1={parsed1.protocol}
                  value2={parsed2.protocol}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Both API calls are identical</span>
              </div>
            )}
          </div>
        )}

        {/* Show message when URLs are not both valid */}
        {(!parsed1.isValid || !parsed2.isValid) && (
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 text-center">
            <p className="text-[var(--text-muted)] text-sm">
              Enter valid URLs in both panels to see a comparison
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
