import React, { useState, useEffect } from 'react';
import {
  Flame,
  Leaf,
  Sprout,
  Droplets,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Pause,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EnvironmentAwarenessBannerProps {
  t: (path: string, fallback?: string) => string;
}

export const EnvironmentAwarenessBanner: React.FC<EnvironmentAwarenessBannerProps> = ({ t }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 'stubble-burning',
      tag: t('envBanner.slide1Tag', 'Crop Residue Management (CRM)'),
      title: t('envBanner.slide1Title', 'Say NO to Stubble / Stalk Burning (पराली प्रबंधन)'),
      desc: t(
        'envBanner.slide1Desc',
        'Burning crop residue destroys essential soil organic carbon, kills beneficial earthworms, and causes severe smog. Use Super Seeder, Happy Seeder, and Pusa Bio-decomposer with up to 50% government machine subsidy.'
      ),
      icon: Flame,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100 border-amber-200',
      gradient: 'from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-amber-200/80',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      pills: [
        { label: t('envBanner.slide1Pill1', 'Preserve Soil Organic Carbon'), icon: Leaf },
        { label: t('envBanner.slide1Pill2', '50% Machine Subsidy Available'), icon: Award },
        { label: t('envBanner.slide1Pill3', 'Free Bio-Decomposer Spray'), icon: Sparkles },
      ],
      ctaLink: '/farmer/schemes',
      accentColor: 'text-amber-700',
    },
    {
      id: 'fertilizer-rationalization',
      tag: t('envBanner.slide2Tag', 'Soil Health & Fertilizer Rationalization'),
      title: t('envBanner.slide2Title', 'Rationalize Chemical Fertilizers — Protect Soil Health'),
      desc: t(
        'envBanner.slide2Desc',
        'Excessive use of Urea & DAP acidifies soil and contaminates groundwater. Follow Soil Health Card recommendations, adopt Neem-Coated Urea, Nano Urea sprays, and enrich fields with Vermicompost and Bio-fertilizers.'
      ),
      icon: Sprout,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100 border-emerald-200',
      gradient: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-200/80',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      pills: [
        { label: t('envBanner.slide2Pill1', 'Nano Urea: 80% Efficient Absorption'), icon: ShieldCheck },
        { label: t('envBanner.slide2Pill2', 'Soil Health Card Based Usage'), icon: Award },
        { label: t('envBanner.slide2Pill3', 'Organic Compost Enriching'), icon: Leaf },
      ],
      ctaLink: '/farmer/schemes',
      accentColor: 'text-emerald-700',
    },
    {
      id: 'micro-irrigation',
      tag: t('envBanner.slide3Tag', 'Water Conservation & Micro-Irrigation'),
      title: t('envBanner.slide3Title', 'Micro-Irrigation: Save 40% Water & Boost Yield'),
      desc: t(
        'envBanner.slide3Desc',
        'Flood irrigation causes excessive evaporation and nutrient runoff. Switch to Drip and Micro-Sprinkler irrigation under PMKSY with up to 55% subsidy for targeted root-zone hydration.'
      ),
      icon: Droplets,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100 border-blue-200',
      gradient: 'from-blue-500/10 via-sky-500/10 to-emerald-500/10 border-blue-200/80',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      pills: [
        { label: t('envBanner.slide3Pill1', 'Save 40–50% Ground Water'), icon: Droplets },
        { label: t('envBanner.slide3Pill2', 'Fertigation: Zero Leaching'), icon: ShieldCheck },
        { label: t('envBanner.slide3Pill3', '55% Subsidy under PMKSY'), icon: Award },
      ],
      ctaLink: '/farmer/schemes',
      accentColor: 'text-blue-700',
    },
    {
      id: 'natural-farming',
      tag: t('envBanner.slide4Tag', 'Bio-Pesticides & Natural Farming'),
      title: t('envBanner.slide4Title', 'Adopt Natural Farming & Integrated Pest Management'),
      desc: t(
        'envBanner.slide4Desc',
        'Protect natural pollinators like honeybees and eliminate toxic chemical residues. Use Neem seed extract, Trichoderma, and Pheromone traps while slashing cultivation costs by ₹2,500/acre.'
      ),
      icon: Leaf,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-100 border-teal-200',
      gradient: 'from-teal-500/10 via-emerald-500/10 to-green-500/10 border-teal-200/80',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
      pills: [
        { label: t('envBanner.slide4Pill1', 'Zero Toxic Chemical Residue'), icon: ShieldCheck },
        { label: t('envBanner.slide4Pill2', 'Protect Natural Pollinators'), icon: Sparkles },
        { label: t('envBanner.slide4Pill3', 'Save ₹2,500/Acre Input Cost'), icon: Award },
      ],
      ctaLink: '/farmer/schemes',
      accentColor: 'text-teal-700',
    },
  ];

  // Auto-play interval
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative rounded-2xl p-5 sm:p-6 bg-gradient-to-br ${slide.gradient} bg-white border shadow-card transition-all duration-500 flex flex-col justify-between overflow-hidden min-h-[220px]`}
    >
      {/* Top Header Row: Category Badge & Slide Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${slide.badgeBg}`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            {slide.tag}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Carousel Navigation Buttons & Play/Pause */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 border border-slate-200/50 transition active:scale-95"
            title={isPaused ? t('envBanner.autoPlayResume', 'Resume Slideshow') : t('envBanner.autoPlayPause', 'Pause Slideshow')}
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={prevSlide}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200/60 shadow-2xs transition active:scale-95"
            title={t('envBanner.prevSlide', 'Previous Slide')}
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200/60 shadow-2xs transition active:scale-95"
            title={t('envBanner.nextSlide', 'Next Slide')}
            aria-label="Next Slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slide Body */}
      <div className="space-y-2.5">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${slide.iconBg} ${slide.iconColor}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug tracking-tight">
              {slide.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3 sm:line-clamp-2">
              {slide.desc}
            </p>
          </div>
        </div>

        {/* Actionable Benefit Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {slide.pills.map((pill, idx) => {
            const PillIcon = pill.icon;
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/90 text-slate-700 border border-slate-200/80 shadow-2xs"
              >
                <PillIcon className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>{pill.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer: Dot Indicators & Scheme Link */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/40">
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-6 bg-emerald-600 shadow-2xs'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        <Link
          to={slide.ctaLink}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
        >
          <span>{t('schemes.viewGuidelines', 'View Schemes & Subsidies')}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
