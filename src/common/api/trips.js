import { api } from '../utils/apiClient';

/**
 * Risk-free single-stop trip plan.
 * @param {{ origin: {lat:number,lng:number}, destination: {lat:number,lng:number},
 *   vehicle_id: string, departure_soc?: number }} payload
 */
export function planTrip(payload) {
  return api.post('/trips/plan', payload);
}
