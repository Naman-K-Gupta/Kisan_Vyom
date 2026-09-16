import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Languages, Check, ChevronDown, Search, X } from 'lucide-react';
import { LanguageCode } from '../../translations';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = '',
}) => {
  const { language, setLanguage, availableLanguages, currentLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const filteredLanguages = availableLanguages.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.nativeLabel.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all active:scale-95 shadow-sm"
        title="22 Recognized Indian Languages / भाषा चुनें"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Languages className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="font-medium text-slate-900">
          {compact ? currentLanguageOption.badge : currentLanguageOption.nativeLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-2 z-50 animate-fade-in divide-y divide-slate-100 overflow-hidden">
          {/* Header */}
          <div className="px-3.5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800">
                Indian Languages / भाषाएं
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] font-bold text-emerald-700">
                22 Official + EN
              </span>
            </div>

            {/* Search Input */}
            <div className="mt-2 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language / खोजें..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 bg-slate-50/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-72 overflow-y-auto py-1 custom-scrollbar divide-y divide-slate-50">
            {filteredLanguages.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                No matching language found
              </div>
            ) : (
              filteredLanguages.map((item) => {
                const isSelected = item.code === language;
                return (
                  <button
                    key={item.code}
                    onClick={() => handleSelectLanguage(item.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-emerald-50/90 text-emerald-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-emerald-200/70 text-emerald-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate text-xs">{item.nativeLabel}</span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {item.label}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
