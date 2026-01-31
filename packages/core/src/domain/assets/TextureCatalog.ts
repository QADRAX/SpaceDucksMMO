export type TextureQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface TextureVariant {
  /**
   * Logical texture id, derived from collection/entity/variant.
   * Example: "planets/jupiter/albedo" or "ui/main-menu/background".
   */
  id: string;

  /**
   * Quality level (optional). When undefined, treat as "low" or base variant.
   */
  quality?: TextureQuality;

  /**
   * Public URL/path to the file, e.g. "assets/textures/planets/jupiter/8k/albedo.jpg".
   */
  path: string;

  /**
   * Optional label or i18n key for UI; default can be derived from id.
   */
  label?: string;

  /**
   * Optional tags derived from folder structure, useful for tooling.
   * Example: ["planets", "jupiter"] or ["ui", "buttons"].
   */
  tags?: string[];
}

export interface TextureCatalog {
  variants: TextureVariant[];
}

export interface TextureCatalogService {
  getCatalog(): Promise<TextureCatalog>;
  getVariantsById(id: string): Promise<TextureVariant[]>;

  /**
   * Convenience helper to pick the best variant for a given id and quality.
   */
  getBestVariant(
    id: string,
    preferred?: TextureQuality
  ): Promise<TextureVariant | undefined>;

  /**
   * Subscribe to catalog updates.
   */
  subscribe(listener: (catalog: TextureCatalog) => void): () => void;
}

export default TextureCatalogService;
