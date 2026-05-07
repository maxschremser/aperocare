import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  types?: string[];
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GooglePlacesService {
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {}

  // Load Google Maps API dynamically
  loadGoogleMapsApi(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      if (typeof window.google !== 'undefined' && window.google.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places,visualization&language=de`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Google Maps API konnte nicht geladen werden'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  // Search for doctors near a location
  async searchDoctorsNearby(city: string, radius: number = 10000): Promise<PlaceResult[]> {
    await this.loadGoogleMapsApi();

    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();

      // First, geocode the city
      geocoder.geocode({ address: `${city}, Austria` }, (results: any, status: any) => {
        if (status !== 'OK' || !results || results.length === 0) {
          reject(new Error('Stadt konnte nicht gefunden werden'));
          return;
        }

        const location = results[0].geometry.location;
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));

        const request = {
          location: location,
          radius: radius,
          type: 'doctor',
          language: 'de'
        };

        service.nearbySearch(request, (results: any, status: any) => {
          if (status === 'OK' && results) {
            const places = results.map((place: any) => this.mapPlaceToResult(place));
            resolve(places);
          } else if (status === 'ZERO_RESULTS') {
            resolve([]);
          } else {
            reject(new Error('Fehler bei der Suche'));
          }
        });
      });
    });
  }

  // Text search for doctors
  async searchDoctorsByText(query: string): Promise<PlaceResult[]> {
    await this.loadGoogleMapsApi();

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));

      const request = {
        query: `${query} Arzt Austria`,
        type: 'doctor',
        language: 'de'
      };

      service.textSearch(request, (results: any, status: any) => {
        if (status === 'OK' && results) {
          const places = results.map((place: any) => this.mapPlaceToResult(place));
          resolve(places);
        } else if (status === 'ZERO_RESULTS') {
          resolve([]);
        } else {
          reject(new Error('Fehler bei der Suche'));
        }
      });
    });
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    await this.loadGoogleMapsApi();

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));

      const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'formatted_phone_number', 'website', 'address_components', 'types']
      };

      service.getDetails(request, (place: any, status: any) => {
        if (status === 'OK' && place) {
          resolve(this.mapPlaceToResult(place));
        } else {
          reject(new Error('Details konnten nicht geladen werden'));
        }
      });
    });
  }

  // Create autocomplete instance
  async createAutocomplete(inputElement: HTMLInputElement, onPlaceSelected: (place: PlaceResult) => void): Promise<any> {
    await this.loadGoogleMapsApi();

    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
      types: ['establishment'],
      componentRestrictions: { country: 'at' },
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'formatted_phone_number', 'website', 'address_components', 'types']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry) {
        console.warn('No geometry for place');
        return;
      }

      // Check if it's a doctor/medical facility
      const isDoctorRelated = place.types?.some((type: string) =>
        ['doctor', 'dentist', 'hospital', 'health', 'physiotherapist'].includes(type)
      );

      const result = this.mapPlaceToResult(place);
      onPlaceSelected(result);
    });

    return autocomplete;
  }

  // Map Google Place to our PlaceResult format
  private mapPlaceToResult(place: any): PlaceResult {
    const addressComponents = place.address_components || [];

    // Extract city from address components
    let city = '';
    for (const component of addressComponents) {
      if (component.types.includes('locality')) {
        city = component.long_name;
        break;
      }
      if (component.types.includes('administrative_area_level_1')) {
        city = component.long_name;
      }
    }

    // Fallback: extract city from formatted_address
    if (!city && place.formatted_address) {
      const parts = place.formatted_address.split(',');
      if (parts.length >= 2) {
        city = parts[parts.length - 2].trim().replace(/\d+/g, '').trim();
      }
    }

    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      city: city || 'Unbekannt',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      phone: place.formatted_phone_number,
      website: place.website,
      types: place.types
    };
  }
}
