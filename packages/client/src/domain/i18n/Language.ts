// Domain: Supported languages
export type LanguageCode = 'en' | 'es';

export interface LanguageInfo {
  code: LanguageCode;
  name: string; // Native name (e.g., "English", "Español")
  flag: string; // Emoji flag
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
