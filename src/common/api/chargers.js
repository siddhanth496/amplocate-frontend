import { api } from '../utils/apiClient';

/**
 * @param {{ lat: number, lng: number, radius_km?: number, connector_type?: string,
 *   min_power_kw?: number, min_reliability?: number, vehicle_id?: string, limit?: number }} params
 */
export function getNearby(params = {}, options = {}) {
  return api.get('/chargers/nearby', { params, signal: options.signal });
}

export function getCharger(chargerId, options = {}) {
  return api.get(`/chargers/${encodeURIComponent(chargerId)}`, { signal: options.signal });
}
