export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export interface RequestState {
  url: string;
  method: string;
  headers: { key: string; value: string }[];
  body?: string;
  outputFormat?: 'curl' | 'fetch';
}

// Fragments and localStorage are user input, including old or manually edited data.
export function readRequestState(value: unknown): RequestState | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.url !== 'string' || typeof item.method !== 'string' || !HTTP_METHODS.includes(item.method)) return null;
  if (!Array.isArray(item.headers) || !item.headers.every((h) => h && typeof h.key === 'string' && typeof h.value === 'string')) return null;
  if (getHeadersError(item.headers)) return null;
  if (item.body !== undefined && typeof item.body !== 'string') return null;
  if (item.outputFormat !== undefined && item.outputFormat !== 'curl' && item.outputFormat !== 'fetch') return null;
  return item as unknown as RequestState;
}

export function encodeRequestState(state: RequestState): string {
  return btoa(Array.from(new TextEncoder().encode(JSON.stringify(state)), (byte) => String.fromCharCode(byte)).join(''));
}

export function decodeRequestState(encoded: string): RequestState | null {
  try {
    const binary = atob(encoded);
    let json;
    try {
      json = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
    } catch {
      json = binary; // Compatibility with earlier Latin-1 share links.
    }
    return readRequestState(JSON.parse(json));
  } catch {
    return null;
  }
}

export function setUrlProtocol(input: string, protocol: string): string {
  return `${protocol}://${input.trim().replace(/^[a-z][a-z\d+.-]*:\/\//i, '')}`;
}

export function getUrlProtocol(input: string): 'http' | 'https' {
  return /^http:\/\//i.test(input.trim()) ? 'http' : 'https';
}

export function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function storageSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* Keep in-memory state usable. */ }
}

export function storageRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* Storage can be unavailable in private contexts. */ }
}
import { getHeadersError } from './headers';

