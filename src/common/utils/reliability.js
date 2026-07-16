export function relColor(score) {
  if (score >= 0.85) return 'var(--color-rel-excellent)';
  if (score >= 0.7) return 'var(--color-rel-good)';
  if (score >= 0.5) return 'var(--color-rel-moderate)';
  return 'var(--color-rel-poor)';
}

export function relHex(score) {
  if (score >= 0.85) return '#a3e635';
  if (score >= 0.7) return '#4ade80';
  if (score >= 0.5) return '#fbbf24';
  return '#f87171';
}

export function relLabel(score) {
  if (score >= 0.85) return 'Excellent';
  if (score >= 0.7) return 'Good';
  if (score >= 0.5) return 'Moderate';
  return 'Unreliable';
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
