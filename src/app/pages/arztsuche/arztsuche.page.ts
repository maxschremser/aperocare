import { Component, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, addCircleOutline, locationOutline, callOutline, globeOutline, createOutline } from 'ionicons/icons';
import { FirebaseDoctorService } from '../../services/firebase-doctor.service';
import { GooglePlacesService, PlaceResult } from '../../services/google-places.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { DoctorFormModal } from '../../modals/doctor-form/doctor-form.modal';

interface SearchDoctor {
  id: string;
  name: string;
  specialty?: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  source: 'google';
}

@Component({
  selector: 'app-arztsuche',
  templateUrl: 'arztsuche.page.html',
  styleUrls: ['arztsuche.page.css'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    IonSelect,
    IonSelectOption,
    IonChip,
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class ArztsuchePage implements AfterViewInit {
  searchQuery = signal('');
  selectedSpecialty = signal('');

  searchResults = signal<SearchDoctor[]>([]);
  isLoading = signal(false);
  hasSearched = signal(false);

  protected doctorService!: FirebaseDoctorService;

  specialties = computed(() => this.settingsService.specialties());

  constructor(
    doctorService: FirebaseDoctorService,
    private settingsService: UserSettingsService,
    private googlePlacesService: GooglePlacesService,
    private modalController: ModalController
  ) {
    this.doctorService = doctorService;
    addIcons({ searchOutline, addCircleOutline, locationOutline, callOutline, globeOutline, createOutline });
  }

  ngAfterViewInit() {
    // Load Google Maps API in background
    this.googlePlacesService.loadGoogleMapsApi().catch(err => {
      console.error('Failed to load Google Maps API:', err);
    });
  }

  async onSearch() {
    const query = this.searchQuery().trim();
    const specialty = this.selectedSpecialty();

    if (!query) {
      alert('Bitte geben Sie einen Suchbegriff ein.');
      return;
    }

    this.isLoading.set(true);
    this.hasSearched.set(true);

    try {
      let results: PlaceResult[] = [];

      // Text search
      results = await this.googlePlacesService.searchDoctorsByText(query);

      // Filter by specialty if selected
      if (specialty) {
        results = results.filter(r =>
          r.name?.toLowerCase().includes(specialty.toLowerCase())
        );
      }

      // Convert to SearchDoctor format
      const doctors: SearchDoctor[] = results.map(result => ({
        id: result.placeId,
        name: result.name,
        specialty: this.guessSpecialtyFromName(result.name) || 'Allgemeinmedizin',
        address: result.address,
        city: result.city,
        lat: result.lat,
        lng: result.lng,
        phone: result.phone,
        website: result.website,
        source: 'google' as const
      }));

      this.searchResults.set(doctors);

      if (doctors.length === 0) {
        alert('Keine Ärzte gefunden. Versuchen Sie eine andere Suche.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      const errorMessage = error?.message || 'Fehler bei der Suche. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';
      alert(errorMessage);
      this.searchResults.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private guessSpecialtyFromName(name: string): string | undefined {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('allgemein')) return 'Allgemeinmedizin';
    if (nameLower.includes('zahnarzt') || nameLower.includes('dental')) return 'Zahnmedizin';
    if (nameLower.includes('frauenarzt') || nameLower.includes('gynäko')) return 'Gynäkologie';
    if (nameLower.includes('hautarzt') || nameLower.includes('dermat')) return 'Dermatologie';
    if (nameLower.includes('kinderarzt') || nameLower.includes('pädiat')) return 'Pädiatrie';
    if (nameLower.includes('augenarzt') || nameLower.includes('augen')) return 'Augenheilkunde';
    if (nameLower.includes('hno')) return 'HNO';
    if (nameLower.includes('orthopäd')) return 'Orthopädie';
    if (nameLower.includes('kardio')) return 'Kardiologie';
    if (nameLower.includes('neurolog')) return 'Neurologie';
    if (nameLower.includes('psychiater') || nameLower.includes('psychiatr')) return 'Psychiatrie';
    if (nameLower.includes('urolog')) return 'Urologie';
    if (nameLower.includes('innere')) return 'Innere Medizin';

    return undefined;
  }

  onQueryChange(event: any) {
    this.searchQuery.set(event.target.value || '');
  }

  onSpecialtyChange(event: any) {
    this.selectedSpecialty.set(event.detail.value);
  }

  addDoctor(doctor: SearchDoctor) {
    // Check if doctor already exists
    const existingDoctors = this.doctorService.allDoctors();
    const exists = existingDoctors.find(d =>
      d.name === doctor.name &&
      d.city === doctor.city
    );

    if (exists) {
      alert('Dieser Arzt ist bereits in Ihrer Liste!');
      return;
    }

    // Add doctor - build data without undefined fields
    const doctorData: any = {
      name: doctor.name,
      specialty: doctor.specialty || 'Allgemeinmedizin',
      address: doctor.address,
      city: doctor.city,
      lat: doctor.lat,
      lng: doctor.lng,
      notes: ''
    };

    // Only add optional fields if they have values
    if (doctor.phone) {
      doctorData.telephone = doctor.phone;
    }
    if (doctor.website) {
      doctorData.website = doctor.website;
    }

    this.doctorService.addDoctor(doctorData);

    alert(`${doctor.name} wurde hinzugefügt!`);
  }

  isDoctorAdded(doctor: SearchDoctor): boolean {
    const existingDoctors = this.doctorService.allDoctors();
    return existingDoctors.some(d =>
      d.name === doctor.name &&
      d.city === doctor.city
    );
  }

  async editDoctor(doctor: SearchDoctor) {
    // Find the actual doctor in the service
    const existingDoctors = this.doctorService.allDoctors();
    const existingDoctor = existingDoctors.find(d =>
      d.name === doctor.name &&
      d.city === doctor.city
    );

    if (!existingDoctor) {
      alert('Arzt wurde nicht gefunden.');
      return;
    }

    const modal = await this.modalController.create({
      component: DoctorFormModal,
      componentProps: {
        doctor: existingDoctor,
        mode: 'edit'
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.saved || data?.deleted) {
      // Optionally refresh search results or show a message
      console.log('Doctor updated or deleted');
    }
  }
}
