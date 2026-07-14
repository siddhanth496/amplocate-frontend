import { api } from '../utils/apiClient';

/** Built-in EV catalog (make/model/battery/connectors). */
export function getCatalog(options = {}) {
  return api.get('/vehicles/catalog', { auth: false, signal: options.signal });
}

export function listMyVehicles(options = {}) {
  return api.get('/vehicles', { signal: options.signal });
}

/**
 * @param {{ catalog_id?: string, battery_soc?: number, is_default?: boolean }} payload
 */
export function addVehicle(payload) {
  return api.post('/vehicles', payload);
}

export function updateVehicle(vehicleId, { battery_soc, is_default } = {}) {
  return api.patch(`/vehicles/${encodeURIComponent(vehicleId)}`, { battery_soc, is_default });
}

export function setDefaultVehicle(vehicleId) {
  return updateVehicle(vehicleId, { is_default: true });
}

export function updateBattery(vehicleId, batteryPct) {
  return updateVehicle(vehicleId, { battery_soc: batteryPct });
}

export function deleteVehicle(vehicleId) {
  return api.delete(`/vehicles/${encodeURIComponent(vehicleId)}`);
}
