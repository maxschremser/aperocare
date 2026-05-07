import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  mapOutline,
  searchOutline,
  statsChartOutline,
  listOutline,
  calendarOutline,
  warningOutline,
  checkmarkCircleOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { DoctorService } from '../../services/doctor.service';
import { getVisitStatus, getLastVisit } from '../../models/doctor.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.css'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonBadge
  ]
})
export class HomePage {
  protected doctorService!: DoctorService;

  allDoctors = computed(() => this.doctorService.allDoctors());

  totalDoctors = computed(() => this.allDoctors().length);

  overdueDoctors = computed(() =>
    this.allDoctors().filter(d => getVisitStatus(getLastVisit(d)) === 'overdue')
  );

  dueSoonDoctors = computed(() =>
    this.allDoctors().filter(d => getVisitStatus(getLastVisit(d)) === 'due-soon')
  );

  recentVisits = computed(() => {
    const visits: Array<{
      doctorId: string;
      doctorName: string;
      doctorSpecialty: string;
      date: Date;
      note: string;
    }> = [];

    this.allDoctors().forEach(doctor => {
      doctor.visits.forEach(visit => {
        visits.push({
          doctorId: doctor.id,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialty,
          date: new Date(visit.date),
          note: visit.note || ''
        });
      });
    });

    return visits
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3);
  });

  todaysVisits = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visits: Array<{
      doctorId: string;
      doctorName: string;
      doctorSpecialty: string;
      date: Date;
      note: string;
    }> = [];

    this.allDoctors().forEach(doctor => {
      doctor.visits.forEach(visit => {
        const visitDate = new Date(visit.date);
        if (visitDate >= today && visitDate < tomorrow) {
          visits.push({
            doctorId: doctor.id,
            doctorName: doctor.name,
            doctorSpecialty: doctor.specialty,
            date: visitDate,
            note: visit.note || ''
          });
        }
      });
    });

    return visits.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  futureVisits = computed(() => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visits: Array<{
      doctorId: string;
      doctorName: string;
      doctorSpecialty: string;
      date: Date;
      note: string;
    }> = [];

    this.allDoctors().forEach(doctor => {
      doctor.visits.forEach(visit => {
        const visitDate = new Date(visit.date);
        if (visitDate >= tomorrow) {
          visits.push({
            doctorId: doctor.id,
            doctorName: doctor.name,
            doctorSpecialty: doctor.specialty,
            date: visitDate,
            note: visit.note || ''
          });
        }
      });
    });

    return visits.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  });

  constructor(
    doctorService: DoctorService,
    private router: Router
  ) {
    this.doctorService = doctorService;
    addIcons({
      addCircleOutline,
      mapOutline,
      searchOutline,
      statsChartOutline,
      listOutline,
      calendarOutline,
      warningOutline,
      checkmarkCircleOutline,
      chevronForwardOutline
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  navigateToDoctor(doctorId: string) {
    this.router.navigate(['/doctor', doctorId]);
  }

  formatDate(date: Date): string {
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;

    return date.toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatFutureDate(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const visitDate = new Date(date);
    visitDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((visitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Morgen';
    if (diffDays < 7) return `In ${diffDays} Tagen`;

    return date.toLocaleDateString('de-AT', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('de-AT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }
}
