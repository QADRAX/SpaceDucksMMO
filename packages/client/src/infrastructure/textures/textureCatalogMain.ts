import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export type TextureQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface TextureVariant {
  id: string;
  quality: TextureQuality;
  path: string; // relative public URL like 'assets/textures/planets/8k/jupiter.jpg'
  label: string;
}

export interface TextureCatalog {
  variants: TextureVariant[];
}

function folderToQuality(folder: string): TextureQuality {
  const mapping: Record<string, TextureQuality> = {
    '2k': 'low',
    '4k': 'medium',
    '8k': 'high',
  };
  if (mapping[folder]) return mapping[folder];
  const m = folder.match(/^(\d+)k$/);
  if (m) {
    const val = parseInt(m[1], 10);
    if (val > 8) return 'ultra';
    if (val >= 4) return 'medium';
    return 'low';
  }
  return 'low';
}

function isImageFile(name: string) {
  return /\.(jpe?g|png|webp|bmp|gif)$/i.test(name);
}

function scanDirectoryRecursive(root: string): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && isImageFile(e.name)) {
        results.push(full);
      }
    }
  }
  if (fs.existsSync(root)) {
    walk(root);
  }
  return results;
}

function buildCatalogFromDisk(texturesRootAbs: string, publicRootAbs: string): TextureCatalog {
  const files = scanDirectoryRecursive(texturesRootAbs);
  const variants: TextureVariant[] = [];

  for (const abs of files) {
    // Compute public-relative path. publicRootAbs is the absolute path to 'public'
    let rel = path.relative(publicRootAbs, abs).replace(/\\/g, '/');
    // Ensure it starts with 'assets/textures/'
    if (!rel.startsWith('assets/textures/')) {
      // If texturesRootAbs pointed directly to assets/textures, ensure prefix
      rel = `assets/textures/${rel}`;
    }

    const parts = rel.split('/');
    // parts: ['assets','textures', category, quality, ...filename]
    if (parts.length < 5) continue; // need at least category + quality + file

    const category = parts[2];
    const qualityFolder = parts[3];
    const rest = parts.slice(4).join('/');
    const dot = rest.lastIndexOf('.');
    const nameNoExt = dot === -1 ? rest : rest.slice(0, dot);
    const id = `${category}/${nameNoExt}`;
    const quality = folderToQuality(qualityFolder);

    variants.push({
      id,
      quality,
      path: rel,
      label: id,
    });
  }

  return { variants };
}

export function registerTextureCatalogIpc() {
  ipcMain.handle('spaceducks:textures:list', () => {
    // Determine public/assets/textures absolute path.
    // In dev, app.getAppPath() points to project (packages/client)
    const appPath = app.getAppPath();

    // Try dev path: <appPath>/public/assets/textures
    const devPublic = path.join(appPath, 'public');
    const devTextures = path.join(devPublic, 'assets', 'textures');

    // Packaged path: resources/app.asar.unpacked or resources/app
    const resourcesPublic = path.join(process.resourcesPath || appPath, 'public');
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
