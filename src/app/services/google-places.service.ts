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

      script.onerror = (error) => {
        console.error('Google Maps script load error:', error);
        console.error('Script URL:', script.src);
        console.error('API Key:', environment.googleMapsApiKey);
        reject(new Error('Google Maps API konnte nicht geladen werden. Bitte API-Schlüssel in der Google Cloud Console überprüfen.'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  // Search for doctors near a location using new Places API (REST)
  async searchDoctorsNearby(city: string, radius: number = 10000): Promise<PlaceResult[]> {
    try {
      // First, geocode the city
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', Austria')}&key=${environment.googleMapsApiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results?.length) {
        throw new Error('Stadt konnte nicht gefunden werden');
      }

      const location = geocodeData.results[0].geometry.location;

      // Use new Places API (REST)
      const placesUrl = 'https://places.googleapis.com/v1/places:searchNearby';
      const response = await fetch(placesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': environment.googleMapsApiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.websiteUri,places.types'
        },
        body: JSON.stringify({
          includedTypes: ['doctor', 'hospital'],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: location.lat,
                longitude: location.lng
              },
              radius: radius
            }
          },
          languageCode: 'de'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Places API error:', data);
        throw new Error(data.error?.message || 'Fehler bei der Suche');
      }

      if (!data.places || data.places.length === 0) {
        return [];
      }

      return data.places.map((place: any) => this.mapNewPlaceToResult(place));
    } catch (error: any) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Text search for doctors using new Places API
  async searchDoctorsByText(query: string): Promise<PlaceResult[]> {
    try {
      const placesUrl = 'https://places.googleapis.com/v1/places:searchText';
      const response = await fetch(placesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': environment.googleMapsApiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.websiteUri,places.types'
        },
        body: JSON.stringify({
          textQuery: `${query} Arzt Austria`,
          languageCode: 'de',
          maxResultCount: 20
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Places API error:', data);
        throw new Error(data.error?.message || 'Fehler bei der Suche');
      }

      if (!data.places || data.places.length === 0) {
        return [];
      }

      return data.places.map((place: any) => this.mapNewPlaceToResult(place));
    } catch (error: any) {
      console.error('Search error:', error);
      throw error;
    }
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

  // Get human-readable error message from status
  private getStatusErrorMessage(status: string): string {
    switch (status) {
      case 'REQUEST_DENIED':
        return 'Google Places API Zugriff verweigert. Bitte API-Schlüssel überprüfen.';
      case 'OVER_QUERY_LIMIT':
        return 'API-Limit erreicht. Bitte später erneut versuchen.';
      case 'INVALID_REQUEST':
        return 'Ungültige Anfrage an Google Places API.';
      case 'UNKNOWN_ERROR':
        return 'Unbekannter Fehler. Bitte erneut versuchen.';
      default:
        return `Google Places API Fehler: ${status}`;
    }
  }

  // Map new Places API format to our PlaceResult
  private mapNewPlaceToResult(place: any): PlaceResult {
    // Extract city from address
    const addressParts = place.formattedAddress?.split(',') || [];
    let city = 'Unbekannt';

    if (addressParts.length >= 2) {
      // Usually format is: "Street, Postal Code City, Country"
      const cityPart = addressParts[addressParts.length - 2].trim();
      // Remove postal code
      city = cityPart.replace(/^\d+\s*/, '').trim();
    }

    return {
      placeId: place.id,
      name: place.displayName?.text || 'Unbekannt',
      address: place.formattedAddress || '',
      city: city,
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      phone: place.internationalPhoneNumber,
      website: place.websiteUri,
      types: place.types || []
    };
  }

  // Map Google Place to our PlaceResult format (legacy - not used with new API)
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
