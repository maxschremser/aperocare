import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonNote,
  IonListHeader
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  statsChartOutline,
  searchOutline,
  downloadOutline,
  shareSocialOutline,
  moonOutline,
  informationCircleOutline,
  chevronForwardOutline,
  trashOutline,
  logOutOutline,
  cloudUploadOutline,
  listOutline,
  hardwareChipOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { FirebaseDoctorService } from '../../services/firebase-doctor.service';
import { Doctor } from '../../models/doctor.model';
import { ModalController } from '@ionic/angular/standalone';
import { SpecialtiesEditModal } from '../../modals/specialties-edit/specialties-edit.modal';
import { DevicesEditModal } from '../../modals/devices-edit/devices-edit.modal';

@Component({
  selector: 'app-more',
  templateUrl: 'more.page.html',
  styleUrls: ['more.page.css'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonNote,
    IonListHeader
  ]
})
export class MorePage {
  appVersion = '1.5.0';
  private authService = inject(AuthService);
  private router = inject(Router);
  private firebaseDoctorService = inject(FirebaseDoctorService);
  private modalController = inject(ModalController);

  currentUser = this.authService.currentUser;

  constructor() {
    addIcons({
      statsChartOutline,
      searchOutline,
      downloadOutline,
      shareSocialOutline,
      moonOutline,
      informationCircleOutline,
      chevronForwardOutline,
      trashOutline,
      logOutOutline,
      cloudUploadOutline,
      listOutline,
      hardwareChipOutline
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  exportData() {
    const doctors = this.firebaseDoctorService.allDoctors();

    if (!doctors || doctors.length === 0) {
      alert('Keine Daten zum Exportieren vorhanden.');
      return;
    }

    const data = JSON.stringify(doctors, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aperocare-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event: any) => {
        try {
          const data: Doctor[] = JSON.parse(event.target.result);

          if (!Array.isArray(data) || data.length === 0) {
            alert('Die Datei enthält keine gültigen Daten.');
            return;
          }

          const confirmed = confirm(
            `${data.length} Ärzte in der Datei gefunden. ` +
            `Diese werden zu Ihrem Cloud-Konto hinzugefügt. Fortfahren?`
          );

          if (!confirmed) return;

          await this.firebaseDoctorService.importFromLocalStorage(data);
          alert('Daten erfolgreich zu Firestore importiert!');
        } catch (error) {
          console.error('Import error:', error);
          alert('Fehler beim Importieren der Daten. Bitte überprüfen Sie die Datei.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  }

  shareApp() {
    if (navigator.share) {
      navigator.share({
        title: 'aperoCare - Arzt Besuchsmanager',
        text: 'Verwalte deine Arztbesuche mit aperoCare!',
        url: window.location.origin
      });
    } else {
      alert('Teilen wird von diesem Browser nicht unterstützt.');
    }
  }

  async migrateToFirestore() {
    const localData = localStorage.getItem('arztmap-austria-doctors');
    if (!localData) {
      alert('Keine lokalen Daten zum Migrieren gefunden.');
      return;
    }

    try {
      const doctors: Doctor[] = JSON.parse(localData);
      if (doctors.length === 0) {
        alert('Keine Ärzte zum Migrieren vorhanden.');
        return;
      }

      const confirmed = confirm(
        `${doctors.length} Ärzte aus dem lokalen Speicher gefunden. ` +
        `Diese werden zu Ihrem Cloud-Konto hinzugefügt. Fortfahren?`
      );

      if (!confirmed) return;

      await this.firebaseDoctorService.importFromLocalStorage(doctors);

      // Ask if user wants to clear localStorage after successful migration
      const clearLocal = confirm(
        'Migration erfolgreich! Möchten Sie die lokalen Daten jetzt löschen?'
      );

      if (clearLocal) {
        localStorage.removeItem('arztmap-austria-doctors');
        localStorage.removeItem('arztmap-austria-aerzte');
      }

      alert('Migration abgeschlossen!');
    } catch (error) {
      console.error('Migration error:', error);
      alert('Fehler bei der Migration. Bitte versuchen Sie es erneut.');
    }
  }

  clearAllData() {
    if (confirm('Möchten Sie wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      localStorage.removeItem('arztmap-austria-doctors');
      localStorage.removeItem('arztmap-austria-aerzte');
      alert('Alle Daten wurden gelöscht. Die App wird neu geladen.');
      window.location.reload();
    }
  }

  async editSpecialties() {
    const modal = await this.modalController.create({
      component: SpecialtiesEditModal
    });

    await modal.present();
  }

  async editDevices() {
    const modal = await this.modalController.create({
      component: DevicesEditModal
    });

    await modal.present();
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
