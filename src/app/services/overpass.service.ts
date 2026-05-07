import { Injectable } from '@angular/core';

// Overpass API Service für Arztsuche in OpenStreetMap
export interface OverpassArzt {
  id: number;
  name: string;
  lat: number;
  lng: number;
  adresse?: string;
  ort?: string;
  plz?: string;
  telefon?: string;
  website?: string;
  fachrichtung?: string;
  oeffnungszeiten?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OverpassService {
  private readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

  // Suche Ärzte in einem bestimmten Umkreis
  async sucheAerzte(
    lat: number,
    lng: number,
    radiusKm: number = 10,
    fachrichtung?: string,
  ): Promise<OverpassArzt[]> {
    try {
      // Overpass QL Query - sucht nach doctors, clinics, und healthcare facilities
      const radiusM = radiusKm * 1000;

      // Baue Query je nach Fachrichtung
      let amenityFilter = 'doctors';
      if (fachrichtung) {
        // Mapping von deutschen Fachrichtungen zu OSM-Tags (vereinfacht)
        const fachrichtungMap: Record<string, string> = {
          'Allgemeinmedizin': 'general',
          'Innere Medizin': 'internist',
          'Gynäkologie': 'gynaecologist',
          'Kardiologie': 'cardiologist',
          'Dermatologie': 'dermatologist',
          'Orthopädie': 'orthopaedist',
          'Neurologie': 'neurologist',
          'Psychiatrie': 'psychiatrist',
          'Pädiatrie': 'paediatrician',
          'Urologie': 'urologist',
          'HNO': 'ear_nose_throat',
          'Augenheilkunde': 'ophthalmologist',
        };

        const osmTag = fachrichtungMap[fachrichtung];
        if (osmTag) {
          amenityFilter = `doctors"]["healthcare:speciality"~"${osmTag}`;
        }
      }

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="${amenityFilter}"](around:${radiusM},${lat},${lng});
          way["amenity"="${amenityFilter}"](around:${radiusM},${lat},${lng});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch(this.OVERPASS_URL, {
        method: 'POST',
        body: query,
      });

      if (!response.ok) {
        throw new Error(`Overpass API Fehler: ${response.status}`);
      }

      const data = await response.json();

      return this.parseOverpassResults(data.elements);
    } catch (error) {
      console.error('Fehler bei Arztsuche:', error);
      throw error;
    }
  }

  // Suche Ärzte in einer bestimmten Stadt/Region
  async sucheAerzteInStadt(
    stadtName: string,
    bundesland?: string,
  ): Promise<OverpassArzt[]> {
    try {
      // Geocode Stadt zuerst
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stadtName)}${bundesland ? `,${bundesland}` : ''},Österreich&format=json&limit=1`;

      const geocodeResponse = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'ArztMap Austria App',
        },
      });

      if (!geocodeResponse.ok) {
        throw new Error('Stadt nicht gefunden');
      }

      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length === 0) {
        return [];
      }

      const stadtLat = parseFloat(geocodeData[0].lat);
      const stadtLng = parseFloat(geocodeData[0].lon);

      // Suche Ärzte im Umkreis von 5km um die Stadt
      return this.sucheAerzte(stadtLat, stadtLng, 5);
    } catch (error) {
      console.error('Fehler bei Stadtsuche:', error);
      throw error;
    }
  }

  private parseOverpassResults(elements: any[]): OverpassArzt[] {
    const aerzte: OverpassArzt[] = [];

    for (const element of elements) {
      // Nur Nodes und Ways mit Koordinaten
      if (!element.lat || !element.lon) continue;
      if (!element.tags) continue;

      const tags = element.tags;

      // Mindestens Name sollte vorhanden sein
      const name = tags.name || tags['healthcare:name'] || tags['operator'];
      if (!name) continue;

      // Parse Fachrichtung aus OSM-Tags
      let fachrichtung = 'Allgemeinmedizin'; // Default
      if (tags['healthcare:speciality']) {
        fachrichtung = this.mapOsmFachrichtung(tags['healthcare:speciality']);
      } else if (tags.speciality) {
        fachrichtung = this.mapOsmFachrichtung(tags.speciality);
      }

      const arzt: OverpassArzt = {
        id: element.id,
        name: name,
        lat: element.lat,
        lng: element.lon,
        adresse: tags['addr:street']
          ? `${tags['addr:street']} ${tags['addr:housenumber'] || ''}`
          : undefined,
        ort: tags['addr:city'] || tags['addr:town'] || undefined,
        plz: tags['addr:postcode'],
        telefon: tags.phone || tags['contact:phone'],
        website: tags.website || tags['contact:website'],
        fachrichtung: fachrichtung,
        oeffnungszeiten: tags.opening_hours,
      };

      aerzte.push(arzt);
    }

    return aerzte;
  }

  private mapOsmFachrichtung(osmTag: string): string {
    const mapping: Record<string, string> = {
      'general': 'Allgemeinmedizin',
      'internist': 'Innere Medizin',
      'gynaecologist': 'Gynäkologie',
      'cardiologist': 'Kardiologie',
      'dermatologist': 'Dermatologie',
      'orthopaedist': 'Orthopädie',
      'neurologist': 'Neurologie',
      'psychiatrist': 'Psychiatrie',
      'paediatrician': 'Pädiatrie',
      'urologist': 'Urologie',
      'ear_nose_throat': 'HNO',
      'ophthalmologist': 'Augenheilkunde',
      'radiologist': 'Radiologie',
      'anaesthetist': 'Anästhesiologie',
      'surgeon': 'Chirurgie',
    };

    // Versuche alle Varianten
    for (const [key, value] of Object.entries(mapping)) {
      if (osmTag.toLowerCase().includes(key)) {
        return value;
      }
    }

    return 'Allgemeinmedizin'; // Fallback
  }
}
