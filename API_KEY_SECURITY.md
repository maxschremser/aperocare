# 🔐 API Key Sicherheit

## ⚠️ Wichtig: API Keys sind NICHT im Repository!

Die echten API Keys befinden sich in lokalen Dateien, die **nicht** in Git committed werden.

## 📁 Datei-Struktur:

```
src/environments/
├── environment.template.ts         ✅ Im Git (ohne echte Keys)
├── environment.prod.template.ts    ✅ Im Git (ohne echte Keys)
├── environment.ts                  ❌ NICHT in Git (mit echten Keys)
└── environment.prod.ts             ❌ NICHT in Git (mit echten Keys)
```

## 🛡️ Was schützt die Keys:

### .gitignore
```
/src/environments/environment.ts
/src/environments/environment.prod.ts
/src/environments/environment.local.ts
.env
.env.local
```

Diese Dateien werden **automatisch ignoriert** und niemals committed.

## 🔄 Setup für neue Entwickler:

1. Repository klonen
2. Template-Dateien kopieren:
   ```bash
   cp src/environments/environment.template.ts src/environments/environment.ts
   cp src/environments/environment.prod.template.ts src/environments/environment.prod.ts
   ```
3. Eigene API Keys eintragen (siehe `GOOGLE_API_SETUP.md`)

## ✅ Sicherheits-Checkliste:

Bevor Sie committen, überprüfen Sie:

```bash
# Sollte KEINE environment.ts oder environment.prod.ts zeigen
git status

# Sollte leer sein (keine environment Dateien)
git ls-files src/environments/environment*.ts

# Nur Template-Dateien sollten gelistet sein
git ls-files src/environments/*.template.ts
```

## 🚨 Falls Sie versehentlich Keys committed haben:

1. **Sofort** den API Key in Google Cloud Console widerrufen
2. Einen neuen API Key erstellen
3. Git History bereinigen:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch src/environments/environment.ts" \
     --prune-empty --tag-name-filter cat -- --all
   ```
4. Force Push (⚠️ Vorsicht!):
   ```bash
   git push origin --force --all
   ```

## 📚 Weitere Informationen:

- `ENVIRONMENT_SETUP.md` - Setup-Anleitung für Entwickler
- `GOOGLE_API_SETUP.md` - Google API Key erstellen und konfigurieren
- `.gitignore` - Liste aller ignorierten Dateien

## 💡 Best Practices:

1. ✅ **NIE** API Keys in Code hardcoden
2. ✅ **IMMER** Template-Dateien verwenden
3. ✅ **PRÜFEN** vor jedem Commit mit `git status`
4. ✅ **WIDERRUFEN** sofort bei versehentlichem Commit
5. ✅ **BESCHRÄNKEN** API Keys mit HTTP Referrern für Production
