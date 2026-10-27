export function getHeadersError(headers: { key: string; value: string }[]): string | null {
  for (const [index, header] of headers.entries()) {
    if (!header.key.trim()) continue;
    if (!/^[!#$%&'*+.^_`|~\dA-Za-z-]+$/.test(header.key.trim())) {
      return `Header ${index + 1} needs a valid HTTP header name.`;
    }
    // Match the browser Headers contract: no CR/LF, controls, or non-byte values.
    if (/[^\t\x20-\x7e\x80-\xff]/.test(header.value)) {
      return `Header ${index + 1} value contains unsupported control or Unicode characters.`;
    }
  }
  return null;
}
