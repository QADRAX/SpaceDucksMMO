import type { LanguageCode } from '@client/domain/i18n/Language';
import type { Translations } from '@client/domain/i18n/Translations';
import type ITranslationProvider from '@client/domain/ports/ITranslationProvider';
import type ISettingsRepository from '@client/domain/ports/ISettingsRepository';

// Application: i18n Service (use case layer)
export class I18nService {
  private currentLanguage: LanguageCode;
  private translations: Translations | null = null;
  private listeners: Array<(lang: LanguageCode) => void> = [];

  constructor(
    private readonly provider: ITranslationProvider,
    private readonly settingsRepo: ISettingsRepository,
    defaultLanguage: LanguageCode = 'en'
  ) {
    this.currentLanguage = defaultLanguage;
  }

  /**
   * Initialize the service by loading saved language from settings
   */
  async initialize(): Promise<void> {
    try {
      const settings = await this.settingsRepo.load();
      const savedLang = settings.language as LanguageCode;
      
      if (this.provider.isAvailable(savedLang)) {
        await this.changeLanguage(savedLang);
      } else {
        await this.loadTranslations(this.currentLanguage);
      }
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      await this.loadTranslations(this.currentLanguage);
    }
  }

  /**
   * Get current language code
   */
  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  /**
   * Get current translations object
   */
  getTranslations(): Translations | null {
    return this.translations;
  }

  /**
   * Change language and persist to settings
   */
  async changeLanguage(language: LanguageCode): Promise<void> {
    if (!this.provider.isAvailable(language)) {
      throw new Error(`Language ${language} is not available`);
    }

    await this.loadTranslations(language);
    this.currentLanguage = language;

    // Persist to settings
    try {
      const settings = await this.settingsRepo.load();
      settings.language = language;
      await this.settingsRepo.save(settings);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }

    // Notify listeners
    this.notifyListeners(language);
  }

  /**
   * Subscribe to language changes
   */
  subscribe(listener: (lang: LanguageCode) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get nested translation value by dot notation path
   * Example: t('settings.graphics.quality')
   */
  t(key: string, fallback?: string): string {
    if (!this.translations) {
      return fallback || key;
    }

    const keys = key.split('.');
    let value: any = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }

    return typeof value === 'string' ? value : fallback || key;
  }

  private async loadTranslations(language: LanguageCode): Promise<void> {
    try {
      this.translations = await this.provider.load(language);
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error);
      throw error;
    }
  }

  private notifyListeners(language: LanguageCode): void {
    this.listeners.forEach((listener) => listener(language));
  }
}

export default I18nService;
