import { api } from '../utils/apiClient';
import { normalizePhone } from '../utils/phone';

/** @returns {Promise<{ message: string, dev_otp: string|null }>} */
export function sendOtp(phoneNumber) {
  return api.post(
    '/auth/otp/request',
    { phone: normalizePhone(phoneNumber) },
    { auth: false },
  );
}

/** @returns {Promise<{ access_token: string, token_type: string, is_new_user: boolean }>} */
export function verifyOtp(phoneNumber, otp) {
  return api.post(
    '/auth/otp/verify',
    { phone: normalizePhone(phoneNumber), code: String(otp) },
    { auth: false },
  );
}
