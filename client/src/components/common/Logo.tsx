import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface LogoIconProps {
  className?: string;
  size?: number | string;
}

/**
 * High-definition Emblem Logo Mark for Kisan Vyom.
 * Displays the official circular seal with "किसान व्योम" and "समृद्ध किसान, सशक्त भारत".
 */
export const LogoIcon: React.FC<LogoIconProps> = ({ className = 'w-12 h-12', size }) => {
  const width = size ?? undefined;
  const height = size ?? undefined;

  return (
    <img
      src="/logo.png"
      alt="Kisan Vyom"
      className={`object-contain ${className}`}
      style={width ? { width, height } : undefined}
    />
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

  // Responsive emblem dimensions
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
    xl: 'w-28 h-28 sm:w-32 sm:h-32',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const tagSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
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
              className={`font-semibold tracking-wide mt-1 hidden sm:block ${tagSizes[size]} ${
                variant === 'dark' ? 'text-emerald-200/80' : 'text-slate-500'
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

