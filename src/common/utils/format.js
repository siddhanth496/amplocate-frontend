export function formatINR(amount, { decimals = 0 } = {}) {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDistance(meters) {
  if (meters == null) return '—';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function formatKm(km) {
  if (km == null) return '—';
  return `${Number(km).toFixed(km < 10 ? 1 : 0)} km`;
}

export function formatRelativeTime(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return '';
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
