import { Injectable } from '@angular/core';

// Geocoding-Service für Nominatim (OpenStreetMap)
export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  // Geocode eine Adresse zu Koordinaten
  async geocodeAdresse(
    adresse: string,
    ort: string,
    bundesland: string,
  ): Promise<GeocodingResult | null> {
    try {
      // Baue Suchanfrage zusammen
      const query = `${adresse}, ${ort}, ${bundesland}, Österreich`;
      const url = `${this.NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=at`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ArztMap Austria App', // Nominatim verlangt User-Agent
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
      };
    } catch (error) {
      console.error('Geocoding-Fehler:', error);
      return null;
    }
  }

  // Reverse Geocoding: Von Koordinaten zu Adresse
  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<GeocodingResult | null> {
    try {
      const url = `${this.NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ArztMap Austria App',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
      };
    } catch (error) {
      console.error('Reverse Geocoding-Fehler:', error);
      return null;
    }
  }
}
