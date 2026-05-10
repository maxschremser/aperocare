// Datenmodell für einen Arzt
export interface Arzt {
  id: string;
  name: string;
  fachrichtung: string;
  adresse: string;
  ort: string;
  bezirk?: string; // Optional: Bezirk für Wien (z.B. "1010", "1020", etc.)
  lat: number;
  lng: number;
  notizen: string;
  besuche: Besuch[];
}

// Datenmodell für einen Besuch
export interface Besuch {
  id: string;
  datum: string; // ISO Date
  dauerMinuten: number;
  notiz: string;
}

// Fachrichtungen für Dropdown
export const FACHRICHTUNGEN = [
  'Allgemeinmediziner',
  'Kinderarzt',
  'Dermatologe',
  'Gynäkologe',
  'HNO',
  'Pulmologe',
  'Chirurgie',
] as const;

export const GERAETE = [
  'FeNO',
  'RP-Check',
  'Minibox',
  'AirFeel',
  'AirFeel IMT',
  'Hygienebox',
  'Saalio',
  'Saalux',
  'Trevolux'
] as const;

// Wiener Bezirke
export const WIENER_BEZIRKE = [
  { code: '1010', name: '1. Innere Stadt' },
  { code: '1020', name: '2. Leopoldstadt' },
  { code: '1030', name: '3. Landstraße' },
  { code: '1040', name: '4. Wieden' },
  { code: '1050', name: '5. Margareten' },
  { code: '1060', name: '6. Mariahilf' },
  { code: '1070', name: '7. Neubau' },
  { code: '1080', name: '8. Josefstadt' },
  { code: '1090', name: '9. Alsergrund' },
  { code: '1100', name: '10. Favoriten' },
  { code: '1110', name: '11. Simmering' },
  { code: '1120', name: '12. Meidling' },
  { code: '1130', name: '13. Hietzing' },
  { code: '1140', name: '14. Penzing' },
  { code: '1150', name: '15. Rudolfsheim-Fünfhaus' },
  { code: '1160', name: '16. Ottakring' },
  { code: '1170', name: '17. Hernals' },
  { code: '1180', name: '18. Währing' },
  { code: '1190', name: '19. Döbling' },
  { code: '1200', name: '20. Brigittenau' },
  { code: '1210', name: '21. Floridsdorf' },
  { code: '1220', name: '22. Donaustadt' },
  { code: '1230', name: '23. Liesing' },
] as const;

// Besuchsstatus basierend auf letztem Besuch
export type BesuchsStatus = 'aktuell' | 'bald-faellig' | 'ueberfaellig';

// Hilfsfunktion: Berechne Status basierend auf letztem Besuch
export function getBesuchsStatus(letzterBesuch: Date | null): BesuchsStatus {
  if (!letzterBesuch) return 'ueberfaellig';

  const heute = new Date();
  const diffTage = Math.floor(
    (heute.getTime() - letzterBesuch.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffTage <= 30) return 'aktuell';
  if (diffTage <= 90) return 'bald-faellig';
  return 'ueberfaellig';
}

// Hilfsfunktion: Hole letzten Besuch eines Arztes
export function getLetzterBesuch(arzt: Arzt): Date | null {
  if (arzt.besuche.length === 0) return null;

  const sortiert = [...arzt.besuche].sort(
    (a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime(),
  );

  return new Date(sortiert[0].datum);
}
