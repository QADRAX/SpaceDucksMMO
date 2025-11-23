// Lightweight thumbnail generator with in-memory cache.
// Uses OffscreenCanvas + createImageBitmap when available to resize images
// without blocking the main thread where possible.

const thumbCache = new Map<string, string>();

export async function getThumbnail(url: string, width = 64, height = 48): Promise<string> {
  const key = `${url}::${width}x${height}`;
  const cached = thumbCache.get(key);
  if (cached) return cached;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('fetch-failed');
    const blob = await resp.blob();

    // Prefer OffscreenCanvas path if available
    if (typeof OffscreenCanvas !== 'undefined' && (OffscreenCanvas as any).prototype && (OffscreenCanvas as any).prototype.getContext) {
      const bitmap = await createImageBitmap(blob, { resizeWidth: width, resizeHeight: height, resizeQuality: 'medium' } as any);
      const off = new OffscreenCanvas(width, height);
      const ctx = off.getContext('2d');
      if (ctx) ctx.drawImage(bitmap, 0, 0, width, height);
      // convertToBlob is available on OffscreenCanvas in modern browsers
      const thumbBlob = (off as any).convertToBlob ? await (off as any).convertToBlob({ type: 'image/webp', quality: 0.7 }) : blob;
      const obj = URL.createObjectURL(thumbBlob);
      thumbCache.set(key, obj);
      return obj;
    }

    // Fallback: createImageBitmap + canvas
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no-canvas-context');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const thumbBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b as Blob), 'image/webp', 0.7));
    const obj = URL.createObjectURL(thumbBlob);
    thumbCache.set(key, obj);
    return obj;
  } catch (e) {
    // On failure, just return original url as fallback
    return url;
  }
}

export function revokeThumbnail(url: string) {
  // revoke object URLs in cache (optional cleanup)
  for (const [k, v] of thumbCache) {
    if (v === url) {
      try { URL.revokeObjectURL(v); } catch {}
      thumbCache.delete(k);
    }
  }
}
