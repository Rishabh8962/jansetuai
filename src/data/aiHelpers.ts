// Helpers for AI smart features: cost estimation, duplicate detection, explainability
import type { Complaint, ComplaintCategory } from './mockData';

const COST_TABLE: Record<ComplaintCategory, { min: number; max: number; materials: string[]; hours: number }> = {
  pothole: { min: 4500, max: 12000, materials: ['Bitumen mix', 'Aggregate', 'Tack coat'], hours: 4 },
  garbage: { min: 800, max: 2500, materials: ['Disposal bags', 'Truck dispatch', 'Sanitizer'], hours: 2 },
  streetlight: { min: 1800, max: 6000, materials: ['LED fixture', 'Wiring', 'Mounting bracket'], hours: 3 },
  water_leakage: { min: 3500, max: 18000, materials: ['Pipe segments', 'Couplings', 'Sealant'], hours: 5 },
  drainage: { min: 2200, max: 9000, materials: ['Suction cleaning', 'Manhole cover', 'Cement'], hours: 4 },
  road_damage: { min: 8000, max: 35000, materials: ['Concrete mix', 'Steel mesh', 'Edge boards'], hours: 8 },
  sewage_overflow: { min: 4000, max: 15000, materials: ['Vacuum tanker', 'Disinfectant', 'Pipe replacement'], hours: 6 },
};

export function estimateRepairCost(category: ComplaintCategory, severity: 'low' | 'medium' | 'high' = 'medium') {
  const base = COST_TABLE[category] ?? COST_TABLE.pothole;
  const factor = severity === 'high' ? 1 : severity === 'low' ? 0.5 : 0.75;
  const min = Math.round(base.min * factor);
  const max = Math.round(base.max * factor);
  return {
    min,
    max,
    avg: Math.round((min + max) / 2),
    currency: '₹',
    materials: base.materials,
    estimatedHours: Math.ceil(base.hours * factor),
  };
}

const REASONING_TABLE: Record<ComplaintCategory, string[]> = {
  pothole: ['circular cavity in road surface', 'exposed sub-base', 'water pooling pattern'],
  garbage: ['overflowing waste containers', 'scattered debris', 'organic decomposition cues'],
  streetlight: ['darkened pole/fixture', 'absence of light cone at night', 'damaged housing'],
  water_leakage: ['standing water', 'visible pipe rupture', 'continuous flow pattern'],
  drainage: ['blocked grate', 'water backflow', 'silt accumulation'],
  road_damage: ['large cracks/alligator pattern', 'surface depression', 'edge breakage'],
  sewage_overflow: ['dark waste water on surface', 'displaced manhole cover', 'odour-related staining'],
};

export function explainClassification(category: ComplaintCategory, confidence: number): string[] {
  const cues = REASONING_TABLE[category] ?? [];
  return [
    `Detected ${cues[0] ?? 'characteristic visual cues'} (${(confidence * 100).toFixed(0)}% confidence)`,
    cues[1] ? `Secondary cue: ${cues[1]}` : 'Pattern matches trained civic-issue dataset',
    cues[2] ? `Context cue: ${cues[2]}` : 'Geometry consistent with typical reports',
  ];
}

// Haversine distance in metres
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function findDuplicates(
  all: Complaint[],
  candidate: { lat: number; lng: number; category: ComplaintCategory },
  radiusMeters = 250,
): Complaint[] {
  return all
    .filter(c =>
      c.category === candidate.category &&
      c.status !== 'completed' &&
      distanceMeters(c, candidate) <= radiusMeters,
    )
    .slice(0, 3);
}
