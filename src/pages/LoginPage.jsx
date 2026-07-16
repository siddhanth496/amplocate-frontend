import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Zap, MapPin, Route } from 'lucide-react';
import Logo from '../components/Logo';
import { sendOtp, verifyOtp } from '../common/api/auth';
import { isValidIndianPhone, isValidOtp, digitsOnly } from '../common/utils/phone';
import { useAuth } from '../contexts/useAuth';

const FEATURES = [
  { icon: MapPin, title: 'Find working chargers', desc: 'Community-verified reliability scores before you drive there.' },
  { icon: Route, title: 'Risk-free trip planning', desc: 'Every plan keeps a safety reserve and a backup charger.' },
  { icon: Zap, title: 'Compatibility built in', desc: 'Only see chargers that fit your EV’s connector.' },
];

export default function LoginPage() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (status === 'authenticated') {
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  const submitPhone = async (e) => {
    e?.preventDefault();
    if (!isValidIndianPhone(phone)) { setError('Enter a valid 10-digit mobile number'); return; }
    setBusy(true); setError(null);
    try {
      const res = await sendOtp(phone);
      setDevOtp(res?.dev_otp || null);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  const submitOtp = async (e) => {
    e?.preventDefault();
    if (!isValidOtp(otp)) { setError('Enter the 6-digit code'); return; }
    setBusy(true); setError(null);
    try {
      const res = await verifyOtp(phone, otp);
      signIn(res.access_token, res.is_new_user);
      navigate(res.is_new_user ? '/add-vehicle' : (location.state?.from || '/'), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="h-full flex" style={{ background: 'var(--color-bg)' }}>
      {/* Left brand panel (desktop) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-12"
        style={{ background: 'linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 40%, #0ea5e9 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <svg width={36} height={36} viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#fff" /><path d="M35 10 L18 37 h11 l-4 17 L44 26 h-11 z" fill="#2563eb" /></svg>
          <span className="text-xl font-bold text-white tracking-tight">Amplocate</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold text-white leading-tight max-w-md">
            Charge with confidence, everywhere.
          </h1>
          <div className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="p-2.5 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon size={20} color="#fff" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{title}</div>
                  <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          The trust layer for EV charging in India.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm screen-fade">
          <div className="lg:hidden mb-10 flex justify-center"><Logo size={40} wordmarkClass="text-2xl" /></div>

          {step === 'phone' ? (
            <form onSubmit={submitPhone}>
              <h2 className="font-display text-2xl font-bold">Welcome</h2>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Log in or sign up with your mobile number.
              </p>
              <label className="block mt-8 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
                Mobile number
              </label>
              <div
                className="mt-2 flex items-center rounded-2xl overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-dark)' }}
              >
                <span className="pl-4 pr-2 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>+91</span>
                <input
                  autoFocus
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 10))}
                  className="flex-1 py-3.5 pr-4 text-base font-medium outline-none bg-transparent"
                />
              </div>
              {error && <p className="mt-3 text-sm" style={{ color: 'var(--color-rose)' }}>{error}</p>}
              <button
                type="submit"
                disabled={busy || phone.length !== 10}
                className="tap mt-6 w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}
              >
                {busy ? 'Sending…' : 'Send OTP'}
              </button>
              <p className="mt-6 text-xs text-center flex items-center justify-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                <ShieldCheck size={13} /> We never share your number. No spam, ever.
              </p>
            </form>
          ) : (
            <form onSubmit={submitOtp}>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
                className="tap flex items-center gap-1 text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronLeft size={16} /> Change number
              </button>
              <h2 className="text-2xl font-bold mt-4">Verify it&apos;s you</h2>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Enter the 6-digit code sent to <span className="font-semibold">+91 {phone}</span>
              </p>
              {devOtp && (
                <div
                  className="mt-4 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)', border: '1px solid rgba(217,119,6,0.2)' }}
                >
                  Dev mode — your code is <span className="font-mono font-bold">{devOtp}</span>
                </div>
              )}
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(digitsOnly(e.target.value).slice(0, 6))}
                className="mt-6 w-full py-4 rounded-2xl text-center text-2xl font-bold tracking-[0.5em] outline-none"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-dark)' }}
              />
              {error && <p className="mt-3 text-sm" style={{ color: 'var(--color-rose)' }}>{error}</p>}
              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="tap mt-6 w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}
              >
                {busy ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={submitPhone}
                disabled={busy}
                className="tap mt-3 w-full py-2 text-sm font-semibold"
                style={{ color: 'var(--color-brand)' }}
              >
                Resend code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
