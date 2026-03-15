/**
 * Web Worker for resource fetching and decoding.
 * Runs fetch off main thread; optionally createImageBitmap for textures.
 */
export type ResourceWorkerRequest =
  | { id: number; type: 'fetch'; url: string; format: 'text' }
  | { id: number; type: 'fetch'; url: string; format: 'blob' }
  | { id: number; type: 'fetch'; url: string; format: 'blob'; decode: 'imageBitmap' };

export type ResourceWorkerResponse =
  | { id: number; ok: true; data: string }
  | { id: number; ok: true; data: Blob }
  | { id: number; ok: true; data: ImageBitmap; transfer: true }
  | { id: number; ok: false; error: string };

self.onmessage = async (ev: MessageEvent<ResourceWorkerRequest>) => {
  const req = ev.data;
  try {
    if (req.type === 'fetch') {
      const res = await fetch(req.url);
      if (!res.ok) {
        (self as any).postMessage({ id: req.id, ok: false, error: `HTTP ${res.status}` });
        return;
      }
      if (req.format === 'text') {
        const text = await res.text();
        (self as any).postMessage({ id: req.id, ok: true, data: text });
        return;
      }
      if (req.format === 'blob') {
        if ('decode' in req && req.decode === 'imageBitmap') {
          const blob = await res.blob();
          const bitmap = await createImageBitmap(blob);
          (self as any).postMessage({ id: req.id, ok: true, data: bitmap, transfer: true }, [bitmap]);
          return;
        }
        const blob = await res.blob();
        (self as any).postMessage({ id: req.id, ok: true, data: blob });
        return;
      }
    }
    (self as any).postMessage({ id: req.id, ok: false, error: 'Unknown request' });
  } catch (e) {
    (self as any).postMessage({
      id: req.id,
      ok: false,
      error: (e as Error).message ?? String(e),
    });
  }
};
