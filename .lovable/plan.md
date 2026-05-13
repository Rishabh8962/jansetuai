# JanSetu Premium Redesign Plan

Scope: visual + UX overhaul, new location flow, map dashboard polish, AI card upgrade. **No backend / DB / auth / AI logic changes.** All existing functionality preserved.

---

## 1. Design system refresh (`src/index.css`, `tailwind.config.ts`)

Introduce a refined Indian civic-tech palette as HSL semantic tokens (used everywhere — no hardcoded hex):

- `--saffron`: 28 100% 60%  (#FF9933) → primary actions, alerts
- `--india-green`: 120 88% 28% (#138808) → success, resolved
- `--navy`: 240 100% 25% (#000080) → icons, markers, analytics accents
- Keep current dark base; add a parallel `civic` light surface token for cards/forms
- Add gradients: `--gradient-civic` (saffron → white → green at low opacity for hero accents only — never heavy overlays)
- New shadows: `--shadow-civic`, `--shadow-float`
- Add `marker-bounce`, `ai-scan`, `count-up`, `float-soft` keyframes

Components updated to consume tokens — no per-component color literals.

## 2. Hero redesign (`src/pages/Index.tsx` or current landing)

Two-column layout:
- **Left:** JanSetu logo + tagline "Empowering Citizens. Solving Civic Issues with AI." + saffron `Report Issue` and outline `Track Complaint` CTAs + 4 animated counters (Issues Resolved, Active Citizens, Departments Connected, AI Accuracy).
- **Right:** Live `GoogleCityMap` (Bhopal, existing component) with bouncing pins + 2-3 floating glass AI issue cards overlaying the map corner.

Soft floating motion via framer-motion, no heavy tricolor wash.

## 3. Complaint location section (`src/pages/Classify.tsx` + new `LocationPicker.tsx`)

New "Complaint Location" block appears after image upload. Three tabs:

1. **Use Current Location** — `navigator.geolocation`, loading state, reverse geocode via Google Geocoder (existing API key), shows formatted address.
2. **Select on Map** — Google Map with draggable marker; confirm button writes lat/lng/address.
3. **Enter Address Manually** — text input fallback (auto-selected when geolocation denied).

Stores `{ lat, lng, address, timestamp }` into existing complaint payload (uses existing `lat`/`lng` columns; address goes into description prefix or new local state passed to existing submit). Preview card shows mini-map + address before submission.

## 4. Map dashboard polish (`src/pages/MapView.tsx`, `GoogleCityMap.tsx`)

Already on Google Maps. Enhancements:
- Marker color by **status** (pending=orange, in_progress=navy/blue, resolved=green) in addition to current priority legend toggle.
- Marker bounce animation on hover/select.
- Richer InfoWindow: image thumbnail, issue type w/ icon, AI confidence bar, address, timestamp, department, status badge.

## 5. AI classification card (`src/components/AIIntelligenceCard.tsx`)

- Rename trigger button "Mind" → **"AI Analysis"** (find in `Classify.tsx`).
- Add dynamic large issue icon mapped from category (garbage 🗑, drainage 🕳, water 💧, streetlight 💡, road 🚧, tree 🌳, default ✨).
- Add scan-line animation during loading state.
- Result card shows: big icon, issue name, animated confidence ring, priority chip — keep existing explainability section below.

## 6. Report Issue page steps (`Classify.tsx`)

Add a top step indicator: Upload → AI Analysis → Location → Details → Submit. Highlights current step; non-blocking (existing flow preserved).

## 7. Admin dashboard (`src/pages/GovernmentDashboard.tsx`)

- Embed `GoogleCityMap` at top with status-colored markers.
- Department performance cards already exist — restyle with new tokens + count-up.
- Add a Priority Alerts strip (filter complaints where priority=critical, last 24h).
- Heatmap: enable Google Maps `visualization` HeatmapLayer overlay toggle on the dashboard map.

## 8. Animations & polish

- framer-motion stagger on counter + cards
- marker bounce on map select
- AI scan sweep during classify loading
- hover lift on all glass cards (existing `glass-card-hover` reused)

---

## Files touched (new + edits)

**New:**
- `src/components/LocationPicker.tsx`
- `src/components/CivicCounter.tsx` (animated count-up)
- `src/components/AIIssueIcon.tsx` (category → emoji/icon mapper)

**Edited:**
- `src/index.css`, `tailwind.config.ts` — tokens, keyframes
- `src/pages/Index.tsx` — hero
- `src/pages/Classify.tsx` — step indicator, location section, button rename
- `src/components/AIIntelligenceCard.tsx` — big icon + scan anim
- `src/components/GoogleCityMap.tsx` — status colors, bounce, richer info window
- `src/pages/MapView.tsx` — pass status mode
- `src/pages/GovernmentDashboard.tsx` — embed map, alerts, heatmap toggle

## Out of scope (explicitly preserved)

- Supabase schema, RLS, edge functions, auth, AI classification logic, complaint store, feedback system, worker app — untouched.

Ready to implement on approval.