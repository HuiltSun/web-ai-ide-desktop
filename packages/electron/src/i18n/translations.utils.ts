import type { Language, Translations } from './translations.types';
import { enTranslations } from './en.translations';
import { zhTranslations } from './zh.translations';

const translations: Record<Language, Translations> = {
  en: enTranslations,
  zh: zhTranslations,
};

export function getTranslation(lang: Language): Translations {
  return translations[lang];
}
