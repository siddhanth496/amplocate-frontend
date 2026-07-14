export function normalizePhone(input) {
  if (!input) return '';
  const trimmed = String(input).trim().replace(/\s+/g, '');
  const hasCountry = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/[^\d+]/g, '');
  if (hasCountry) return digitsOnly;
  const stripped = digitsOnly.replace(/^0+/, '');
  return `+91${stripped}`;
}

export function digitsOnly(input) {
  return String(input ?? '').replace(/\D/g, '');
}

export function isValidIndianPhone(input) {
  const normalized = normalizePhone(input);
  return /^\+91\d{10}$/.test(normalized);
}

export function isValidOtp(input, length = 6) {
  const value = digitsOnly(input);
  return value.length === length;
}
