const TOKEN_KEY = 'amplocate.auth.token';
const ONBOARDED_KEY = 'amplocate.onboarded';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore — storage may be blocked
  }
}

export function clearToken() {
  setToken(null);
}

export function isOnboarded() {
  try { return localStorage.getItem(ONBOARDED_KEY) === '1'; } catch { return false; }
}

export function markOnboarded() {
  try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch {}
}
