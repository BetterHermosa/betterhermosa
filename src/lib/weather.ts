import { HourlyForecast, WeatherData } from '../types';
import { fetchWithCache } from './api';
import { config } from './lguConfig';

/**
 * Map OpenWeatherMap icon codes to Lucide icon names
 */
export const mapWeatherIconToLucide = (iconCode: string): string => {
  const iconMap: Record<string, string> = {
    '01d': 'Sun',
    '01n': 'Moon',
    '02d': 'CloudSun',
    '02n': 'CloudMoon',
    '03d': 'Cloud',
    '03n': 'Cloud',
    '04d': 'Cloud',
    '04n': 'Cloud',
    '09d': 'CloudDrizzle',
    '09n': 'CloudDrizzle',
    '10d': 'CloudRain',
    '10n': 'CloudRain',
    '11d': 'CloudLightning',
    '11n': 'CloudLightning',
    '13d': 'CloudSnow',
    '13n': 'CloudSnow',
    '50d': 'Cloud',
    '50n': 'Cloud',
  };
  return iconMap[iconCode] || 'Cloud';
};

/**
 * WMO weather code (Open-Meteo) -> OpenWeatherMap-style icon code + label, so
 * the rest of the UI keeps using mapWeatherIconToLucide.
 */
const WMO: Record<number, [string, string]> = {
  0: ['01', 'clear sky'],
  1: ['02', 'mainly clear'],
  2: ['03', 'partly cloudy'],
  3: ['04', 'overcast'],
  45: ['50', 'fog'],
  48: ['50', 'rime fog'],
  51: ['09', 'light drizzle'],
  53: ['09', 'drizzle'],
  55: ['09', 'heavy drizzle'],
  61: ['10', 'light rain'],
  63: ['10', 'rain'],
  65: ['10', 'heavy rain'],
  80: ['09', 'light rain showers'],
  81: ['09', 'rain showers'],
  82: ['09', 'violent rain showers'],
  95: ['11', 'thunderstorm'],
  96: ['11', 'thunderstorm with hail'],
  99: ['11', 'thunderstorm with heavy hail'],
};

const wmo = (code: number, isDay: boolean) => {
  const [icon, description] = WMO[code] ?? ['03', 'cloudy'];
  return { icon: `${icon}${isDay ? 'd' : 'n'}`, description };
};

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    surface_pressure: number;
    visibility: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: number[];
    temperature_2m: number[];
    weather_code: number[];
    is_day: number[];
  };
}

/**
 * Fetch weather for the configured LGU from Open-Meteo (free, no API key,
 * CORS-enabled), so the portal needs no weather backend.
 */
export const fetchWeatherData = async (): Promise<WeatherData[]> => {
  const { lat, lon } = config.location.coordinates;
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,weather_code,is_day,visibility',
    hourly: 'temperature_2m,weather_code,is_day',
    wind_speed_unit: 'ms',
    timezone: 'Asia/Manila',
    timeformat: 'unixtime',
    forecast_days: '2',
  });

  const data = await fetchWithCache<OpenMeteoResponse>(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );
  const { current, hourly: hours } = data;
  const now = wmo(current.weather_code, current.is_day === 1);

  // Next 4 entries, one every 3 hours, starting from the upcoming hour.
  const nowSec = Date.now() / 1000;
  const start = Math.max(
    0,
    hours.time.findIndex(t => t >= nowSec)
  );
  const hourly: HourlyForecast[] = [0, 3, 6, 9]
    .map(offset => start + offset)
    .filter(i => i < hours.time.length)
    .map(i => {
      const w = wmo(hours.weather_code[i], hours.is_day[i] === 1);
      return {
        dt: hours.time[i],
        temp: hours.temperature_2m[i],
        temperature: Math.round(hours.temperature_2m[i]),
        feels_like: hours.temperature_2m[i],
        icon: mapWeatherIconToLucide(w.icon),
        description: w.description,
        humidity: current.relative_humidity_2m,
        wind_speed: current.wind_speed_10m,
        hour: new Date(hours.time[i] * 1000).toLocaleTimeString([], {
          hour: 'numeric',
          hour12: true,
        }),
      };
    });

  return [
    {
      location: config.lgu.name,
      temperature: Math.round(current.temperature_2m),
      condition: now.description,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      icon: mapWeatherIconToLucide(now.icon),
      hourly,
      pressure: Math.round(current.surface_pressure),
      visibility: Math.round(current.visibility / 1000),
    },
  ];
};
