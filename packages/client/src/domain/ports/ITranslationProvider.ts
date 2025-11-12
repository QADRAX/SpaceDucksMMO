import type { LanguageCode } from '@client/domain/i18n/Language';
import type { Translations } from '@client/domain/i18n/Translations';

// Domain: Port for loading translation files
export interface ITranslationProvider {
  /**
   * Load translations for a specific language
   * @param language - Language code to load
   * @returns Promise with translations object
   */
  load(language: LanguageCode): Promise<Translations>;

  /**
   * Check if a language is available
   * @param language - Language code to check
   */
  isAvailable(language: LanguageCode): boolean;
}

export default ITranslationProvider;
