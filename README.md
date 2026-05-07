# aperoCare - Arzt Besuchsmanagement App

Eine moderne Ionic Mobile App für medizinische Außendienstmitarbeiter:innen in Österreich zur Verwaltung von Arztbesuchen mit interaktiver Karte, Statistiken und Online-Suche.

![Ionic](https://img.shields.io/badge/Ionic-8-blue)
![Angular](https://img.shields.io/badge/Angular-21-red)
![Google Maps](https://img.shields.io/badge/Google_Maps-API-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## 🚀 Quick Start

### 1. Repository klonen
```bash
git clone <your-repo-url>
cd menzl
npm install
```

### 2. Environment Setup (API Keys)
```bash
# Template-Dateien kopieren
cp src/environments/environment.template.ts src/environments/environment.ts
cp src/environments/environment.prod.template.ts src/environments/environment.prod.ts
```

**Wichtig:** Fügen Sie Ihren Google Maps API Key in beiden Dateien ein!

Siehe `GOOGLE_API_SETUP.md` für Details zur API-Einrichtung.

### 3. App starten
```bash
npm start                # Development Server
npm run build            # Production Build
npm run serve:prod       # Serve Production Build
```

## ✨ Features

### 📋 Ärzteliste
- **Echtzeit-Suche** nach Name, Ort, Fachrichtung oder Bundesland
- **Statusfilter**: Alle, Aktuell, Bald fällig, Überfällig
- **Farbcodierte Badges** (grün/gelb/rot) basierend auf letztem Besuch
- **Pull-to-Refresh** zum Aktualisieren
- **Statistik-Zähler** für jeden Status
- Detailansicht mit vollständiger Besuchshistorie

### 🗺️ Interaktive Karte
- **Google Maps Integration** mit hoher Performance
- **Farbcodierte Marker** nach Besuchsstatus (grün/orange/rot)
- **Heatmap-Layer** zur Visualisierung der Arztdichte
- **Klickbare Marker** mit Popup und Detailbutton
- **Mein Standort** Button für Geolocation
- Zentrierung auf Österreich

### 🔍 Online-Arztsuche
- **Google Places API** für aktuelle Arztdaten
- Zwei Suchmodi: **Nach Stadt** oder **Freitext**
- Filter nach **Fachrichtung**
- **Telefon & Website** werden automatisch übernommen
- Ein-Klick-Hinzufügen zur Ärzteliste
- **Ein-Klick-Hinzufügen** neuer Ärzte
- **Duplikatserkennung**
- "Bereits hinzugefügt" Badge

### 📊 Statistik-Dashboard
- **Übersichtskarten**: Gesamt-Ärzte, Gesamt-Besuche
- **Besuchsstatus-Aufschlüsselung** mit Prozentangaben
- **Ärzte nach Bundesland** sortiert
- **Ärzte nach Fachrichtung** gruppiert
- **Timeline der letzten Besuche** mit Datum und Dauer
- Durchschnittliche Besuche pro Arzt

### 📝 Formulare & Modals
- **Arzt hinzufügen/bearbeiten**
  - Vollständiges Formular mit Validierung
  - Geocoding-Integration (Adresse → Koordinaten)
  - Wiener Bezirksauswahl
  - Arzt löschen-Funktion
- **Besuch hinzufügen**
  - Datum & Uhrzeit-Picker
  - Dauer in Minuten
  - Notizen zum Besuch

## 🚀 Installation & Start

### Voraussetzungen
- Node.js 24.x oder höher
- npm 11.x oder höher

### Installation
```bash
# Dependencies installieren
npm install

# Development-Server starten
npm start
```

Die App läuft dann auf **http://localhost:4200/**

### Mobile Ansicht
Für die beste Erfahrung:
1. Öffne Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Wähle ein mobiles Gerät (z.B. iPhone 12)

## 📱 Native Apps bauen

### iOS
```bash
# iOS Platform hinzufügen
npx cap add ios

# Build erstellen
npm run build

# Sync mit Capacitor
npx cap sync

# Xcode öffnen
npx cap open ios
```

### Android
```bash
# Android Platform hinzufügen
npx cap add android

# Build erstellen
npm run build

# Sync mit Capacitor
npx cap sync

# Android Studio öffnen
npx cap open android
```

## 🏗️ Technologie-Stack

- **Framework**: Ionic 7 + Angular 21
- **Sprache**: TypeScript 5.9
- **UI Components**: Ionic Standalone Components
- **Karten**: Leaflet.js + Leaflet.heat
- **Styling**: Ionic CSS + Tailwind CSS
- **State Management**: Angular Signals
- **Storage**: LocalStorage
- **Geocoding**: Nominatim (OpenStreetMap)
- **Build Tool**: Vite

## 🗂️ Projektstruktur

```
src/
├── app/
│   ├── models/
│   │   └── doctor.model.ts          # Datenmodelle (englisch)
│   ├── services/
│   │   ├── doctor.service.ts        # Ärzteservice
│   │   ├── geocoding.service.ts     # Geocoding
│   │   └── overpass.service.ts      # OSM Overpass API
│   ├── pages/
│   │   ├── tabs/                    # Tab-Navigation
│   │   ├── arztliste/               # Ärzteliste
│   │   ├── karte/                   # Kartenansicht
│   │   ├── arztsuche/               # Online-Suche
│   │   ├── statistik/               # Statistiken
│   │   └── doctor-detail/           # Arzt-Details
│   ├── modals/
│   │   ├── doctor-form/             # Arzt-Formular
│   │   └── visit-form/              # Besuch-Formular
│   └── app.routes.ts                # Routing-Konfiguration
├── theme/
│   └── variables.css                # Ionic Theme
└── styles.css                       # Globale Styles
```

## 💾 Datenmodell

### Doctor (Arzt)
```typescript
interface Doctor {
  id: string;
  name: string;
  specialty: string;           // Fachrichtung
  address: string;
  city: string;
  state: FederalState;         // Bundesland
  district?: string;           // Wiener Bezirk (optional)
  lat: number;
  lng: number;
  notes: string;
  visits: Visit[];
}
```

### Visit (Besuch)
```typescript
interface Visit {
  id: string;
  date: string;                // ISO Date
  durationMinutes: number;
  note: string;
}
```

## 🎨 Code-Konventionen

- **Code-Sprache**: Englisch (Variablen, Funktionen, Klassen)
- **UI-Sprache**: Deutsch (Buttons, Labels, Meldungen)
- **Komponenten**: Standalone Components (Angular 21)
- **State**: Signals statt RxJS Observables
- **Styling**: Ionic CSS-Variablen + Utility Classes

## 📊 Besuchsstatus-Logik

- **Aktuell** (Grün): Besuch in den letzten 30 Tagen
- **Bald fällig** (Gelb): Letzter Besuch vor 31-90 Tagen
- **Überfällig** (Rot): Letzter Besuch vor >90 Tagen oder noch nie besucht

## 🗺️ Bundesländer Österreichs

- Wien
- Niederösterreich
- Oberösterreich
- Steiermark
- Tirol
- Salzburg
- Kärnten
- Vorarlberg
- Burgenland

## 🔧 Entwicklung

### Seed-Daten
Die App enthält 10 Beispiel-Ärzte aus verschiedenen österreichischen Bundesländern mit unterschiedlichen Besuchshistorien.

### LocalStorage
Alle Daten werden im Browser LocalStorage gespeichert. Zum Zurücksetzen:
```javascript
localStorage.removeItem('arztmap-austria-doctors');
```

### Build
```bash
# Production Build
npm run build

# Build Ausgabe im dist/menzl/browser Ordner
```

## 📝 Lizenz

Dieses Projekt ist für den internen Gebrauch bestimmt.

## 👥 Entwicklung

Entwickelt mit Claude Code und Ionic Framework.
