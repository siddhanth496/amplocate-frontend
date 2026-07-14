import { api } from '../utils/apiClient';

/**
 * @param {string} chargerId
 * @param {{ report_type: 'working'|'broken'|'ice_blocked'|'queue'|'check_in',
 *   comment?: string, photo_url?: string }} payload
 */
export function submitReport(chargerId, payload) {
  return api.post(`/chargers/${encodeURIComponent(chargerId)}/reports`, payload);
}
