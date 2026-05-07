import { Injectable, signal, computed } from '@angular/core';
import {
  Arzt,
  Besuch,
  getBesuchsStatus,
  getLetzterBesuch,
} from '../models/arzt.model';

// Service für Arztverwaltung mit LocalStorage-Persistenz
@Injectable({
  providedIn: 'root',
})
export class ArztService {
  private readonly STORAGE_KEY = 'arztmap-austria-aerzte';

  // Signal für alle Ärzte
  private aerzte = signal<Arzt[]>([]);

  // Öffentliche Computed Signals
  alleAerzte = computed(() => this.aerzte());

  // Ärzte nach Status gruppiert
  aktuelleAerzte = computed(() =>
    this.aerzte().filter(
      (a) => getBesuchsStatus(getLetzterBesuch(a)) === 'aktuell',
    ),
  );

  baldFaelligeAerzte = computed(() =>
    this.aerzte().filter(
      (a) => getBesuchsStatus(getLetzterBesuch(a)) === 'bald-faellig',
    ),
  );

  ueberfaelligeAerzte = computed(() =>
    this.aerzte().filter(
      (a) => getBesuchsStatus(getLetzterBesuch(a)) === 'ueberfaellig',
    ),
  );

  constructor() {
    this.ladeAusStorage();
    // Wenn keine Daten vorhanden, lade Seed-Daten
    if (this.aerzte().length === 0) {
      this.ladeSeedDaten();
    }
  }

  // Lade Ärzte aus LocalStorage
  private ladeAusStorage(): void {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (json) {
        const daten = JSON.parse(json);
        this.aerzte.set(daten);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  }

  // Speichere Ärzte in LocalStorage
  private speichereInStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.aerzte()));
    } catch (error) {
      console.error('Fehler beim Speichern der Daten:', error);
    }
  }

  // Hole einen Arzt nach ID
  getArztById(id: string): Arzt | undefined {
    return this.aerzte().find((a) => a.id === id);
  }

  // Füge neuen Arzt hinzu
  arztHinzufuegen(arzt: Omit<Arzt, 'id' | 'besuche'>): Arzt {
    const neuerArzt: Arzt = {
      ...arzt,
      id: this.generiereId(),
      besuche: [],
    };

    this.aerzte.update((aerzte) => [...aerzte, neuerArzt]);
    this.speichereInStorage();

    return neuerArzt;
  }

  // Aktualisiere existierenden Arzt
  arztAktualisieren(id: string, updates: Partial<Omit<Arzt, 'id'>>): void {
    this.aerzte.update((aerzte) =>
      aerzte.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
    this.speichereInStorage();
  }

  // Lösche Arzt
  arztLoeschen(id: string): void {
    this.aerzte.update((aerzte) => aerzte.filter((a) => a.id !== id));
    this.speichereInStorage();
  }

  // Füge Besuch zu einem Arzt hinzu
  besuchHinzufuegen(
    arztId: string,
    besuch: Omit<Besuch, 'id'>,
  ): Besuch | null {
    const arzt = this.getArztById(arztId);
    if (!arzt) return null;

    const neuerBesuch: Besuch = {
      ...besuch,
      id: this.generiereId(),
    };

    this.aerzte.update((aerzte) =>
      aerzte.map((a) =>
        a.id === arztId
          ? { ...a, besuche: [...a.besuche, neuerBesuch] }
          : a,
      ),
    );

    this.speichereInStorage();
    return neuerBesuch;
  }

  // Generiere eindeutige ID
  private generiereId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lade Seed-Daten für Demo
  private ladeSeedDaten(): void {
    const seedAerzte: Omit<Arzt, 'id'>[] = [
      // {
      //   name: 'Dr. Maria Huber',
      //   fachrichtung: 'Allgemeinmedizin',
      //   adresse: 'Mariahilfer Straße 88',
      // ss  ort: 'Wien',
      //   bundesland: 'Wien',
      //   lat: 48.2082,
      //   lng: 16.3738,
      //   notizen: 'Sehr aufgeschlossen für neue Präparate',
      //   besuche: [
      //     {
      //       id: this.generiereId(),
      //       datum: new Date(2026, 3, 15).toISOString(),
      //       dauerMinuten: 45,
      //       notiz: 'Produktpräsentation Herz-Kreislauf',
      //     },
      //   ],
      // },...
    ];

    // Füge alle Seed-Ärzte hinzu
    seedAerzte.forEach((arzt) => {
      this.arztHinzufuegen(arzt);
    });
  }
}
