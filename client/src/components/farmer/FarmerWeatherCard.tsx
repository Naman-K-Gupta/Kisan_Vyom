import React from 'react';
import { WeatherDataDTO } from '@smart-farmer/shared';
import { CloudSun, Droplets, Wind } from 'lucide-react';

interface FarmerWeatherCardProps {
  weather: WeatherDataDTO | null;
  t: (path: string, fallback?: string) => string;
}

/**
 * Humanized Weather & Micro-climate Telemetry card.
 * Displays local weather, temperature, humidity, wind speed, and agricultural advisories.
 */
export const FarmerWeatherCard: React.FC<FarmerWeatherCardProps> = ({ weather, t }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {t('weather.weatherTitle', 'Live Weather Advisory')}
        </span>
        <CloudSun className="w-5 h-5 text-amber-500" />
      </div>

      {weather ? (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {weather.current.temperature}°C
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {weather.current.condition}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{weather.locationName}</p>
          <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-500" /> {t('weather.humidity', 'Humidity')}: {weather.current.humidity}%
            </span>
            <span className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-teal-500" /> {t('weather.wind', 'Wind')}: {weather.current.windSpeed} km/h
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          {t('weather.loadingWeather', 'Syncing meteorological telemetry...')}
        </div>
      )}
    </div>
  );
};
