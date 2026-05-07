# Environment Setup

Die echten API Keys werden **nicht** in Git gespeichert. Sie müssen lokal erstellt werden.

## Setup für neue Entwickler:

### Schritt 1: Environment-Dateien erstellen

```bash
# Kopieren Sie die Templates
cp src/environments/environment.template.ts src/environments/environment.ts
cp src/environments/environment.prod.template.ts src/environments/environment.prod.ts
```

### Schritt 2: API Keys eintragen

Öffnen Sie die kopierten Dateien und ersetzen Sie die Platzhalter:

#### In `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_FIREBASE_API_KEY',        // ← Firebase API Key hier
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
  },
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'  // ← Google Maps API Key hier
};
```

#### In `src/environments/environment.prod.ts`:

Dasselbe wie oben, aber mit `production: true`

### Schritt 3: Google Maps API Key erstellen

1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstellen Sie ein Projekt oder wählen Sie ein bestehendes
3. Aktivieren Sie diese APIs:
   - **Maps JavaScript API**
   - **Places API**
4. Erstellen Sie einen API Key unter "Credentials"
5. Fügen Sie den Key in beide environment Dateien ein

Mehr Details: Siehe `GOOGLE_API_SETUP.md`

### Schritt 4: Testen

```bash
npm run build
npm run serve:prod
```

## ⚠️ Wichtig:

- Die echten environment-Dateien (`environment.ts`, `environment.prod.ts`) werden **NICHT** in Git committed
- Nur die Template-Dateien (`*.template.ts`) sind im Repository
- Teilen Sie niemals API Keys öffentlich oder committen Sie diese nicht
- Jeder Entwickler muss seine eigenen API Keys erstellen

## Für CI/CD:

Setzen Sie die API Keys als Umgebungsvariablen in Ihrer CI/CD-Pipeline:

```bash
export GOOGLE_MAPS_API_KEY="your-key-here"
```

Und verwenden Sie ein Build-Script, das die Keys einfügt.
