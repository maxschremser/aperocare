import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton,
  IonText,
  ModalController,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  callOutline,
  createOutline,
  addOutline,
  calendarOutline,
  timeOutline,
  volumeMediumOutline,
  stopCircleOutline,
  personOutline,
  navigateOutline,
  trashOutline,
  globeOutline,
  openOutline,
  call,
  hardwareChipOutline,
  checkmarkCircleOutline,
  returnDownBackOutline
} from 'ionicons/icons';
import { FirebaseDoctorService } from '../../services/firebase-doctor.service';
import { Doctor, getVisitStatus, getLastVisit, Device, getActiveDevices } from '../../models/doctor.model';
import { DoctorFormModal } from '../../modals/doctor-form/doctor-form.modal';
import { VisitFormModal } from '../../modals/visit-form/visit-form.modal';
import { DeviceFormModal } from '../../modals/device-form/device-form.modal';

@Component({
  selector: 'app-doctor-detail',
  templateUrl: 'doctor-detail.page.html',
  styleUrls: ['doctor-detail.page.css'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButton,
    IonText
  ]
})
export class DoctorDetailPage implements OnInit {
  protected doctorService!: FirebaseDoctorService;
  doctorId: string = '';
  doctor = computed(() => {
    return this.doctorService.allDoctors().find(d => d.id === this.doctorId);
  });

  sortedVisits = computed(() => {
    const doc = this.doctor();
    if (!doc) return [];
    return [...doc.visits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  activeDevices = computed(() => {
    const doc = this.doctor();
    if (!doc) return [];
    return getActiveDevices(doc);
  });

  allDevices = computed(() => {
    const doc = this.doctor();
    if (!doc) return [];
    return doc.devices || [];
  });

  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  speakingNoteIndex: number | null = null;
  germanVoices: SpeechSynthesisVoice[] = [];
  selectedVoice: SpeechSynthesisVoice | null = null;
  private currentVoiceIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private modalController: ModalController,
    private navController: NavController,
    doctorService: FirebaseDoctorService
  ) {
    this.doctorService = doctorService;
    addIcons({
      locationOutline,
      callOutline,
      createOutline,
      addOutline,
      calendarOutline,
      timeOutline,
      volumeMediumOutline,
      stopCircleOutline,
      personOutline,
      navigateOutline,
      trashOutline,
      globeOutline,
      openOutline,
      call,
      hardwareChipOutline,
      checkmarkCircleOutline,
      returnDownBackOutline
    });

    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  ngOnInit() {
    this.doctorId = this.route.snapshot.paramMap.get('id') || '';
  }

  private loadVoices() {
    if (!this.speechSynthesis) return;

    const loadVoiceList = () => {
      const voices = this.speechSynthesis!.getVoices();
      // Filter for German voices and prefer high-quality ones
      this.germanVoices = voices
        .filter(voice => voice.lang.startsWith('de'))
        .sort((a, b) => {
          // Prefer Google/Apple voices (usually better quality)
          const aScore = this.getVoiceQualityScore(a);
          const bScore = this.getVoiceQualityScore(b);
          return bScore - aScore;
        });

      // Prefer Helena voice if available
      const helenaVoice = this.germanVoices.find(v => v.name.toLowerCase().includes('helena'));
      if (helenaVoice) {
        this.selectedVoice = helenaVoice;
        this.currentVoiceIndex = this.germanVoices.indexOf(helenaVoice);
      } else if (this.germanVoices.length > 0) {
        this.selectedVoice = this.germanVoices[0];
      }
    };

    // Load voices immediately
    loadVoiceList();

    // Also listen for voiceschanged event (some browsers need this)
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = loadVoiceList;
    }
  }

  private getVoiceQualityScore(voice: SpeechSynthesisVoice): number {
    let score = 0;
    const name = voice.name.toLowerCase();

    // Prefer premium/enhanced voices
    if (name.includes('premium') || name.includes('enhanced')) score += 50;
    if (name.includes('neural') || name.includes('natural')) score += 40;

    // Prefer Google and Apple voices
    if (name.includes('google')) score += 30;
    if (name.includes('apple')) score += 25;

    // Prefer female voices (often sound more natural)
    if (name.includes('female') || name.includes('anna') || name.includes('petra')) score += 10;

    // Local voices are usually better quality
    if (voice.localService) score += 20;

    return score;
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async editDoctor() {
    const doc = this.doctor();
    if (!doc) return;

    const modal = await this.modalController.create({
      component: DoctorFormModal,
      componentProps: {
        doctor: doc,
        mode: 'edit'
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.deleted) {
      // Doctor was deleted, navigate back
      this.navController.navigateBack('/tabs/arztliste');
    }
  }

  async addVisit() {
    const doc = this.doctor();
    if (!doc) return;

    const modal = await this.modalController.create({
      component: VisitFormModal,
      componentProps: {
        doctor: doc
      }
    });

    await modal.present();
  }

  speakNote(note: string, index: number) {
    if (!this.speechSynthesis || !note) return;

    // If already speaking this note, stop it
    if (this.speakingNoteIndex === index) {
      this.stopSpeaking();
      return;
    }

    // Stop any current speech
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(note);
    utterance.lang = 'de-DE';

    // Use the selected German voice
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Slightly slower rate for better comprehension
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      this.speakingNoteIndex = null;
      this.currentUtterance = null;
    };

    utterance.onerror = () => {
      this.speakingNoteIndex = null;
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.speakingNoteIndex = index;
    this.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.speakingNoteIndex = null;
      this.currentUtterance = null;
    }
  }

  isSpeaking(index: number): boolean {
    return this.speakingNoteIndex === index;
  }

  selectNextVoice() {
    if (this.germanVoices.length === 0) return;

    this.currentVoiceIndex = (this.currentVoiceIndex + 1) % this.germanVoices.length;
    this.selectedVoice = this.germanVoices[this.currentVoiceIndex];

    // If currently speaking, restart with new voice
    if (this.speakingNoteIndex !== null) {
      const visits = this.sortedVisits();
      const currentNote = visits[this.speakingNoteIndex]?.note;
      if (currentNote) {
        this.stopSpeaking();
        setTimeout(() => {
          this.speakNote(currentNote, this.speakingNoteIndex!);
        }, 100);
      }
    }
  }

  openInMaps() {
    const doc = this.doctor();
    if (!doc) return;

    const address = encodeURIComponent(`${doc.address}, ${doc.city}, Austria`);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(url, '_blank');
  }

  callPhone() {
    const doc = this.doctor();
    if (!doc || !doc.telephone) return;

    window.location.href = `tel:${doc.telephone}`;
  }

  openWebsite() {
    const doc = this.doctor();
    if (!doc || !doc.website) return;

    let url = doc.website;
    // Add https:// if no protocol specified
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  }

  async editVisit(index: number) {
    const doc = this.doctor();
    if (!doc) return;

    const visits = this.sortedVisits();
    const visit = visits[index];

    const modal = await this.modalController.create({
      component: VisitFormModal,
      componentProps: {
        doctor: doc,
        visit: visit,
        mode: 'edit'
      }
    });

    await modal.present();
  }

  async deleteVisit(index: number) {
    const doc = this.doctor();
    if (!doc) return;

    const visits = this.sortedVisits();
    const visit = visits[index];

    const confirm = window.confirm(
      `Möchten Sie den Besuch vom ${this.formatDate(visit.date)} wirklich löschen?`
    );

    if (confirm) {
      await this.doctorService.deleteVisit(doc.id, visit.date);
    }
  }

  // ===== DEVICE MANAGEMENT =====

  async addDevice() {
    const doc = this.doctor();
    if (!doc) return;

    const modal = await this.modalController.create({
      component: DeviceFormModal,
      componentProps: {
        doctor: doc,
        mode: 'add'
      }
    });

    await modal.present();
  }

  async editDevice(device: Device) {
    const doc = this.doctor();
    if (!doc) return;

    const modal = await this.modalController.create({
      component: DeviceFormModal,
      componentProps: {
        doctor: doc,
        device: device,
        mode: 'edit'
      }
    });

    await modal.present();
  }

  async returnDevice(device: Device) {
    const doc = this.doctor();
    if (!doc) return;

    const confirm = window.confirm(
      `Möchten Sie das Gerät "${device.name}" als zurückgegeben markieren?`
    );

    if (confirm) {
      await this.doctorService.returnDevice(doc.id, device.id);
    }
  }

  async deleteDevice(device: Device) {
    const doc = this.doctor();
    if (!doc) return;

    const confirm = window.confirm(
      `Möchten Sie das Gerät "${device.name}" wirklich löschen?`
    );

    if (confirm) {
      await this.doctorService.deleteDevice(doc.id, device.id);
    }
  }

  formatDeviceDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getDeviceLoanDuration(device: Device): number {
    const loanDate = new Date(device.loanDate);
    const endDate = device.returnDate ? new Date(device.returnDate) : new Date();
    const diffDays = Math.floor((endDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
