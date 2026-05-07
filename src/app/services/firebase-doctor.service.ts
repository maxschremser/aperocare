import { Injectable, signal, computed } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { Doctor, Visit } from '../models/doctor.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDoctorService {
  private app = initializeApp(environment.firebase);
  private db = getFirestore(this.app);
  private doctorsCollection = collection(this.db, 'doctors');

  // Signal for all doctors
  private doctors = signal<Doctor[]>([]);

  // Public computed signals
  allDoctors = computed(() => this.doctors());

  constructor() {
    this.initRealtimeListener();
  }

  // Set up real-time listener for doctors collection
  private initRealtimeListener(): void {
    onSnapshot(this.doctorsCollection, (snapshot: QuerySnapshot<DocumentData>) => {
      const doctorsData: Doctor[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data['name'],
          specialty: data['specialty'],
          address: data['address'],
          city: data['city'],
          state: data['state'],
          district: data['district'],
          lat: data['lat'],
          lng: data['lng'],
          telephone: data['telephone'],
          website: data['website'],
          notes: data['notes'],
          visits: (data['visits'] || []).map((v: any) => ({
            id: v.id,
            date: v.date,
            durationMinutes: v.durationMinutes,
            note: v.note
          }))
        } as Doctor;
      });
      this.doctors.set(doctorsData);
    }, (error) => {
      console.error('Error listening to doctors:', error);
    });
  }

  // Get a doctor by ID
  getDoctorById(id: string): Doctor | undefined {
    return this.doctors().find((d) => d.id === id);
  }

  // Add new doctor
  async addDoctor(doctor: Omit<Doctor, 'id' | 'visits'>): Promise<Doctor> {
    try {
      const newDoctor = {
        ...doctor,
        visits: []
      };

      const docRef = await addDoc(this.doctorsCollection, newDoctor);

      return {
        ...newDoctor,
        id: docRef.id
      } as Doctor;
    } catch (error) {
      console.error('Error adding doctor:', error);
      throw error;
    }
  }

  // Update existing doctor
  async updateDoctor(id: string, updates: Partial<Omit<Doctor, 'id'>>): Promise<void> {
    try {
      const docRef = doc(this.db, 'doctors', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  }

  // Delete doctor
  async deleteDoctor(id: string): Promise<void> {
    try {
      const docRef = doc(this.db, 'doctors', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  }

  // Add visit to a doctor
  async addVisit(doctorId: string, visit: Omit<Visit, 'id'>): Promise<Visit | null> {
    try {
      const doctor = this.getDoctorById(doctorId);
      if (!doctor) return null;

      const newVisit: Visit = {
        ...visit,
        id: this.generateId(),
      };

      const updatedVisits = [...doctor.visits, newVisit];
      const docRef = doc(this.db, 'doctors', doctorId);
      await updateDoc(docRef, { visits: updatedVisits });

      return newVisit;
    } catch (error) {
      console.error('Error adding visit:', error);
      throw error;
    }
  }

  // Update visit
  async updateVisit(
    doctorId: string,
    visitDate: string,
    updatedVisit: Omit<Visit, 'id'>
  ): Promise<boolean> {
    try {
      const doctor = this.getDoctorById(doctorId);
      if (!doctor) return false;

      const updatedVisits = doctor.visits.map((v) =>
        v.date === visitDate ? { ...v, ...updatedVisit } : v
      );

      const docRef = doc(this.db, 'doctors', doctorId);
      await updateDoc(docRef, { visits: updatedVisits });

      return true;
    } catch (error) {
      console.error('Error updating visit:', error);
      throw error;
    }
  }

  // Delete visit
  async deleteVisit(doctorId: string, visitDate: string): Promise<boolean> {
    try {
      const doctor = this.getDoctorById(doctorId);
      if (!doctor) return false;

      const updatedVisits = doctor.visits.filter((v) => v.date !== visitDate);

      const docRef = doc(this.db, 'doctors', doctorId);
      await updateDoc(docRef, { visits: updatedVisits });

      return true;
    } catch (error) {
      console.error('Error deleting visit:', error);
      throw error;
    }
  }

  // Generate unique ID (for visits)
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Migration helper: Import data from localStorage
  async importFromLocalStorage(doctors: Doctor[]): Promise<void> {
    try {
      console.log('Importing doctors to Firebase...');
      for (const doctor of doctors) {
        const { id, ...doctorData } = doctor;
        await addDoc(this.doctorsCollection, doctorData);
      }
      console.log('Import completed!');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}
