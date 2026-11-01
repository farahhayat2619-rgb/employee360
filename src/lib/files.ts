// Checks uploaded files by their first bytes, not by the name or the type the browser claims.
export type ImageKind = "image/jpeg" | "image/png" | "image/webp";

export function sniffImage(b: Uint8Array): ImageKind | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export const isPdf = (b: Uint8Array) => b.length > 5 && String.fromCharCode(...b.slice(0, 5)) === "%PDF-";

export const MAX_PHOTO_BYTES = 500 * 1024;
export const MAX_POLICY_BYTES = 5 * 1024 * 1024;
