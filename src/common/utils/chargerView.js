import { formatKm } from './format';

const DEFAULT_AMENITIES = [];

export function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function formatDistance(distance_m, distance_km) {
  if (distance_km != null) return formatKm(distance_km);
  if (distance_m != null) return formatKm(distance_m / 1000);
  return '—';
}

function formatPorts(charger) {
  const free = charger.ports_available ?? charger.free_ports ?? charger.available_ports;
  const total = charger.ports_total ?? charger.total_ports ?? charger.port_count;
  if (typeof charger.ports === 'string') return charger.ports;
  if (free != null && total != null) return `${free}/${total} free`;
  if (free != null) return `${free} free`;
  return '— free';
}

function formatSpeed(charger) {
  if (charger.speed) return charger.speed;
  const kw = charger.max_power_kw ?? charger.power_kw ?? charger.max_kw;
  return kw != null ? `${kw} kW` : '—';
}

/**
 * Map an API charger payload into the shape the UI components already expect.
 * Keeps the original object accessible via `_raw` for detail screens.
 * @param {Record<string, any>} c
 */
export function normalizeCharger(c) {
  if (!c || typeof c !== 'object') return null;
  const score = c.reliability_score ?? c.score ?? null;
  return {
    id: c.id,
    name: c.name ?? 'Unnamed station',
    op: c.operator ?? c.op ?? '—',
    dist: formatDistance(c.distance_m, c.distance_km),
    eta: c.eta ?? (c.eta_min != null ? `${Math.round(c.eta_min)} min` : ''),
    price: c.price_per_kwh ?? c.price ?? null,
    unit: '/kWh',
    score,
    ports: formatPorts(c),
    speed: formatSpeed(c),
    verified: c.verified_count ?? c.verified ?? 0,
    when: c.last_verified_at ?? c.when ?? '',
    amenities: c.amenities ?? DEFAULT_AMENITIES,
    flag: c.flag ?? null,
    latitude: c.latitude ?? null,
    longitude: c.longitude ?? null,
    _raw: c,
  };
}
