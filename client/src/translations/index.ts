import { en, TranslationStructure } from './en';
import { hi } from './hi';
import { pa } from './pa';
import {
  bn,
  mr,
  te,
  ta,
  gu,
  kn,
  ml,
  or,
  as,
  ur,
  sa,
  ne,
  mai,
  kok,
  brx,
  doi,
  ks,
  mni,
  sat,
  sd,
} from './indicLanguages';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'pa'
  | 'bn'
  | 'mr'
  | 'te'
  | 'ta'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'or'
  | 'as'
  | 'ur'
  | 'sa'
  | 'ne'
  | 'mai'
  | 'kok'
  | 'brx'
  | 'doi'
  | 'ks'
  | 'mni'
  | 'sat'
  | 'sd';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  badge: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', badge: 'EN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', badge: 'HI' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', badge: 'PA' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', badge: 'BN' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', badge: 'MR' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', badge: 'TE' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', badge: 'TA' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', badge: 'GU' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', badge: 'KN' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', badge: 'ML' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', badge: 'OR' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া', badge: 'AS' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اُردُو', badge: 'UR' },
  { code: 'sa', label: 'Sanskrit', nativeLabel: 'संस्कृतम्', badge: 'SA' },
  { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली', badge: 'NE' },
  { code: 'mai', label: 'Maithili', nativeLabel: 'मैथिली', badge: 'MAI' },
  { code: 'kok', label: 'Konkani', nativeLabel: 'कोंकणी', badge: 'KOK' },
  { code: 'brx', label: 'Bodo', nativeLabel: 'बड़ो', badge: 'BRX' },
  { code: 'doi', label: 'Dogri', nativeLabel: 'डोगरी', badge: 'DOI' },
  { code: 'ks', label: 'Kashmiri', nativeLabel: 'کٲشُر', badge: 'KS' },
  { code: 'mni', label: 'Manipuri', nativeLabel: 'মৈতৈলোন্', badge: 'MNI' },
  { code: 'sat', label: 'Santali', nativeLabel: 'ᱥᱟᱱᱛᱟᱲᱤ', badge: 'SAT' },
  { code: 'sd', label: 'Sindhi', nativeLabel: 'सिन्धी', badge: 'SD' },
];

export const translations: Record<LanguageCode, TranslationStructure> = {
  en,
  hi,
  pa,
  bn,
  mr,
  te,
  ta,
  gu,
  kn,
  ml,
  or,
  as,
  ur,
  sa,
  ne,
  mai,
  kok,
  brx,
  doi,
  ks,
  mni,
  sat,
  sd,
};

export {
  en,
  hi,
  pa,
  bn,
  mr,
  te,
  ta,
  gu,
  kn,
  ml,
  or,
  as,
  ur,
  sa,
  ne,
  mai,
  kok,
  brx,
  doi,
  ks,
  mni,
  sat,
  sd,
};
export type { TranslationStructure };
