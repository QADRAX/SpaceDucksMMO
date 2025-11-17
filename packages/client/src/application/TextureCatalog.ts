export type TextureQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface TextureVariant {
  /** Logical texture id, independent from quality and file extension. */
  id: string;
  /** Quality level derived from folder (2k/4k/8k). */
  quality: TextureQuality;
  /** Public URL/path to the file, e.g. "assets/textures/planets/8k/jupiter.jpg". */
  path: string;
  /** Optional label or i18n key for UI; default can be derived from id. */
  label?: string;
}

export interface TextureCatalog {
  variants: TextureVariant[];
}

export interface TextureCatalogService {
  getCatalog(): Promise<TextureCatalog>;
  getVariantsById(id: string): Promise<TextureVariant[]>;
  subscribe(listener: (catalog: TextureCatalog) => void): () => void;
}

export default TextureCatalogService;
