import { Component, OnInit, OnDestroy, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locateOutline, layersOutline } from 'ionicons/icons';
import { DoctorService } from '../../services/doctor.service';
import { GooglePlacesService } from '../../services/google-places.service';
import { Doctor, getVisitStatus, getLastVisit } from '../../models/doctor.model';

declare global {
  interface Window {
    google: any;
    viewDoctorDetails?: (doctorId: string) => void;
  }
}

@Component({
  selector: 'app-karte',
  templateUrl: 'karte.page.html',
  styleUrls: ['karte.page.css'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButton,
    IonButtons
  ]
})
export class KartePage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private heatmap: google.maps.visualization.HeatmapLayer | null = null;
  showHeatmap = false;

  protected doctorService!: DoctorService;
  allDoctors = computed(() => this.doctorService.allDoctors());

  constructor(
    doctorService: DoctorService,
    private router: Router,
    private googlePlacesService: GooglePlacesService
  ) {
    this.doctorService = doctorService;
    addIcons({ locateOutline, layersOutline });
  }

  async ngOnInit() {
    // Set up global function for popup button clicks
    window.viewDoctorDetails = (doctorId: string) => {
      this.router.navigate(['/doctor', doctorId]);
    };

    // Load Google Maps API first
    try {
      await this.googlePlacesService.loadGoogleMapsApi();
      setTimeout(() => this.initMap(), 100);
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      alert('Google Maps konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung.');
    }
  }

  ngOnDestroy() {
    // Clean up global function
    delete window.viewDoctorDetails;

    if (this.map) {
      this.map = null;
    }
  }

  private initMap() {
    if (!this.mapContainer) return;

    // Center on Austria
    const austriaCenter = { lat: 47.5162, lng: 14.5501 };

    this.map = new window.google.maps.Map(this.mapContainer.nativeElement, {
      center: austriaCenter,
      zoom: 7,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    this.addDoctorMarkers();
  }

  private addDoctorMarkers() {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];

    const doctors = this.allDoctors();

    if (doctors.length === 0) {
      return;
    }

    // Create bounds to fit all markers
    const bounds = new window.google.maps.LatLngBounds();

    doctors.forEach(doctor => {
      if (doctor.lat === 0 && doctor.lng === 0) {
        return; // Skip doctors without coordinates
      }

      const position = { lat: doctor.lat, lng: doctor.lng };
      const status = getVisitStatus(getLastVisit(doctor));

      // Determine marker color based on status
      let markerColor = '#4CAF50'; // green for current
      if (status === 'due-soon') markerColor = '#FF9800'; // orange
      if (status === 'overdue') markerColor = '#F44336'; // red

      // Create marker
      const marker = new window.google.maps.Marker({
        position: position,
        map: this.map,
        title: doctor.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: this.createPopupContent(doctor)
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(this.map!, marker);
      });

      this.markers.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (doctors.length > 0) {
      this.map.fitBounds(bounds);
    }
  }

  private createPopupContent(doctor: Doctor): string {
    const lastVisit = getLastVisit(doctor);
    const status = getVisitStatus(lastVisit);

    const lastVisitText = lastVisit
      ? `Letzter Besuch: ${this.formatDate(lastVisit)}`
      : 'Noch nie besucht';

    const statusClass = `status-${status}`;

    return `
      <div class="map-popup" style="min-width: 200px; padding: 10px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">${doctor.name}</h3>
        <p style="margin: 4px 0; font-weight: bold;">${doctor.specialty}</p>
        <p style="margin: 4px 0; font-size: 14px;">${doctor.address}<br>${doctor.city}</p>
        <p class="${statusClass}" style="margin: 8px 0 4px 0; font-size: 14px;">${lastVisitText}</p>
        <p style="margin: 4px 0; font-size: 12px; color: #666;">${doctor.visits.length} Besuch(e) gesamt</p>
        <button
          onclick="window.viewDoctorDetails('${doctor.id}')"
          style="
            margin-top: 8px;
            padding: 8px 16px;
            background: #3880ff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          "
        >
          Details anzeigen
        </button>
      </div>
    `;
  }

  toggleHeatmap() {
    this.showHeatmap = !this.showHeatmap;

    if (this.showHeatmap) {
      this.createHeatmap();
    } else {
      this.removeHeatmap();
    }
  }

  private createHeatmap() {
    if (!this.map) return;

    const doctors = this.allDoctors();
    const heatmapData: google.maps.LatLng[] = [];

    doctors.forEach(doctor => {
      if (doctor.lat !== 0 && doctor.lng !== 0) {
        heatmapData.push(new window.google.maps.LatLng(doctor.lat, doctor.lng));
      }
    });

    if (heatmapData.length > 0) {
      this.heatmap = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: this.map,
        radius: 30,
        opacity: 0.6
      });
    }

    // Hide markers when showing heatmap
    this.markers.forEach(marker => marker.setVisible(false));
  }

  private removeHeatmap() {
    if (this.heatmap) {
      this.heatmap.setMap(null);
      this.heatmap = null;
    }

    // Show markers again
    this.markers.forEach(marker => marker.setVisible(true));
  }

  centerOnAustria() {
    if (!this.map) return;

    const austriaCenter = { lat: 47.5162, lng: 14.5501 };
    this.map.setCenter(austriaCenter);
    this.map.setZoom(7);
  }

  centerOnUserLocation() {
    if (!this.map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          this.map!.setCenter(userLocation);
          this.map!.setZoom(12);

          // Add a marker for user location
          new window.google.maps.Marker({
            position: userLocation,
            map: this.map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            },
            title: 'Ihr Standort'
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Standort konnte nicht ermittelt werden.');
        }
      );
    } else {
      alert('Geolocation wird von Ihrem Browser nicht unterstützt.');
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-AT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
