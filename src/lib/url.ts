import { ParsedUrl } from '@/types';

export function parseUrl(input: string): ParsedUrl {
  try {
    // Add protocol if missing
    let urlString = input.trim();
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }
    const url = new URL(urlString);
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

export function buildCurlCommand(
  method: string,
  url: string,
  headers: { key: string; value: string }[],
  body: string,
): string {
  const parts = [`curl -X ${method}`];

  for (const h of headers) {
    if (h.key.trim()) {
      parts.push(`  -H '${h.key.trim()}: ${h.value.trim()}'`);
    }
  }

  if (body.trim() && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const escaped = body.trim().replace(/'/g, "'\\''");
    parts.push(`  -d '${escaped}'`);
  }

  parts.push(`  '${url}'`);

  return parts.join(' \\\n');
}

export const COMMON_HEADERS = [
  { key: 'Content-Type', value: 'application/json' },
  { key: 'Authorization', value: 'Bearer YOUR_TOKEN' },
  { key: 'Accept', value: 'application/json' },
  { key: 'User-Agent', value: 'apicaller.dev/1.0' },
];
