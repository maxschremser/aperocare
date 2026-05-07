# Google Places API Setup

Die App verwendet jetzt Google Places API für die Arztsuche, da diese deutlich aktuellere und vollständigere Daten liefert als OpenStreetMap.

## Schritt 1: Google Cloud Projekt erstellen

1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes aus
3. Aktivieren Sie die Abrechnung (erforderlich, aber es gibt ein großzügiges kostenloses Kontingent)

## Schritt 2: Erforderliche APIs aktivieren

Sie müssen **zwei APIs** aktivieren:

### 2.1 Maps JavaScript API (für die Kartenansicht)
1. Gehen Sie zu "APIs & Services" → "Library"
2. Suchen Sie nach "Maps JavaScript API"
3. Klicken Sie auf "Maps JavaScript API" und dann auf "ENABLE"

### 2.2 Places API (für die Arztsuche)
1. Gehen Sie zu "APIs & Services" → "Library"
2. Suchen Sie nach "Places API"
3. Klicken Sie auf "Places API" und dann auf "ENABLE"

## Schritt 3: API Key erstellen

1. Gehen Sie zu "APIs & Services" → "Credentials"
2. Klicken Sie auf "+ CREATE CREDENTIALS" → "API key"
3. Kopieren Sie den generierten API Key

## Schritt 4: API Key beschränken (Sicherheit)

1. Klicken Sie auf den erstellten API Key
2. Unter "Application restrictions":
   - Für Entwicklung: Wählen Sie "HTTP referrers" und fügen Sie hinzu:
     - `http://localhost:*/*`
     - `http://127.0.0.1:*/*`
     - Ihre lokale IP (z.B. `http://192.168.*`)
   - Für Produktion: Fügen Sie Ihre Domain hinzu (z.B. `https://yourdomain.com/*`)

3. Unter "API restrictions":
   - Wählen Sie "Restrict key"
   - Wählen Sie diese beiden APIs:
     - ✅ **Maps JavaScript API**
     - ✅ **Places API**

4. Klicken Sie auf "SAVE"

## Schritt 5: API Key in die App einfügen

1. Öffnen Sie `src/environments/environment.ts`
2. Ersetzen Sie `YOUR_GOOGLE_MAPS_API_KEY` mit Ihrem API Key:

```typescript
export const environment = {
  production: false,
  googleMapsApiKey: 'AIzaSy...'  // Ihr echter API Key
};
```

3. Öffnen Sie `src/environments/environment.prod.ts`
4. Fügen Sie denselben API Key ein (oder einen separaten für Produktion)

## Kosten

### Kostenloses Kontingent (pro Monat):
- **Maps JavaScript API**: $200 Guthaben (ca. 28.000 Kartenaufrufe)
- **Places Nearby Search**: 5.000 Anfragen kostenlos
- **Places Text Search**: 5.000 Anfragen kostenlos  
- **Places Autocomplete**: 28.000 Anfragen kostenlos

### Kosten danach:
- Maps JavaScript API: ~$7 pro 1.000 Kartenaufrufe
- Places Nearby/Text Search: ~$32 pro 1.000 Anfragen
- Places Autocomplete: ~$2.83 pro 1.000 Anfragen

**Für normale persönliche Nutzung sollte das kostenlose Kontingent mehr als ausreichen!**

## Budget-Alarm einrichten (empfohlen)

1. Gehen Sie zu "Billing" → "Budgets & alerts"
2. Erstellen Sie ein Budget (z.B. €5 pro Monat)
3. Richten Sie E-Mail-Benachrichtigungen ein bei 50%, 90%, 100%

## Alternative: Ohne API Key testen

Falls Sie keinen API Key haben, können Sie die manuelle Eingabe im Arzt-Formular weiterhin verwenden. Die Google Places Suche wird dann einfach nicht funktionieren, aber die App ist voll funktionsfähig.

## Troubleshooting

### "Google Maps API konnte nicht geladen werden"
- Überprüfen Sie, ob der API Key korrekt in `environment.ts` eingetragen ist
- Prüfen Sie, ob Places API in Google Cloud Console aktiviert ist
- Prüfen Sie die Browser-Konsole auf Fehlermeldungen

### "REQUEST_DENIED"
- Stellen Sie sicher, dass die Abrechnung in Google Cloud aktiviert ist
- Überprüfen Sie die API-Beschränkungen in den Credentials
- Prüfen Sie, ob die HTTP Referrer korrekt konfiguriert sind
