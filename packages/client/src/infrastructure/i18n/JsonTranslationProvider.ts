import type { LanguageCode } from '@client/domain/i18n/Language';
import type { Translations } from '@client/domain/i18n/Translations';
import type ITranslationProvider from '@client/domain/ports/ITranslationProvider';

// Infrastructure: JSON-based translation provider
export class JsonTranslationProvider implements ITranslationProvider {
  private cache: Map<LanguageCode, Translations> = new Map();

  async load(language: LanguageCode): Promise<Translations> {
    // Check cache first
    if (this.cache.has(language)) {
      return this.cache.get(language)!;
    }

    // Dynamically import JSON file
    try {
      const module = await import(`./locales/${language}.json`);
      const translations = module.default as Translations;
      
      // Cache for future use
      this.cache.set(language, translations);
      
      return translations;
    } catch (error) {
      console.error(`Failed to load translations for language: ${language}`, error);
      
      // Fallback to English
      if (language !== 'en') {
        console.warn(`Falling back to English translations`);
        return this.load('en');
      }
      
      throw new Error(`Cannot load translations for ${language}`);
    }
  }

  isAvailable(language: LanguageCode): boolean {
    // List of available languages (matching your JSON files)
    const available: LanguageCode[] = ['en', 'es'];
    return available.includes(language);
  }

  /**
   * Preload translations for a language
   */
  async preload(language: LanguageCode): Promise<void> {
    if (!this.cache.has(language)) {
      await this.load(language);
    }
  }

  /**
   * Clear cache (useful for hot reload in development)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default JsonTranslationProvider;
