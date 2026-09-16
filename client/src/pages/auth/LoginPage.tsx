import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { Sprout, LogIn, AlertCircle, Shield, Briefcase, UserCheck } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if session expired
  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login({ identifier, password });
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'PROCUREMENT_CENTRE_MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/farmer/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative">
      {/* Top Bar with Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center group">
          <Logo size="lg" showText={false} />
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('auth.signInTitle')}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {t('auth.signInSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          {isExpired && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              Session expired. Please sign in again.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('auth.mobileOrEmail')}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. your_email@example.com / 9876543210"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('auth.password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? t('common.loading') : t('auth.signInBtn')}
            </button>
          </form>

          {/* Demo Login Shortcuts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              {t('auth.quickDemo')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('manager.karnal@smartfarmer.gov.in', 'Manager@12345')}
                className="p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-center transition-all group"
              >
                <Briefcase className="w-4 h-4 mx-auto text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-700 mt-1">
                  {t('roles.manager')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@smartfarmer.gov.in', 'Admin@12345')}
                className="p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-center transition-all group"
              >
                <Shield className="w-4 h-4 mx-auto text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="block text-[11px] font-bold text-slate-700 mt-1">
                  {t('roles.admin')}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:underline">
              {t('auth.registerNow')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
