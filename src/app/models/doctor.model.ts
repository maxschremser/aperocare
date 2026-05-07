// Data model for a doctor
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  district?: string; // Optional: District for Vienna (e.g. "1010", "1020", etc.)
  lat: number;
  lng: number;
  telephone?: string; // Optional: Phone number
  website?: string; // Optional: Website URL
  notes: string;
  visits: Visit[];
}

// Data model for a visit
export interface Visit {
  id: string;
  date: string; // ISO Date
  durationMinutes: number;
  note: string;
}

// Specialties for dropdown
export const SPECIALTIES = [
  'Allgemeinmedizin',
  'Innere Medizin',
  'Gynäkologie',
  'Kardiologie',
  'Dermatologie',
  'Orthopädie',
  'Neurologie',
  'Psychiatrie',
  'Pädiatrie',
  'Urologie',
  'HNO',
  'Augenheilkunde',
  'Radiologie',
  'Anästhesiologie',
  'Chirurgie',
] as const;

// Vienna districts
export const VIENNA_DISTRICTS = [
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

// Visit status based on last visit
export type VisitStatus = 'current' | 'due-soon' | 'overdue';

// Helper function: Calculate status based on last visit
export function getVisitStatus(lastVisit: Date | null): VisitStatus {
  if (!lastVisit) return 'overdue';

  const today = new Date();
  const diffDays = Math.floor(
    (today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 30) return 'current';
  if (diffDays <= 90) return 'due-soon';
  return 'overdue';
}

// Helper function: Get last visit of a doctor
export function getLastVisit(doctor: Doctor): Date | null {
  if (doctor.visits.length === 0) return null;

  const sorted = [...doctor.visits].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return new Date(sorted[0].date);
}
