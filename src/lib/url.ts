import { ParsedUrl } from '@/types';
import { getHeadersError } from './headers';

export function parseUrl(input: string): ParsedUrl {
  try {
    let urlString = input.trim();
    if (!urlString || /\s/.test(urlString)) throw new Error('Invalid URL');
    if (!/^https?:\/\//i.test(urlString)) {
      // Allow host:port, but never reinterpret another URL scheme as a host.
      if (/^[a-z][a-z\d+.-]*:/i.test(urlString) && !/^[^/?#]+:\d+(?:[/?#]|$)/.test(urlString)) {
        throw new Error('Use HTTP or HTTPS');
      }
      urlString = 'https://' + urlString;
    }
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
      throw new Error('Use an HTTP URL without embedded credentials');
    }
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.host,
      pathname: url.pathname,
      search: url.search,
      isValid: true,
    };
  } catch {
    return {
      protocol: '',
      host: '',
      pathname: '',
      search: '',
      isValid: false,
    };
  }
}

export function buildFetchCode(
  method: string,
  url: string,
  headers: { key: string; value: string }[],
  body: string,
): string {
  const error = getHeadersError(headers);
  if (error) throw new Error(error);
  const hasBody = body.length > 0 && !['GET', 'HEAD'].includes(method.toUpperCase());
  const headerRows = headers.filter((h) => h.key.trim());

  const parts: string[] = [];

  parts.push(`const response = await fetch(${JSON.stringify(url)}, {\n  method: ${JSON.stringify(method)},`);

  if (headerRows.length > 0) {
    const hdrLines = headerRows
      .map((h) => `    ${JSON.stringify([h.key.trim(), h.value.trim()])}`)
      .join(',\n');
    parts.push(`  headers: [\n${hdrLines},\n  ],`);
  }

  if (hasBody) {
    parts.push(`  body: ${JSON.stringify(body)},`);
  }

  parts.push(`});\n\n// Read text so empty and non-JSON responses also work.\nconst data = await response.text();\nconsole.log(data);`);
  return parts.join('\n');
}

export function buildCurlCommand(
  method: string,
  url: string,
  headers: { key: string; value: string }[],
  body: string,
): string {
  const error = getHeadersError(headers);
  if (error) throw new Error(error);
  const quote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;
  const parts = [`curl --globoff ${method.toUpperCase() === 'HEAD' ? '--head' : `-X ${quote(method)}`}`];

  for (const h of headers) {
    if (h.key.trim()) {
      parts.push(`  -H ${quote(`${h.key.trim()}: ${h.value.trim()}`)}`);
    }
  }

  if (body.length > 0 && !['GET', 'HEAD'].includes(method.toUpperCase())) {
    parts.push(`  --data-raw ${quote(body)}`);
  }

  parts.push(`  --url ${quote(url)}`);

  return parts.join(' \\\n');
}

export const COMMON_HEADERS = [
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Authorization', value: 'Bearer YOUR_TOKEN' },
  { key: 'Accept', value: 'application/json' },
  { key: 'User-Agent', value: 'apicaller.dev/1.0' },
];
