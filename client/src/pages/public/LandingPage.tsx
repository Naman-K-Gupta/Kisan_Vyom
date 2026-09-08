import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Clock,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Bot,
  ArrowRight,
  Sparkles,
  CloudSun,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Unified Digital Agriculture Ecosystem
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Empowering Farmers with <span className="text-emerald-600">Digital Queues</span> & Smart Procurement
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Skip endless mandi queues, get transparent MSP prices, track live procurement capacities, and consult AI agronomy advisors — all from your phone.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Register as Farmer <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm active:scale-95 transition-all flex items-center justify-center"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Digital Queues</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Generate digital tokens before leaving home. Monitor live wait times, farmers ahead, and receive SMS when your bay is ready.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Government MSP & Mandi Rates</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Access verified Minimum Support Prices from the Ministry of Agriculture. Calculate crop value with real APMC arrival prices.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Kisan Sahayak Advisor</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Analyze leaf photos for disease detection, optimize irrigation with weather forecasts, and receive personalized crop recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Demonstration Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Tailored Portals for Every Stakeholder</h2>
          <p className="text-sm text-slate-500 mt-2">Engineered for farmers, centre managers, and agricultural administrators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Stakeholder 1</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-2">Kisan (Farmer) Portal</h3>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li>• Farm profile & crop cultivation tracker</li>
                <li>• Interactive procurement centre locator & directions</li>
                <li>• One-touch digital token generation</li>
                <li>• AI plant doctor & crop advisory suite</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold text-center transition-all"
            >
              Enter Farmer Desk →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Stakeholder 2</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-2">Centre Manager Desk</h3>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li>• Real-time digital queue management (Call, Process, Complete)</li>
                <li>• Live storage capacity & intake rate sliders</li>
                <li>• Automatic queue advancement & SMS alerts</li>
                <li>• Daily procurement reconciliation</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold text-center transition-all"
            >
              Enter Manager Desk →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Stakeholder 3</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-2">Administrative Hub</h3>
              <ul className="text-xs text-slate-600 space-y-2 mb-6">
                <li>• Statewide capacity utilization analytics</li>
                <li>• Official MSP rates publication with audit trails</li>
                <li>• Farmer registration & centre assignment oversight</li>
                <li>• Broadcast emergency agricultural & weather alerts</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold text-center transition-all"
            >
              Enter Admin Portal →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
