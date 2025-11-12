import { createContext } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";
import type I18nService from "@client/application/I18nService";
import type { LanguageCode } from "@client/domain/i18n/Language";

// Context for i18n service
export const I18nContext = createContext<I18nService | null>(null);

/**
 * Hook to access i18n service in components
 */
export function useI18n() {
  const service = useContext(I18nContext);
  
  if (!service) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  const [language, setLanguage] = useState<LanguageCode>(service.getCurrentLanguage());
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Subscribe to language changes
    const unsubscribe = service.subscribe((newLang) => {
      setLanguage(newLang);
      forceUpdate({}); // Force re-render to update translations
    });

    return unsubscribe;
  }, [service]);

  /**
   * Translate function with type-safe keys
   * @param key - Translation key in dot notation (e.g., 'settings.title')
   * @param fallback - Fallback text if translation not found
   */
  const t = (key: string, fallback?: string): string => {
    return service.t(key, fallback);
  };

  /**
   * Change current language
   */
  const changeLanguage = async (lang: LanguageCode): Promise<void> => {
    await service.changeLanguage(lang);
  };

  return {
    t,
    language,
    changeLanguage,
    translations: service.getTranslations(),
  };
}

export default useI18n;
