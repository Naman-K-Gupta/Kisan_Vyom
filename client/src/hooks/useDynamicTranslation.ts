import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../api';

interface UseDynamicTranslationOptions {
  chunkSize?: number;
}

/**
 * Custom hook to dynamically translate arrays of strings into the current user's selected language.
 * Features:
 * - In-memory cache across language changes to avoid redundant API hits.
 * - Automatic chunking to avoid HTTP payload limits on batch translation.
 * - Fallback to English/original strings with 0 UI flicker.
 *
 * @param texts - Array of raw strings to translate
 * @param options - Optional configuration (e.g. chunkSize)
 */
export function useDynamicTranslation(
  texts: (string | null | undefined)[],
  options: UseDynamicTranslationOptions = {}
) {
  const { language } = useLanguage();
  const { chunkSize = 15 } = options;

  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Keep a ref to the cache so multiple renders don't re-trigger existing translations
  const cacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (language === 'en' || !texts || texts.length === 0) {
      return;
    }

    let isMounted = true;
    const missingTexts: string[] = [];

    // Collect all unique, non-empty strings that aren't already cached
    for (const raw of texts) {
      if (!raw || typeof raw !== 'string') continue;
      const clean = raw.trim();
      if (!clean) continue;

      const cacheKey = `${language}:${clean}`;
      if (!cacheRef.current[cacheKey] && !missingTexts.includes(clean)) {
        missingTexts.push(clean);
      }
    }

    if (missingTexts.length === 0) {
      return;
    }

    setIsTranslating(true);

    // Split missing texts into batches
    const chunks: string[][] = [];
    for (let i = 0; i < missingTexts.length; i += chunkSize) {
      chunks.push(missingTexts.slice(i, i + chunkSize));
    }

    Promise.all(
      chunks.map((batch) =>
        api.translate
          .translateBatch(batch, language)
          .then((res) => {
            if (res.data?.success && res.data?.translations) {
              return res.data.translations;
            }
            return {};
          })
          .catch(() => ({}))
      )
    )
      .then((results) => {
        if (!isMounted) return;

        const newEntries: Record<string, string> = {};
        for (const res of results) {
          for (const [orig, trans] of Object.entries(res)) {
            newEntries[`${language}:${orig}`] = trans;
          }
        }

        // Update ref and state
        cacheRef.current = { ...cacheRef.current, ...newEntries };
        setTranslationsMap((prev) => ({ ...prev, ...newEntries }));
      })
      .finally(() => {
        if (isMounted) setIsTranslating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [language, JSON.stringify(texts.filter(Boolean)), chunkSize]);

  /**
   * Helper function to retrieve the translated version of a given text.
   * If in English or translation is not yet loaded, returns the original text.
   */
  const tr = useCallback(
    (text?: string | null): string => {
      if (!text) return '';
      if (language === 'en') return text;
      const key = `${language}:${text.trim()}`;
      return cacheRef.current[key] || translationsMap[key] || text;
    },
    [language, translationsMap]
  );

  return {
    tr,
    isTranslating,
    currentLanguage: language,
  };
}
