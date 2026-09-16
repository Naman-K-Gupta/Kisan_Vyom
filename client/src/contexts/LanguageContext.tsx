import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LanguageCode,
  LanguageOption,
  AVAILABLE_LANGUAGES,
  translations,
  TranslationStructure,
} from '../translations';
import { api } from '../api';

export const GOOGLE_TRANSLATE_CODE_MAP: Record<LanguageCode, string> = {
  en: 'en',
  hi: 'hi',
  pa: 'pa',
  bn: 'bn',
  mr: 'mr',
  te: 'te',
  ta: 'ta',
  gu: 'gu',
  kn: 'kn',
  ml: 'ml',
  or: 'or',
  as: 'as',
  ur: 'ur',
  sa: 'sa',
  ne: 'ne',
  mai: 'mai',
  kok: 'gom', // Goan Konkani in Google Translate
  brx: 'brx', // Bodo
  doi: 'doi', // Dogri
  ks: 'ks',   // Kashmiri
  mni: 'mni-Mtei', // Manipuri (Meitei)
  sat: 'sat', // Santali
  sd: 'sd',   // Sindhi
};

const setTransCookie = (targetCode: string) => {
  const expires = new Date(Date.now() + 30 * 864e5).toUTCString();
  document.cookie = `googtrans=/en/${targetCode}; expires=${expires}; path=/`;
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    document.cookie = `googtrans=/en/${targetCode}; expires=${expires}; path=/; domain=.${host}`;
    document.cookie = `googtrans=/en/${targetCode}; expires=${expires}; path=/; domain=${host}`;
  }
};

const clearTransCookie = () => {
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host};`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
  }
};

const applyGoogleTranslate = (targetLang: LanguageCode) => {
  if (targetLang === 'en') {
    const hadCookie = document.cookie.includes('googtrans=');
    clearTransCookie();
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      combo.value = 'en';
      combo.dispatchEvent(new Event('change'));
    }
    // If the page was already translated, reload cleanly to restore pristine React virtual DOM
    if (hadCookie) {
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    return;
  }

  const targetCode = GOOGLE_TRANSLATE_CODE_MAP[targetLang] || targetLang;
  setTransCookie(targetCode);

  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    attempts++;
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo && combo.options && combo.options.length > 0) {
      clearInterval(interval);
      const options = Array.from(combo.options);
      const matched = options.find(
        (opt) =>
          opt.value.toLowerCase() === targetCode.toLowerCase() ||
          opt.value.toLowerCase().startsWith(targetCode.toLowerCase() + '-') ||
          targetCode.toLowerCase().startsWith(opt.value.toLowerCase() + '-')
      );
      if (matched) {
        combo.value = matched.value;
      } else {
        combo.value = targetCode;
      }
      combo.dispatchEvent(new Event('change'));
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
      // If combo not ready after polling, reload so Google Translate script picks up the googtrans cookie
      if (!document.querySelector('.goog-te-combo')) {
        window.location.reload();
      }
    }
  }, 150);
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, fallback?: string) => string;
  availableLanguages: LanguageOption[];
  currentLanguageOption: LanguageOption;
  translateDynamic: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'smart_farmer_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    if (saved && AVAILABLE_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    applyGoogleTranslate(lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    if (language !== 'en') {
      const targetCode = GOOGLE_TRANSLATE_CODE_MAP[language] || language;
      setTransCookie(targetCode);
      applyGoogleTranslate(language);
    }
  }, []);

  const translateDynamic = async (text: string): Promise<string> => {
    if (!text || language === 'en') return text;
    try {
      const targetCode = GOOGLE_TRANSLATE_CODE_MAP[language] || language;
      const res = await api.translate.translateText(text, targetCode, 'en');
      if (res.data?.success && res.data?.translatedText) {
        return res.data.translatedText;
      }
    } catch (e) {
      console.warn('Dynamic translation failed:', e);
    }
    return text;
  };

  /**
   * Helper function to safely traverse nested translation keys.
   * Example: t('nav.dashboard') or t('queue.yourToken')
   */
  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let currentVal: any = translations[language];

    for (const key of keys) {
      if (currentVal && typeof currentVal === 'object' && key in currentVal) {
        currentVal = currentVal[key];
      } else {
        // Fallback to English dictionary
        let fallbackVal: any = translations.en;
        for (const fKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fKey in fallbackVal) {
            fallbackVal = fallbackVal[fKey];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackVal === 'string' ? fallbackVal : fallback || path;
      }
    }

    return typeof currentVal === 'string' ? currentVal : fallback || path;
  };

  const currentLanguageOption =
    AVAILABLE_LANGUAGES.find((l) => l.code === language) || AVAILABLE_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        availableLanguages: AVAILABLE_LANGUAGES,
        currentLanguageOption,
        translateDynamic,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
