import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ThumbnailOptions {
  size?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
}

/**
 * Generate a thumbnail from an image file
 * @param inputPath Absolute path to the source image
 * @param outputPath Absolute path where thumbnail will be saved
 * @param options Thumbnail generation options
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  options: ThumbnailOptions = {}
): Promise<void> {
  const {
    size = 200,
    fit = 'cover',
    quality = 85
  } = options;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Generate thumbnail
  await sharp(inputPath)
    .resize(size, size, {
      fit,
      position: 'center',
      withoutEnlargement: true
    })
    .jpeg({ quality })
    .toFile(outputPath);
}

/**
 * Generate thumbnail for an asset, typically from albedo/basecolor texture
 * @param assetKey The asset key
 * @param sourceImagePath Absolute path to source image (typically albedo)
 * @param uploadsDir Base uploads directory
 * @returns Relative path to thumbnail (for storing in database)
 */
export async function generateAssetThumbnail(
  assetKey: string,
  sourceImagePath: string,
  uploadsDir: string
): Promise<string> {
  const thumbnailFileName = 'thumbnail.jpg';
  const thumbnailRelativePath = path.join(assetKey, 'thumbnails', thumbnailFileName);
  const thumbnailAbsolutePath = path.join(uploadsDir, thumbnailRelativePath);

  await generateThumbnail(sourceImagePath, thumbnailAbsolutePath, {
    size: 200,
    fit: 'cover',
    quality: 85
  });

  return thumbnailRelativePath;
}
