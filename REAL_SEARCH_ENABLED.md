# ✅ Real Search Enabled

## 🌍 OpenStreetMap Integration Active

The app now uses **real-time data** from OpenStreetMap via the Overpass API.

---

## 🔍 How It Works

### **When You Search:**

1. **User enters city name** (e.g., "Wien", "Salzburg", "Graz")
2. **Nominatim API** geocodes the city → coordinates
3. **Overpass API** searches for doctors within 5km radius
4. **Results parsed** from OpenStreetMap tags
5. **Displayed** in search results list

---

## 🗺️ Data Sources

### **Nominatim API** (Geocoding)
- URL: `https://nominatim.openstreetmap.org/search`
- Purpose: Convert city name → lat/lng coordinates
- Example: "Wien" → (48.2082, 16.3738)

### **Overpass API** (Doctor Search)
- URL: `https://overpass-api.de/api/interpreter`
- Purpose: Query OpenStreetMap for healthcare facilities
- Searches: `amenity=doctors` nodes and ways
- Radius: 5km from city center

---

## 📊 What Data Gets Retrieved

From OpenStreetMap tags:

```
✓ name              → Doctor name
✓ healthcare:speciality → Specialty (mapped to German)
✓ addr:street       → Street address
✓ addr:housenumber  → House number
✓ addr:city         → City
✓ addr:postcode     → Postal code
✓ phone / contact:phone → Telephone
✓ website / contact:website → Website
✓ lat / lon         → Coordinates
✓ opening_hours     → Opening hours (parsed but not shown)
```

---

## 🎯 Specialty Mapping

OSM tags are automatically mapped to German specialties:

| OpenStreetMap | German |
|---------------|--------|
| general | Allgemeinmedizin |
| internist | Innere Medizin |
| gynaecologist | Gynäkologie |
| cardiologist | Kardiologie |
| dermatologist | Dermatologie |
| orthopaedist | Orthopädie |
| neurologist | Neurologie |
| psychiatrist | Psychiatrie |
| paediatrician | Pädiatrie |
| urologist | Urologie |
| ear_nose_throat | HNO |
| ophthalmologist | Augenheilkunde |

---

## 🏙️ City → State Mapping

The app intelligently maps cities to Austrian states:

**Major Cities:**
- Wien → Wien
- Graz → Steiermark
- Linz → Oberösterreich
- Salzburg → Salzburg
- Innsbruck → Tirol
- Klagenfurt → Kärnten
- Bregenz → Vorarlberg
- Eisenstadt → Burgenland

**Plus 35+ additional cities** mapped automatically

---

## 🚀 Search Examples

### **Search: "Wien"**
```
1. Geocode "Wien, Österreich" → 48.2082, 16.3738
2. Query Overpass: doctors within 5km of (48.2082, 16.3738)
3. Returns: Real doctors from OpenStreetMap
```

### **Search: "Salzburg"**
```
1. Geocode "Salzburg, Österreich" → 47.8095, 13.0550
2. Query Overpass: doctors within 5km of (47.8095, 13.0550)
3. Returns: Real doctors from Salzburg area
```

---

## ⚡ Performance

- **Geocoding**: ~500ms - 1s
- **Overpass Query**: ~2-5s (depends on data density)
- **Total**: ~3-6 seconds per search
- **Timeout**: 25 seconds max

---

## 📝 Sample API Calls

### Nominatim Request:
```
GET https://nominatim.openstreetmap.org/search?q=Wien,Österreich&format=json&limit=1
User-Agent: ArztMap Austria App
```

### Nominatim Response:
```json
[{
  "lat": "48.2083537",
  "lon": "16.3725042",
  "display_name": "Wien, Österreich"
}]
```

### Overpass Query:
```
[out:json][timeout:25];
(
  node["amenity"="doctors"](around:5000,48.2082,16.3738);
  way["amenity"="doctors"](around:5000,48.2082,16.3738);
);
out body;
```

---

## ⚠️ Important Notes

### **API Rate Limits:**
- Nominatim: ~1 request/second (be respectful)
- Overpass: No hard limits, but don't spam

### **Data Quality:**
- Depends on OpenStreetMap completeness
- Austria has good OSM coverage, especially Vienna
- Some doctors may be missing if not in OSM
- User can still add doctors manually if not found

### **Network Requirements:**
- Requires internet connection
- May be slow on poor connections
- Graceful error handling if offline

---

## 🔧 Fallback Behavior

If search fails:
1. Error alert shown to user
2. User can still enter doctor data manually
3. All form fields remain accessible
4. No data is lost

---

## 🎨 User Experience

**Before Search:**
- Clean search interface
- Placeholder: "Stadt oder Name suchen..."
- Search button enabled when text entered

**During Search:**
- Button shows: "Suche läuft..."
- Button disabled
- Loading state active

**After Search:**
- Results displayed with doctor info
- Click any result to auto-fill form
- "Keine Ärzte gefunden" if empty
- Can search again with different query

---

## 🔮 Future Enhancements

Possible improvements:
- [ ] Search by doctor name (not just city)
- [ ] Filter by specialty during search
- [ ] Show distance from user location
- [ ] Cache results for repeated searches
- [ ] Pagination for many results
- [ ] Search in user's current location radius
- [ ] Offline mode with cached data

---

## ✅ Status

**Real Search: ACTIVE** ✓
- Mock data removed
- Overpass API connected
- Nominatim geocoding active
- Error handling in place
- Build successful

The app is now using **live OpenStreetMap data**!
