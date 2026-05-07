import { Component, computed, signal } from '@angular/core';
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
  IonNote,
  IonBadge,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  callOutline,
  locationOutline,
  timeOutline,
  addOutline,
  personAddOutline,
  trashOutline,
  createOutline,
  calendarOutline,
  globeOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { DoctorService } from '../../services/doctor.service';
import { Doctor, getVisitStatus, getLastVisit } from '../../models/doctor.model';
import { DoctorFormModal } from '../../modals/doctor-form/doctor-form.modal';

type FilterType = 'all' | 'current' | 'due-soon' | 'overdue';

@Component({
  selector: 'app-arztliste',
  templateUrl: 'arztliste.page.html',
  styleUrls: ['arztliste.page.css'],
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
    IonNote,
    IonBadge,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton,
    IonChip,
    IonRefresher,
    IonRefresherContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButton
  ]
})
export class ArztlistePage {
  searchTerm = signal('');
  selectedFilter = signal<FilterType>('all');

  protected doctorService!: DoctorService;
  allDoctors = computed(() => this.doctorService.allDoctors());

  // Filtered and searched doctors
  filteredDoctors = computed(() => {
    let doctors = this.allDoctors();

    // Filter by status
    const filter = this.selectedFilter();
    if (filter !== 'all') {
      doctors = doctors.filter(d => {
        const status = getVisitStatus(getLastVisit(d));
        return status === filter;
      });
    }

    // Search
    const search = this.searchTerm().toLowerCase();
    if (search) {
      doctors = doctors.filter(d =>
        d.name.toLowerCase().includes(search) ||
        d.city.toLowerCase().includes(search) ||
        d.specialty.toLowerCase().includes(search)
      );
    }

    return doctors;
  });

  // Statistics
  currentCount = computed(() =>
    this.allDoctors().filter(d => getVisitStatus(getLastVisit(d)) === 'current').length
  );
  dueSoonCount = computed(() =>
    this.allDoctors().filter(d => getVisitStatus(getLastVisit(d)) === 'due-soon').length
  );
  overdueCount = computed(() =>
    this.allDoctors().filter(d => getVisitStatus(getLastVisit(d)) === 'overdue').length
  );

  constructor(
    doctorService: DoctorService,
    private modalController: ModalController,
    private router: Router
  ) {
    this.doctorService = doctorService;
    addIcons({
      callOutline,
      locationOutline,
      timeOutline,
      addOutline,
      personAddOutline,
      trashOutline,
      createOutline,
      calendarOutline,
      globeOutline
    });
  }

  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value || '');
  }

  onFilterChange(event: any) {
    this.selectedFilter.set(event.detail.value);
  }

  getBadgeColor(doctor: Doctor): string {
    const status = getVisitStatus(getLastVisit(doctor));
    switch (status) {
      case 'current': return 'success';
      case 'due-soon': return 'warning';
      case 'overdue': return 'danger';
      default: return 'medium';
    }
  }

  getStatusText(doctor: Doctor): string {
    const lastVisit = getLastVisit(doctor);
    if (!lastVisit) return 'Noch nie besucht';

    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Heute besucht';
    if (diffDays === 1) return 'Gestern besucht';
    return `Vor ${diffDays} Tagen`;
  }

  onDoctorClick(doctor: Doctor) {
    this.router.navigate(['/doctor', doctor.id]);
  }

  callDoctor(event: Event, doctor: Doctor) {
    event.stopPropagation();
    if (doctor.telephone) {
      window.location.href = `tel:${doctor.telephone}`;
    }
  }

  openWebsite(event: Event, doctor: Doctor) {
    event.stopPropagation();
    if (doctor.website) {
      let url = doctor.website;
      if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  }

  async onAddDoctor() {
    const modal = await this.modalController.create({
      component: DoctorFormModal,
      componentProps: {
        mode: 'add'
      }
    });

    await modal.present();
  }

  handleRefresh(event: any) {
    // Simulate refresh - in a real app, this would reload data from server
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  async editDoctor(doctor: Doctor, slidingItem: any) {
    slidingItem.close();

    const modal = await this.modalController.create({
      component: DoctorFormModal,
      componentProps: {
        doctor: doctor,
        mode: 'edit'
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.deleted) {
      // Doctor was deleted
    }
  }

  async addVisitToDoctor(doctor: Doctor, slidingItem: any) {
    slidingItem.close();

    const VisitFormModal = await import('../../modals/visit-form/visit-form.modal').then(m => m.VisitFormModal);

    const modal = await this.modalController.create({
      component: VisitFormModal,
      componentProps: {
        doctor: doctor
      }
    });

    await modal.present();
  }

  async deleteDoctor(doctor: Doctor, slidingItem: any) {
    slidingItem.close();

    const confirmed = confirm(`Möchten Sie ${doctor.name} wirklich löschen?`);
    if (!confirmed) return;

    this.doctorService.deleteDoctor(doctor.id);
  }
}
