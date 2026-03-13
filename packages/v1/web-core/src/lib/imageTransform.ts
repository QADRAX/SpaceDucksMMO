'use client';

export type RotateDegrees = 90 | -90 | 180;

function pickOutputType(input: File): string {
  const t = (input.type || '').toLowerCase();
  if (t === 'image/png' || t === 'image/jpeg' || t === 'image/webp') return t;
  return 'image/png';
}

function degToRad(deg: RotateDegrees): number {
  return (deg * Math.PI) / 180;
}

/**
 * Rotate an image File in-browser using canvas.
 *
 * Notes:
 * - Uses `createImageBitmap` when available.
 * - Canvas rotation uses the browser's canvas coordinate system (Y down).
 */
export async function rotateImageFile(input: File, degrees: RotateDegrees): Promise<File> {
  if (!input || !input.type.startsWith('image/')) return input;
  if (degrees !== 90 && degrees !== -90 && degrees !== 180) return input;

  const outType = pickOutputType(input);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(input);
  } catch {
    // If we can't decode, just return the original.
    return input;
  }

  const w = bitmap.width;
  const h = bitmap.height;

  const canvas = document.createElement('canvas');
  if (degrees === 90 || degrees === -90) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return input;

  ctx.save();

  // Move origin to canvas center, rotate, then draw centered.
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(degToRad(degrees));

  // After rotation, draw bitmap centered on origin.
  ctx.drawImage(bitmap, -w / 2, -h / 2);

  ctx.restore();

  const blob: Blob | null = await new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), outType, outType === 'image/jpeg' ? 0.92 : undefined);
    } catch {
      resolve(null);
    }
  });

  if (!blob) return input;

  const name = input.name || 'image';
  try {
    return new File([blob], name, { type: blob.type || outType });
  } catch {
    // Safari-ish fallback
    return input;
  }
}
