// Google Maps JS API key. This is a browser-side key — restrict it by
// HTTP referrer in Google Cloud Console (preview + published domains).
export const GOOGLE_MAPS_API_KEY = 'AIzaSyA9TsD4A1JdDkMvSTnnojTT2ETVtMCDOKI';

// Bhopal, Madhya Pradesh, India
export const BHOPAL_CENTER = { lat: 23.2599, lng: 77.4126 };
export const DEFAULT_ZOOM = 12;

// Dark futuristic Google Map style matching JanMitra UI
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0b3d2e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0b1220' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c2a3a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#06b6d4' }] },
];
