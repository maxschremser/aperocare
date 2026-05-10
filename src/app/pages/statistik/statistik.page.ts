import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  checkmarkCircleOutline,
  warningOutline,
  alertCircleOutline,
  mapOutline,
  calendarOutline,
  timeOutline
} from 'ionicons/icons';
import { FirebaseDoctorService } from '../../services/firebase-doctor.service';
import { getVisitStatus, getLastVisit } from '../../models/doctor.model';

@Component({
  selector: 'app-statistik',
  templateUrl: 'statistik.page.html',
  styleUrls: ['statistik.page.css'],
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
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class StatistikPage {
  protected doctorService!: FirebaseDoctorService;

  allDoctors = computed(() => this.doctorService.allDoctors());

  // Overview statistics
  totalDoctors = computed(() => this.allDoctors().length);
  currentDoctors = computed(() =>
    this.allDoctors().filter(d => getVisitStatus(getLastVisit(d)) === 'current').length
  );
  dueSoonDoctors = computed(() =>
    this.allDoctors().filter(d => getVisitStatus(getLastVisit(d)) === 'due-soon').length
  );
  overdueDoctors = computed(() =>
    this.allDoctors().filter(d => getVisitStatus(getLastVisit(d)) === 'overdue').length
  );

  // Visit statistics
  totalVisits = computed(() =>
    this.allDoctors().reduce((sum, d) => sum + d.visits.length, 0)
  );
  averageVisitsPerDoctor = computed(() => {
    const total = this.totalDoctors();
    return total > 0 ? (this.totalVisits() / total).toFixed(1) : '0';
  });

  // Doctors by city
  doctorsByCity = computed(() => {
    const byCity = new Map<string, number>();
    this.allDoctors().forEach(d => {
      byCity.set(d.city, (byCity.get(d.city) || 0) + 1);
    });
    return Array.from(byCity.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 cities
  });

  // Doctors by specialty
  doctorsBySpecialty = computed(() => {
    const bySpecialty = new Map<string, number>();
    this.allDoctors().forEach(d => {
      bySpecialty.set(d.specialty, (bySpecialty.get(d.specialty) || 0) + 1);
    });
    return Array.from(bySpecialty.entries())
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count);
  });

  // Recent visits
  recentVisits = computed(() => {
    const visits: Array<{
      doctorName: string;
      date: Date;
      note: string;
      durationMinutes: number;
    }> = [];

    this.allDoctors().forEach(doctor => {
      doctor.visits.forEach(visit => {
        visits.push({
          doctorName: doctor.name,
          date: new Date(visit.date),
          note: visit.note,
          durationMinutes: visit.durationMinutes
        });
      });
    });

    return visits
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  });

  constructor(doctorService: FirebaseDoctorService) {
    this.doctorService = doctorService;
    addIcons({
      peopleOutline,
      checkmarkCircleOutline,
      warningOutline,
      alertCircleOutline,
      mapOutline,
      calendarOutline,
      timeOutline
    });
  }

  getPercentage(value: number): number {
    const total = this.totalDoctors();
    return total > 0 ? Math.round((value / total) * 100) : 0;
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
}
