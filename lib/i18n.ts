import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import 'intl-pluralrules';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import it from '@/locales/it.json';
import { getSetting } from './db';

const resources = {
  en: { translation: en },
  it: { translation: it },
};

export const initI18n = async () => {
  let language = 'en'; // Default fallback

  try {
    // 1. Check DB for user preference
    const savedLanguage = await getSetting('language');

    if (savedLanguage) {
      language = savedLanguage;
    } else {
      // 2. Check Device Locale
      const deviceLanguage = getLocales()[0]?.languageCode;
      if (deviceLanguage && ['en', 'it'].includes(deviceLanguage)) {
        language = deviceLanguage;
      }
    }
  } catch (e) {
    console.warn("Failed to load language setting, falling back to device or default", e);
    // Fallback to device if DB fails
    const deviceLanguage = getLocales()[0]?.languageCode;
    if (deviceLanguage && ['en', 'it'].includes(deviceLanguage)) {
      language = deviceLanguage;
    }
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v3' // For Android compatibility with larger JSONs if needed
    });
};

export default i18n;
