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

export function buildFetchCode(
  method: string,
  url: string,
  headers: { key: string; value: string }[],
  body: string,
): string {
  const hasBody = body.trim() && !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const headersObj = headers
    .filter((h) => h.key.trim())
    .reduce<Record<string, string>>((acc, h) => {
      acc[h.key.trim()] = h.value.trim();
      return acc;
    }, {});

  const parts: string[] = [];

  if (hasBody) {
    parts.push(`const response = await fetch('${url}', {\n  method: '${method}',`);
  } else {
    parts.push(`const response = await fetch('${url}', {\n  method: '${method}',`);
  }

  if (Object.keys(headersObj).length > 0) {
    const hdrLines = Object.entries(headersObj)
      .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
      .join(',\n');
    parts.push(`  headers: {\n${hdrLines},\n  },`);
  }

  if (hasBody) {
    const escaped = body.trim();
    if (headersObj['Content-Type']?.includes('json')) {
      parts.push(`  body: JSON.stringify(${escaped}),`);
    } else {
      parts.push(`  body: \`${escaped}\`,`);
    }
  }

  parts.push(`});\n\nconst data = await response.json();\nconsole.log(data);`);
  return parts.join('\n');
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
