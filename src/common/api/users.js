import { api } from '../utils/apiClient';

export function getMe(options = {}) {
  return api.get('/auth/me', { signal: options.signal });
}

export function updateMe(updates) {
  return api.patch('/auth/me', updates);
}
