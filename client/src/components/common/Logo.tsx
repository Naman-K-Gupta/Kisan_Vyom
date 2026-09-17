import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface LogoIconProps {
  className?: string;
  size?: number | string;
}

/**
 * High-definition SVG Logo Mark for Kisan Vyom.
 * Features:
 * - Emerald & teal gradient squircle container
 * - Rising golden dawn sun & rolling field contours
 * - Golden wheat ear (prosperity, MSP & harvest)
 * - Vibrant sprouting emerald leaf (sustainable agriculture)
 * - Precision AI & digital sparkle (smart mandi technology)
 */
export const LogoIcon: React.FC<LogoIconProps> = ({ className = 'w-10 h-10', size }) => {
  const width = size ?? undefined;
  const height = size ?? undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={width ? { width, height } : undefined}
      aria-label="Kisan Vyom Logo"
    >
      <defs>
        {/* Modern Emerald Gradient Background */}
        <linearGradient id="kk_bg_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>

        {/* Golden Harvest Wheat Gradient */}
        <linearGradient id="kk_wheat_gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>

        {/* Vibrant Eco Leaf Gradient */}
        <linearGradient id="kk_leaf_gradient" x1="0%" y1="100%" x2="60%" y2="0%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>

        {/* Dawn Horizon Sun Glow */}
        <radialGradient id="kk_sun_radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#F59E0B" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
        </radialGradient>

        {/* Soft Drop Shadow */}
        <filter id="kk_badge_shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#064E3B" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Rounded Squircle Container */}
      <rect
        width="100"
        height="100"
        rx="26"
        fill="url(#kk_bg_gradient)"
        filter="url(#kk_badge_shadow)"
      />

      {/* Sleek Inner Border Accent */}
      <rect
        x="2.5"
        y="2.5"
        width="95"
        height="95"
        rx="23.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />

      {/* Sun Glow Behind Crops */}
      <circle cx="50" cy="42" r="22" fill="url(#kk_sun_radial)" />
      <circle cx="50" cy="46" r="12" fill="#FBBF24" fillOpacity="0.9" />

      {/* Rolling Agricultural Furrow Waves */}
      <path
        d="M 6 77 Q 28 67 52 74 T 94 72 L 94 88 Q 72 94 50 94 T 6 88 Z"
        fill="#064E3B"
        fillOpacity="0.5"
      />
      <path
        d="M 6 83 Q 32 75 60 80 T 94 78 L 94 92 Q 50 96 6 92 Z"
        fill="#047857"
        fillOpacity="0.85"
      />

      {/* Central Wheat Stalk */}
      <path
        d="M 50 82 C 50 66 48 46 47 24"
        stroke="#FDE68A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Golden Wheat Grains (Left & Center) */}
      <path
        d="M 48 64 C 40 63 35 57 36 51 C 42 52 48 58 48 64 Z"
        fill="url(#kk_wheat_gradient)"
      />
      <path
        d="M 48 54 C 39 53 34 46 36 40 C 42 41 48 48 48 54 Z"
        fill="url(#kk_wheat_gradient)"
      />
      <path
        d="M 48 44 C 39 42 35 35 37 29 C 43 30 48 37 48 44 Z"
        fill="url(#kk_wheat_gradient)"
      />
      <path
        d="M 48 34 C 40 31 37 24 40 19 C 45 21 48 27 48 34 Z"
        fill="url(#kk_wheat_gradient)"
      />
      <path
        d="M 47 25 C 45 19 47 14 49 13 C 51 17 50 21 47 25 Z"
        fill="url(#kk_wheat_gradient)"
      />

      {/* Sprouting Vibrant Leaf (Right Side) */}
      <path
        d="M 50 72 C 59 70 75 61 73 43 C 71 33 60 37 52 45 C 50 55 49 66 50 72 Z"
        fill="url(#kk_leaf_gradient)"
      />
      {/* Leaf Vein */}
      <path
        d="M 51 58 C 57 53 66 47 69 43"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />

      {/* Secondary Sprout Leaflet (Upper Right) */}
      <path
        d="M 49 46 C 56 43 65 37 63 26 C 56 27 51 34 49 46 Z"
        fill="url(#kk_leaf_gradient)"
      />

      {/* Smart Technology / AI 4-Point Star Sparkle */}
      <path
        d="M 76 18 C 76 22 79 24 83 24 C 79 24 76 26 76 30 C 76 26 73 24 69 24 C 73 24 76 22 76 18 Z"
        fill="#FDE68A"
      />
      <circle cx="76" cy="24" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = true,
  className = '',
  variant = 'light',
}) => {
  const { t } = useLanguage();

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const tagSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative group-hover:scale-105 transition-transform duration-200">
        <LogoIcon className={`${iconSizes[size]} flex-shrink-0 drop-shadow-sm`} />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-extrabold tracking-tight ${titleSizes[size]} ${
                variant === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Kisan
            </span>
            <span
              className={`font-extrabold tracking-tight ${titleSizes[size]} ${
                variant === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              Vyom
            </span>
          </div>

          {showTagline && (
            <p
              className={`font-medium tracking-wide mt-1 hidden sm:block ${tagSizes[size]} ${
                variant === 'dark' ? 'text-emerald-200/70' : 'text-slate-400'
              }`}
            >
              {t('nav.tag')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
