import { Component, Input, OnInit, signal } from '@angular/core';
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
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, calendarOutline } from 'ionicons/icons';
import { FirebaseDoctorService } from '../../services/firebase-doctor.service';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-visit-form',
  templateUrl: 'visit-form.modal.html',
  styleUrls: ['visit-form.modal.css'],
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
    IonDatetime,
    IonDatetimeButton,
    IonModal
  ]
})
export class VisitFormModal implements OnInit {
  @Input() doctor!: Doctor;
  @Input() visit?: any; // Visit to edit
  @Input() mode: 'add' | 'edit' = 'add';

  date = signal(new Date().toISOString());
  maxDate = new Date().toISOString();
  durationMinutes = signal(30);
  note = signal('');
  originalDate = '';

  isSaving = signal(false);

  constructor(
    private modalController: ModalController,
    private doctorService: FirebaseDoctorService
  ) {
    addIcons({ closeOutline, saveOutline, calendarOutline });
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.visit) {
      this.date.set(this.visit.date);
      this.originalDate = this.visit.date;
      this.durationMinutes.set(this.visit.durationMinutes);
      this.note.set(this.visit.note || '');
    }
  }

  get canSave(): boolean {
    return !!(this.date() && this.durationMinutes() > 0);
  }

  async save() {
    if (!this.canSave) return;

    this.isSaving.set(true);

    try {
      if (this.mode === 'edit' && this.originalDate) {
        await this.doctorService.updateVisit(this.doctor.id, this.originalDate, {
          date: this.date(),
          durationMinutes: this.durationMinutes(),
          note: this.note()
        });
      } else {
        await this.doctorService.addVisit(this.doctor.id, {
          date: this.date(),
          durationMinutes: this.durationMinutes(),
          note: this.note()
        });
      }

      await this.modalController.dismiss({ saved: true });
    } catch (error) {
      console.error('Save error:', error);
      alert('Fehler beim Speichern des Besuchs.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async close() {
    await this.modalController.dismiss();
  }

  onDateChange(event: any) {
    this.date.set(event.detail.value);
  }

  onDurationChange(event: any) {
    const value = parseInt(event.target.value || '0');
    this.durationMinutes.set(value);
  }

  onNoteChange(event: any) {
    this.note.set(event.target.value || '');
  }

  formatDisplayDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('de-AT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
