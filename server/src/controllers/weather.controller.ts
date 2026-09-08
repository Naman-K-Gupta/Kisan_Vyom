import { Request, Response } from 'express';
import { fetchLiveWeather } from '../services/weather.service';
import { prisma } from '../utils/prisma';

export class WeatherController {
  static async getWeather(req: Request, res: Response) {
    let lat = req.query.lat ? parseFloat(String(req.query.lat)) : null;
    let lon = req.query.lon ? parseFloat(String(req.query.lon)) : null;
    let locationName = req.query.locationName ? String(req.query.locationName) : '';

    // If coordinates are not provided, attempt to use farmer's district/village or standard coordinates
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      if (req.user) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { district: true, state: true },
        });
        locationName = `${user?.district || 'Karnal'}, ${user?.state || 'Haryana'}`;
      } else {
        locationName = 'Karnal, Haryana';
      }
      // Representative agricultural coordinate for Karnal / NCR
      lat = 29.6857;
      lon = 76.9905;
    }

    const weather = await fetchLiveWeather(lat, lon);

    if (!weather) {
      return res.json({
        success: true,
        weather: null,
        message: 'Live weather data is currently unavailable.',
      });
    }

    res.json({
      success: true,
      weather: {
        ...weather,
        locationName: locationName || `${weather.latitude.toFixed(2)}°N, ${weather.longitude.toFixed(2)}°E`,
      },
    });
  }
}
