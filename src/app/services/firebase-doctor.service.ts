import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';
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
import { Doctor, Visit, Device } from '../models/doctor.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDoctorService {
  private authService = inject(AuthService);
  private app = initializeApp(environment.firebase);
  private db = getFirestore(this.app);

  // Signal for all doctors
  private doctors = signal<Doctor[]>([]);

  // Public computed signals
  allDoctors = computed(() => this.doctors());

  // Dynamic collection based on authenticated user
  private get doctorsCollection() {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return collection(this.db, `users/${userId}/doctors`);
  }

  private getDoctorRef(doctorId: string) {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return doc(this.db, `users/${userId}/doctors`, doctorId);
  }

  private listenerInitialized = false;

  constructor() {
    // Wait for auth to be ready before initializing listener
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      const isLoading = this.authService.isLoading();

      if (isAuth && !isLoading && !this.listenerInitialized) {
        this.listenerInitialized = true;
        this.initRealtimeListener();
      }
    });
  }

  // Set up real-time listener for doctors collection
  private initRealtimeListener(): void {
    try {
      const userId = this.authService.currentUser()?.uid;
      if (!userId) {
        console.log('No user authenticated, skipping listener initialization');
        return;
      }

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
            })),
            devices: (data['devices'] || []).map((d: any) => ({
              id: d.id,
              name: d.name,
              serialNumber: d.serialNumber,
              loanDate: d.loanDate,
              returnDate: d.returnDate,
              notes: d.notes,
              status: d.status
            }))
          } as Doctor;
        });
        this.doctors.set(doctorsData);
      }, (error) => {
        console.error('Error listening to doctors:', error);
      });
    } catch (error) {
      console.error('Error initializing listener:', error);
    }
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
      const docRef = this.getDoctorRef(id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  }

  // Delete doctor
  async deleteDoctor(id: string): Promise<void> {
    try {
      const docRef = this.getDoctorRef(id);
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
      const docRef = this.getDoctorRef(doctorId);
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

      const docRef = this.getDoctorRef(doctorId);
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

      const docRef = this.getDoctorRef(doctorId);
      await updateDoc(docRef, { visits: updatedVisits });

      return true;
    } catch (error) {
      console.error('Error deleting visit:', error);
      throw error;
    }
  }

  // Generate unique ID (for visits and devices)
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== DEVICE MANAGEMENT =====

  // Add device to a doctor
  async addDevice(doctorId: string, device: Omit<Device, 'id'>): Promise<Device | null> {
    try {
      const doctor = this.getDoctorById(doctorId);
      if (!doctor) return null;

      // Build device without undefined fields
      const newDevice: any = {
        id: this.generateId(),
        name: device.name,
        loanDate: device.loanDate,
        status: 'active'
      };

      // Only add optional fields if they have values
      if (device.serialNumber) {
        newDevice.serialNumber = device.serialNumber;
      }
      if (device.notes) {
        newDevice.notes = device.notes;
      }
      if (device.returnDate) {
        newDevice.returnDate = device.returnDate;
      }

      // Clean existing devices to remove undefined fields
      const cleanedExistingDevices = (doctor.devices || []).map(d => {
        const cleaned: any = {
          id: d.id,
          name: d.name,
          loanDate: d.loanDate,
          status: d.status
        };
        if (d.serialNumber) cleaned.serialNumber = d.serialNumber;
        if (d.notes) cleaned.notes = d.notes;
        if (d.returnDate) cleaned.returnDate = d.returnDate;
        return cleaned;
      });

      const updatedDevices = [...cleanedExistingDevices, newDevice];
      const docRef = this.getDoctorRef(doctorId);
      await updateDoc(docRef, { devices: updatedDevices });

      return newDevice as Device;
    } catch (error) {
      console.error('Error adding device:', error);
      throw error;
    }
  }

  // Update device
  async updateDevice(
    doctorId: string,
    deviceId: string,
    updatedDevice: Partial<Omit<Device, 'id'>>
  ): Promise<boolean> {
    try {
      const doctor = this.getDoctorById(doctorId);
      if (!doctor) return false;

      const updatedDevices = (doctor.devices || []).map((d) => {
        // Clean device to remove undefined fields
        const cleaned: any = {
          id: d.id,
          name: d.name,
          loanDate: d.loanDate,
          status: d.status
        };
        if (d.serialNumber) cleaned.serialNumber = d.serialNumber;
        if (d.notes) cleaned.notes = d.notes;
        if (d.returnDate) cleaned.returnDate = d.returnDate;

        if (d.id === deviceId) {
          // Merge updates without undefined values
          Object.keys(updatedDevice).forEach(key => {
            const value = (updatedDevice as any)[key];
            if (value !== undefined) {
              cleaned[key] = value;
            }
          });
        }
        return cleaned;
      });

      const docRef = this.getDoctorRef(doctorId);
      await updateDoc(docRef, { devices: updatedDevices });

      return true;
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  // Mark device as returned
  async returnDevice(doctorId: string, deviceId: string): Promise<boolean> {
    try {
      return await this.updateDevice(doctorId, deviceId, {
        status: 'returned',
        returnDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error returning device:', error);
      throw error;
    }
  }

  // Delete device
  async deleteDevice(doctorId: string, deviceId: string): Promise<boolean> {
    try {
      const doctor = this.getDoctorById(doctorId);
      if (!doctor) return false;

      // Filter and clean remaining devices
      const updatedDevices = (doctor.devices || [])
        .filter((d) => d.id !== deviceId)
        .map(d => {
          const cleaned: any = {
            id: d.id,
            name: d.name,
            loanDate: d.loanDate,
            status: d.status
          };
          if (d.serialNumber) cleaned.serialNumber = d.serialNumber;
          if (d.notes) cleaned.notes = d.notes;
          if (d.returnDate) cleaned.returnDate = d.returnDate;
          return cleaned;
        });

      const docRef = this.getDoctorRef(doctorId);
      await updateDoc(docRef, { devices: updatedDevices });

      return true;
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
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
