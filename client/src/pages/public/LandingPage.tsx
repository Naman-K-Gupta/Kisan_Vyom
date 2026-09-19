import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { Logo } from '../../components/common/Logo';
import {
  Sprout,
  Clock,
  TrendingUp,
  Bot,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Floating Landing Header with Language Switcher */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center select-none">
            <Logo size="md" showTagline={false} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 rounded-xl transition-colors"
            >
              {t('nav.signIn')}
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20 active:scale-95"
            >
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 pt-10 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {t('landing.badge')}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {t('landing.heroTitle1')}{' '}
              <span className="text-emerald-600">{t('landing.heroHighlight')}</span>{' '}
              {t('landing.heroTitle2')}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {t('landing.heroDesc')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {t('landing.registerFarmer')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm active:scale-95 transition-all flex items-center justify-center"
              >
                {t('landing.signIn')}
              </Link>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t('landing.realTimeQueueTitle')}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.realTimeQueueDesc')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t('landing.mspRatesTitle')}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.mspRatesDesc')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t('landing.aiAdvisorTitle')}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.aiAdvisorDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Demonstration Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('landing.tailoredPortalsTitle')}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {t('landing.tailoredPortalsSub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Farmer Portal Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Sprout className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  {t('roles.farmer')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {t('landing.farmerPortalTitle')}
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li>• {t('landing.farmerPoint1')}</li>
                <li>• {t('landing.farmerPoint2')}</li>
                <li>• {t('landing.farmerPoint3')}</li>
                <li>• {t('landing.farmerPoint4')}</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold text-center transition-all"
            >
              {t('nav.signIn')} →
            </Link>
          </div>

          {/* Manager Portal Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  {t('roles.manager')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {t('landing.managerPortalTitle')}
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li>• {t('landing.managerPoint1')}</li>
                <li>• {t('landing.managerPoint2')}</li>
                <li>• {t('landing.managerPoint3')}</li>
                <li>• {t('landing.managerPoint4')}</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold text-center transition-all"
            >
              {t('nav.signIn')} →
            </Link>
          </div>

          {/* Admin Portal Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  {t('roles.admin')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {t('landing.adminPortalTitle')}
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li>• {t('landing.adminPoint1')}</li>
                <li>• {t('landing.adminPoint2')}</li>
                <li>• {t('landing.adminPoint3')}</li>
                <li>• {t('landing.adminPoint4')}</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold text-center transition-all"
            >
              {t('nav.signIn')} →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-4 text-center">
        <p className="text-xs text-slate-400">
          {t('landing.rightsReserved')}
        </p>
      </footer>
    </div>
  );
};
