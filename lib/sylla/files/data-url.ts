export interface ParsedDataUrl {
  mediaType: string;
  buffer: Buffer;
}

const DATA_URL_PATTERN = /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,([\s\S]*)$/;

/** Parses a `data:<mediaType>;base64,<payload>` URL. Returns null if malformed. */
export function parseDataUrl(url: string): ParsedDataUrl | null {
  const match = DATA_URL_PATTERN.exec(url);
  if (!match) return null;
  const [, mediaType, base64] = match;
  try {
    return { mediaType, buffer: Buffer.from(base64, 'base64') };
  } catch {
    return null;
  }
}
