import { api } from '../utils/apiClient';

export function startSession({ charger_id, vehicle_id }) {
  return api.post('/chargers/sessions/start', { charger_id, vehicle_id });
}

export function endSession(sessionId, { successful, energy_kwh }) {
  return api.post(`/chargers/sessions/${encodeURIComponent(sessionId)}/end`, {
    successful,
    energy_kwh,
  });
}
