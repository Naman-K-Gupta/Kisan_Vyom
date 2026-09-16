import { Request, Response } from 'express';

const translationCache = new Map<string, string>();

const GOOGLE_LANG_MAP: Record<string, string> = {
  kok: 'gom', // Konkani
  mni: 'mni-Mtei', // Manipuri
};

async function fetchGoogleTranslation(
  text: string,
  targetLang: string,
  sourceLang = 'auto'
): Promise<string> {
  if (!text || !text.trim()) return text;
  if (targetLang === 'en' && sourceLang === 'en') return text;

  const cacheKey = `${sourceLang}:${targetLang}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const langCode = GOOGLE_LANG_MAP[targetLang] || targetLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${encodeURIComponent(
    langCode
  )}&dt=t&q=${encodeURIComponent(text.trim())}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Translation API returned status ${res.status}`);
    }

    const data: any = await res.json();
    if (data && Array.isArray(data[0])) {
      const result = data[0].map((chunk: any) => chunk[0]).join('');
      if (result) {
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err: any) {
    console.warn(`[TranslateController] Google Translate fetch error for "${text}":`, err.message);
  }

  return text;
}

export class TranslateController {
  /**
   * POST /api/translate
   * Body:
   *   { text: string, targetLang: string, sourceLang?: string }
   *   OR
   *   { texts: string[], targetLang: string, sourceLang?: string }
   */
  static async translate(req: Request, res: Response) {
    const { text, texts, targetLang, sourceLang = 'auto' } = req.body;

    if (!targetLang) {
      return res.status(400).json({ success: false, message: 'targetLang is required.' });
    }

    // Single text translation
    if (typeof text === 'string') {
      const translated = await fetchGoogleTranslation(text, targetLang, sourceLang);
      return res.json({
        success: true,
        originalText: text,
        translatedText: translated,
        targetLang,
      });
    }

    // Batch text translation
    if (Array.isArray(texts)) {
      const results: Record<string, string> = {};
      await Promise.all(
        texts.map(async (t) => {
          if (typeof t === 'string') {
            results[t] = await fetchGoogleTranslation(t, targetLang, sourceLang);
          }
        })
      );

      return res.json({
        success: true,
        translations: results,
        targetLang,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Either "text" (string) or "texts" (array of strings) must be provided.',
    });
  }

  /**
   * GET /api/translate/supported-languages
   */
  static async getSupportedLanguages(_req: Request, res: Response) {
    return res.json({
      success: true,
      supportedLanguages: [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'pa', name: 'Punjabi' },
        { code: 'bn', name: 'Bengali' },
        { code: 'mr', name: 'Marathi' },
        { code: 'te', name: 'Telugu' },
        { code: 'ta', name: 'Tamil' },
        { code: 'gu', name: 'Gujarati' },
        { code: 'kn', name: 'Kannada' },
        { code: 'ml', name: 'Malayalam' },
        { code: 'or', name: 'Odia' },
        { code: 'as', name: 'Assamese' },
        { code: 'ur', name: 'Urdu' },
        { code: 'sa', name: 'Sanskrit' },
        { code: 'ne', name: 'Nepali' },
        { code: 'mai', name: 'Maithili' },
        { code: 'kok', name: 'Konkani' },
        { code: 'brx', name: 'Bodo' },
        { code: 'doi', name: 'Dogri' },
        { code: 'ks', name: 'Kashmiri' },
        { code: 'mni', name: 'Manipuri' },
        { code: 'sat', name: 'Santali' },
        { code: 'sd', name: 'Sindhi' },
      ],
    });
  }
}
