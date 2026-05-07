import { Injectable, signal, computed } from '@angular/core';
import {
  Doctor,
  Visit,
  getVisitStatus,
  getLastVisit,
} from '../models/doctor.model';

// Service for doctor management with LocalStorage persistence
@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private readonly STORAGE_KEY = 'arztmap-austria-doctors';

  // Signal for all doctors
  private doctors = signal<Doctor[]>([]);

  // Public computed signals
  allDoctors = computed(() => this.doctors());

  // Doctors grouped by status
  currentDoctors = computed(() =>
    this.doctors().filter(
      (d) => getVisitStatus(getLastVisit(d)) === 'current',
    ),
  );

  dueSoonDoctors = computed(() =>
    this.doctors().filter(
      (d) => getVisitStatus(getLastVisit(d)) === 'due-soon',
    ),
  );

  overdueDoctors = computed(() =>
    this.doctors().filter(
      (d) => getVisitStatus(getLastVisit(d)) === 'overdue',
    ),
  );

  constructor() {
    this.loadFromStorage();
    // If no data available, load seed data
    if (this.doctors().length === 0) {
      this.loadSeedData();
    }
  }

  // Load doctors from LocalStorage
  private loadFromStorage(): void {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        this.doctors.set(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Save doctors to LocalStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.doctors()));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Get a doctor by ID
  getDoctorById(id: string): Doctor | undefined {
    return this.doctors().find((d) => d.id === id);
  }

  // Add new doctor
  addDoctor(doctor: Omit<Doctor, 'id' | 'visits'>): Doctor {
    const newDoctor: Doctor = {
      ...doctor,
      id: this.generateId(),
      visits: [],
    };

    this.doctors.update((doctors) => [...doctors, newDoctor]);
    this.saveToStorage();

    return newDoctor;
  }

  // Update existing doctor
  updateDoctor(id: string, updates: Partial<Omit<Doctor, 'id'>>): void {
    this.doctors.update((doctors) =>
      doctors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
    this.saveToStorage();
  }

  // Delete doctor
  deleteDoctor(id: string): void {
    this.doctors.update((doctors) => doctors.filter((d) => d.id !== id));
    this.saveToStorage();
  }

  // Add visit to a doctor
  addVisit(
    doctorId: string,
    visit: Omit<Visit, 'id'>,
  ): Visit | null {
    const doctor = this.getDoctorById(doctorId);
    if (!doctor) return null;

    const newVisit: Visit = {
      ...visit,
      id: this.generateId(),
    };

    this.doctors.update((doctors) =>
      doctors.map((d) =>
        d.id === doctorId
          ? { ...d, visits: [...d.visits, newVisit] }
          : d,
      ),
    );

    this.saveToStorage();
    return newVisit;
  }

  // Update visit
  updateVisit(
    doctorId: string,
    visitDate: string,
    updatedVisit: Omit<Visit, 'id'>
  ): boolean {
    const doctor = this.getDoctorById(doctorId);
    if (!doctor) return false;

    this.doctors.update((doctors) =>
      doctors.map((d) =>
        d.id === doctorId
          ? {
              ...d,
              visits: d.visits.map((v) =>
                v.date === visitDate
                  ? { ...v, ...updatedVisit }
                  : v
              ),
            }
          : d
      )
    );

    this.saveToStorage();
    return true;
  }

  // Delete visit
  deleteVisit(doctorId: string, visitDate: string): boolean {
    const doctor = this.getDoctorById(doctorId);
    if (!doctor) return false;

    this.doctors.update((doctors) =>
      doctors.map((d) =>
        d.id === doctorId
          ? { ...d, visits: d.visits.filter((v) => v.date !== visitDate) }
          : d
      )
    );

    this.saveToStorage();
    return true;
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load seed data for demo
  private loadSeedData(): void {
    const seedDoctors: Omit<Doctor, 'id'>[] = [
    //   {
    //     name: 'Dr. Maria Huber',
    //     specialty: 'Allgemeinmedizin',
    //     address: 'Mariahilfer Straße 88',
    //     city: 'Wien',
    //     state: 'Wien',
    //     lat: 48.2082,
    //     lng: 16.3738,
    //     notes: 'Sehr aufgeschlossen für neue Präparate',
    //     visits: [
    //       {
    //         id: this.generateId(),
    //         date: new Date(2026, 3, 15).toISOString(),
    //         durationMinutes: 45,
    //         note: 'Produktpräsentation Herz-Kreislauf',
    //       },
    //     ],
    //   },...
    ];

    // Add all seed doctors
    seedDoctors.forEach((doctor) => {
      this.addDoctor(doctor);
    });
  }
}
