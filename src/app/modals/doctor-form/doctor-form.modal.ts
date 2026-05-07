import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSearchbar,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, trashOutline, searchOutline, arrowForwardOutline } from 'ionicons/icons';
import { DoctorService } from '../../services/doctor.service';
import { GeocodingService } from '../../services/geocoding.service';
import { OverpassService } from '../../services/overpass.service';
import { Doctor, SPECIALTIES, VIENNA_DISTRICTS } from '../../models/doctor.model';

interface SearchResult {
  id: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone?: string;
}

@Component({
  selector: 'app-doctor-form',
  templateUrl: 'doctor-form.modal.html',
  styleUrls: ['doctor-form.modal.css'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSearchbar
  ]
})
export class DoctorFormModal {
  @Input() doctor?: Doctor; // If provided, we're editing
  @Input() mode: 'add' | 'edit' = 'add';

  // Form fields
  name = signal('');
  specialty = signal('');
  address = signal('');
  city = signal('');
  district = signal('');
  telephone = signal('');
  website = signal('');
  notes = signal('');
  lat = signal(0);
  lng = signal(0);

  specialties = SPECIALTIES;
  viennaDistricts = VIENNA_DISTRICTS;

  isGeocoding = signal(false);
  isSaving = signal(false);

  // Search functionality
  searchQuery = signal('');
  searchResults = signal<SearchResult[]>([]);
  isSearching = signal(false);
  hasSearched = signal(false);

  constructor(
    private modalController: ModalController,
    private doctorService: DoctorService,
    private geocodingService: GeocodingService,
    private overpassService: OverpassService
  ) {
    addIcons({ closeOutline, saveOutline, trashOutline, searchOutline, arrowForwardOutline });
  }

  ngOnInit() {
    if (this.doctor) {
      // Pre-fill form with existing doctor data
      this.name.set(this.doctor.name);
      this.specialty.set(this.doctor.specialty);
      this.address.set(this.doctor.address);
      this.city.set(this.doctor.city);
      this.district.set(this.doctor.district || '');
      this.telephone.set(this.doctor.telephone || '');
      this.website.set(this.doctor.website || '');
      this.notes.set(this.doctor.notes);
      this.lat.set(this.doctor.lat);
      this.lng.set(this.doctor.lng);
    }
  }

  get isViennaSelected(): boolean {
    return this.city().toLowerCase() === 'wien';
  }

  get canSave(): boolean {
    return !!(
      this.name() &&
      this.specialty() &&
      this.city()
    );
  }

  async geocodeAddress() {
    if (!this.address() || !this.city()) {
      alert('Bitte füllen Sie Adresse und Ort aus.');
      return;
    }

    this.isGeocoding.set(true);

    try {
      const result = await this.geocodingService.geocodeAdresse(
        this.address(),
        this.city(),
        'Austria'
      );

      if (result) {
        this.lat.set(result.lat);
        this.lng.set(result.lng);
        alert('Koordinaten erfolgreich ermittelt!');
      } else {
        alert('Adresse konnte nicht gefunden werden. Bitte überprüfen Sie die Eingabe.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Fehler beim Ermitteln der Koordinaten.');
    } finally {
      this.isGeocoding.set(false);
    }
  }

  async save() {
    if (!this.canSave) return;

    this.isSaving.set(true);

    try {
      // Use default coordinates (0, 0) if not set
      const lat = this.lat() !== 0 ? this.lat() : 0;
      const lng = this.lng() !== 0 ? this.lng() : 0;

      if (this.mode === 'edit' && this.doctor) {
        // Update existing doctor
        this.doctorService.updateDoctor(this.doctor.id, {
          name: this.name(),
          specialty: this.specialty(),
          address: this.address(),
          city: this.city(),
          district: this.district() || undefined,
          telephone: this.telephone() || undefined,
          website: this.website() || undefined,
          notes: this.notes(),
          lat: lat,
          lng: lng
        });
      } else {
        // Add new doctor
        this.doctorService.addDoctor({
          name: this.name(),
          specialty: this.specialty(),
          address: this.address(),
          city: this.city(),
          district: this.district() || undefined,
          telephone: this.telephone() || undefined,
          website: this.website() || undefined,
          notes: this.notes(),
          lat: lat,
          lng: lng
        });
      }

      await this.modalController.dismiss({ saved: true });
    } catch (error) {
      console.error('Save error:', error);
      alert('Fehler beim Speichern.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteDoctor() {
    if (!this.doctor) return;

    const confirmed = confirm(`Möchten Sie ${this.doctor.name} wirklich löschen?`);
    if (!confirmed) return;

    try {
      this.doctorService.deleteDoctor(this.doctor.id);
      await this.modalController.dismiss({ deleted: true });
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen.');
    }
  }

  async close() {
    await this.modalController.dismiss();
  }

  onNameChange(event: any) {
    this.name.set(event.target.value || '');
  }

  onSpecialtyChange(event: any) {
    this.specialty.set(event.detail.value);
  }

  onAddressChange(event: any) {
    this.address.set(event.target.value || '');
  }

  onCityChange(event: any) {
    this.city.set(event.target.value || '');
  }

  onDistrictChange(event: any) {
    this.district.set(event.detail.value);
  }

  onNotesChange(event: any) {
    this.notes.set(event.target.value || '');
  }

  onTelephoneChange(event: any) {
    this.telephone.set(event.target.value || '');
  }

  onWebsiteChange(event: any) {
    this.website.set(event.target.value || '');
  }

  onSearchQueryChange(event: any) {
    this.searchQuery.set(event.target.value || '');
  }

  async performSearch() {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.isSearching.set(true);
    this.hasSearched.set(true);

    try {
      // Call REAL Overpass API
      const results = await this.overpassService.sucheAerzteInStadt(query);

      // Map to SearchResult format
      const mappedResults: SearchResult[] = results.map(arzt => ({
        id: arzt.id.toString(),
        name: arzt.name,
        specialty: arzt.fachrichtung || 'Allgemeinmedizin',
        address: arzt.adresse || '',
        city: arzt.ort || query,
        lat: arzt.lat,
        lng: arzt.lng,
        phone: arzt.telefon
      }));

      this.searchResults.set(mappedResults);

      if (mappedResults.length === 0) {
        alert('Keine Ärzte in dieser Stadt gefunden. Versuchen Sie eine andere Stadt.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Fehler bei der Suche. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    } finally {
      this.isSearching.set(false);
    }
  }

  selectSearchResult(result: SearchResult) {
    // Pre-fill form with selected result
    this.name.set(result.name);
    this.specialty.set(result.specialty);
    this.address.set(result.address);
    this.city.set(result.city);
    this.lat.set(result.lat);
    this.lng.set(result.lng);

    if (result.phone) {
      this.telephone.set(result.phone);
    }

    // Clear search results
    this.searchResults.set([]);
    this.searchQuery.set('');
    this.hasSearched.set(false);

    // Show success message
    alert(`Daten von ${result.name} übernommen!`);
  }
}
