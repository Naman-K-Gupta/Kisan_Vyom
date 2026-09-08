import axios from 'axios';
import { logger } from '../utils/logger';

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  locationName?: string;
  current: {
    temperature: number;
    weatherCode: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    rainProbability: number;
    isDay: boolean;
  };
  daily: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
    rainProbability: number;
    weatherCode: number;
  }>;
}

const WMO_CODE_MAP: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  62: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export async function fetchLiveWeather(lat: number, lon: number): Promise<WeatherResponse | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    
    const response = await axios.get(url, { timeout: 6000 });
    const data = response.data;

    const currentCode = data.current?.weather_code ?? 0;
    const currentCondition = WMO_CODE_MAP[currentCode] || 'Clear';

    const dailyForecast: WeatherResponse['daily'] = [];
    const dates = data.daily?.time || [];
    const maxTemps = data.daily?.temperature_2m_max || [];
    const minTemps = data.daily?.temperature_2m_min || [];
    const codes = data.daily?.weather_code || [];
    const rainProbs = data.daily?.precipitation_probability_max || [];

    for (let i = 0; i < Math.min(dates.length, 7); i++) {
      const code = codes[i] ?? 0;
      dailyForecast.push({
        date: dates[i],
        maxTemp: Math.round(maxTemps[i] || 0),
        minTemp: Math.round(minTemps[i] || 0),
        condition: WMO_CODE_MAP[code] || 'Clear',
        rainProbability: rainProbs[i] || 0,
        weatherCode: code,
      });
    }

    return {
      latitude: lat,
      longitude: lon,
      current: {
        temperature: Math.round(data.current?.temperature_2m ?? 0),
        weatherCode: currentCode,
        condition: currentCondition,
        humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
        rainProbability: rainProbs[0] ?? 0,
        isDay: Boolean(data.current?.is_day),
      },
      daily: dailyForecast,
    };
  } catch (error: any) {
    logger.error(`Open-Meteo weather fetch failed for [${lat}, ${lon}]:`, error.message || error);
    return null;
  }
}
