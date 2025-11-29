import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

import type {
  TextureCatalog,
  TextureVariant,
  TextureQuality,
} from '@client/application/TextureCatalog';

/**
 * Map folder names to TextureQuality.
 * Supports both semantic names (low/high) and numeric resolutions (2k/4k/8k/16k...).
 */
function folderToQuality(folder: string): TextureQuality | undefined {
  const normalized = folder.toLowerCase();

  const direct: Record<string, TextureQuality> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    ultra: 'ultra',
  };

  if (direct[normalized]) {
    return direct[normalized];
  }

  const m = normalized.match(/^(\d+)k$/);
  if (!m) return undefined;

  const val = parseInt(m[1], 10);
  if (Number.isNaN(val)) return undefined;

  // Tune thresholds as needed
  if (val <= 2) return 'low';
  if (val <= 4) return 'medium';
  if (val <= 8) return 'high';
  return 'ultra';
}

function isImageFile(name: string): boolean {
  return /\.(jpe?g|png|webp|bmp|gif)$/i.test(name);
}

function scanDirectoryRecursive(root: string): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && isImageFile(entry.name)) {
        results.push(full);
      }
    }
  }

  if (fs.existsSync(root)) {
    walk(root);
  }

  return results;
}

/**
 * Parse a public-relative texture path into a TextureVariant.
 *
 * Supported patterns:
 * 1) assets/textures/<collection>/<entity>/<quality>/<variant>.<ext>
 * 2) assets/textures/<collection>/<quality>/<variant>.<ext>          (legacy)
 * 3) assets/textures/<collection>/<entity>/<variant>.<ext>           (no quality)
 * 4) assets/textures/<collection>/<variant>.<ext>                    (no quality, legacy)
 */
function parseTexturePath(rel: string): TextureVariant | undefined {
  const parts = rel.replace(/\\/g, '/').split('/');

  // Expect "assets/textures/..."
  if (parts.length < 4) return undefined;
  if (parts[0] !== 'assets' || parts[1] !== 'textures') return undefined;

  // Strip "assets/textures"
  const rest = parts.slice(2); // e.g. ['planets', 'jupiter', '8k', 'albedo.jpg']
  if (rest.length < 2) return undefined;

  const filename = rest[rest.length - 1];
  const withoutExt = filename.replace(/\.[^.]+$/, '');

  const maybeQualityFolder = rest[rest.length - 2];
  const q = folderToQuality(maybeQualityFolder);

  let quality: TextureQuality | undefined;
  let collection: string;
  let entity: string;
  let variant: string;

  if (q) {
    // We have an explicit quality folder
    quality = q;

    if (rest.length >= 3) {
      // assets/textures/<collection>/<entity>/<quality>/<variant>
      collection = rest[0];
      entity = rest[rest.length - 3];
      variant = withoutExt;
    } else {
      // Legacy: assets/textures/<collection>/<quality>/<filename>
      // Treat collection as both collection and entity for id stability.
      collection = rest[0];
      entity = collection;
      variant = withoutExt;
    }
  } else {
    // No explicit quality folder
    quality = undefined;

    if (rest.length >= 3) {
      // assets/textures/<collection>/<entity>/<variant>
      collection = rest[0];
      entity = rest[rest.length - 2];
      variant = withoutExt;
    } else {
      // assets/textures/<collection>/<filename>
      collection = rest[0];
      entity = collection;
      variant = withoutExt;
    }
  }

  const id = [collection, entity, variant].filter(Boolean).join('/');
  const tags = [collection, entity];

  const variantObj: TextureVariant = {
    id,
    quality,
    path: rel,
    label: id,
    tags,
  };

  return variantObj;
}

function buildCatalogFromDisk(texturesRootAbs: string, publicRootAbs: string): TextureCatalog {
  const files = scanDirectoryRecursive(texturesRootAbs);
  const variants: TextureVariant[] = [];

  for (const abs of files) {
    // Compute public-relative path. publicRootAbs is the absolute path to 'public'
    let rel = path.relative(publicRootAbs, abs).replace(/\\/g, '/');

    // Ensure it starts with "assets/"
    if (!rel.startsWith('assets/')) {
      rel = `assets/${rel}`;
    }

    const variant = parseTexturePath(rel);
    if (variant) {
      variants.push(variant);
    }
  }

  return { variants };
}

export function registerTextureCatalogIpc(): void {
  ipcMain.handle('spaceducks:textures:list', () => {
    const appPath = app.getAppPath();

    // Dev path: <appPath>/public/assets/textures
    const devPublic = path.join(appPath, 'public');
    const devTextures = path.join(devPublic, 'assets', 'textures');

    // Packaged path
    const resourcesBase = process.resourcesPath || appPath;
    const resourcesPublic = path.join(resourcesBase, 'public');
    const packagedTextures = path.join(resourcesPublic, 'assets', 'textures');

    let texturesRoot = devTextures;
    let publicRoot = devPublic;

    if (!fs.existsSync(texturesRoot)) {
      texturesRoot = packagedTextures;
      publicRoot = resourcesPublic;
    }

    const catalog = buildCatalogFromDisk(texturesRoot, publicRoot);
    return catalog;
  });
}

export default { registerTextureCatalogIpc };
