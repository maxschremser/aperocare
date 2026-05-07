import { Component } from '@angular/core';
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
  trashOutline
} from 'ionicons/icons';

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
  appVersion = '1.0.2';

  constructor(private router: Router) {
    addIcons({
      statsChartOutline,
      searchOutline,
      downloadOutline,
      shareSocialOutline,
      moonOutline,
      informationCircleOutline,
      chevronForwardOutline,
      trashOutline
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  exportData() {
    const data = localStorage.getItem('arztmap-austria-doctors');
    if (!data) {
      alert('Keine Daten zum Exportieren vorhanden.');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aperocare-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result);
          localStorage.setItem('arztmap-austria-doctors', JSON.stringify(data));
          alert('Daten erfolgreich importiert! Die Seite wird neu geladen.');
          window.location.reload();
        } catch (error) {
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

  clearAllData() {
    if (confirm('Möchten Sie wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      localStorage.removeItem('arztmap-austria-doctors');
      localStorage.removeItem('arztmap-austria-aerzte');
      alert('Alle Daten wurden gelöscht. Die App wird neu geladen.');
      window.location.reload();
    }
  }
}
