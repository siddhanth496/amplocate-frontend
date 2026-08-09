// Vivid tier colour — for dots, rings, bars and map pins.
export function relColor(score) {
  if (score >= 0.85) return 'var(--color-rel-excellent)';
  if (score >= 0.7) return 'var(--color-rel-good)';
  if (score >= 0.5) return 'var(--color-rel-moderate)';
  return 'var(--color-rel-poor)';
}

// Darkened tier colour — for type. Same meaning, but readable at 13px on white.
export function relTextColor(score) {
  if (score >= 0.85) return 'var(--color-rel-excellent-text)';
  if (score >= 0.7) return 'var(--color-rel-good-text)';
  if (score >= 0.5) return 'var(--color-rel-moderate-text)';
  return 'var(--color-rel-poor-text)';
}

// Raw hex — needed where colour is injected into a string (Leaflet divIcon HTML)
// and CSS variables are not resolvable.
export function relHex(score) {
  if (score >= 0.85) return '#0e9f6e';
  if (score >= 0.7) return '#5a9e32';
  if (score >= 0.5) return '#e8a317';
  return '#e5484d';
}

export function relLabel(score) {
  // Say what the driver will experience, not a grade they have to decode.
  if (score >= 0.85) return 'Usually works';
  if (score >= 0.7) return 'Mostly works';
  if (score >= 0.5) return 'Hit or miss';
  return 'Often broken';
}

export function relPct(score) {
  return `${Math.round(score * 100)}%`;
}

export function timeAgo(iso) {
  if (!iso) return 'never';
  const then = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').getTime();
  const mins = Math.max(Math.round((Date.now() - then) / 60000), 0);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export const CONNECTOR_LABELS = {
  CCS2: 'CCS2',
  CHAdeMO: 'CHAdeMO',
  Type2_AC: 'Type 2 AC',
  Bharat_AC001: 'Bharat AC',
  Bharat_DC001: 'Bharat DC',
  'GB/T': 'GB/T',
  Wall_3pin: '3-pin Wall',
};

export function connectorLabel(type) {
  return CONNECTOR_LABELS[type] || type;
}

export function maxPowerKw(charger) {
  return Math.max(...(charger.connectors || []).map((c) => c.power_kw || 0), 0);
}
