import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Route, Car, ChevronRight, X } from 'lucide-react';
import { AmpMark } from './Logo';

const SEEN_KEY = 'amplocate.welcome_seen';

export function hasSeenWelcome() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}
export function markWelcomeSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
}

const SLIDES = [
  {
    Icon: ShieldCheck,
    title: 'Know before you go',
    body: 'Every charger carries a reliability score built from real driver reports — so you can see which ones actually work before you drive there.',
    art: 'ring',
  },
  {
    Icon: Route,
    title: 'Trips that never strand you',
    body: 'Plan a journey and we pick charging stops you can definitely reach — always keeping 15% battery in reserve, always with a verified backup charger.',
    art: 'route',
  },
  {
    Icon: Car,
    title: 'Matched to your EV',
    body: 'Add your car once and we only show chargers with a plug that fits, sorted by what is closest and most reliable.',
    art: 'car',
  },
];

function SlideArt({ kind }) {
  if (kind === 'ring') {
    const c = 2 * Math.PI * 34;
    return (
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="34" fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
        <circle cx="48" cy="48" r="34" fill="none" stroke="var(--color-brand)" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * 0.12}
          transform="rotate(-90 48 48)" />
        <text x="48" y="54" textAnchor="middle" fontSize="20" fontWeight="700"
          fill="var(--color-text-primary)" fontFamily="Space Grotesk, sans-serif">88</text>
      </svg>
    );
  }
  if (kind === 'route') {
    return (
      <svg width="140" height="96" viewBox="0 0 140 96">
        <path d="M14 72 C 46 72, 46 24, 78 24 S 118 60, 126 60" fill="none"
          stroke="var(--color-brand)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 0" />
        <circle cx="14" cy="72" r="7" fill="var(--color-brand)" />
        <circle cx="78" cy="24" r="9" fill="var(--color-brand)" opacity="0.25" />
        <circle cx="78" cy="24" r="5" fill="var(--color-brand)" />
        <circle cx="126" cy="60" r="7" fill="var(--color-rose)" />
      </svg>
    );
  }
  return (
    <svg width="120" height="96" viewBox="0 0 120 96">
      <rect x="18" y="40" width="84" height="30" rx="10" fill="var(--color-surface-2)" />
      <rect x="30" y="28" width="60" height="20" rx="8" fill="var(--color-surface-2)" />
      <circle cx="38" cy="72" r="9" fill="var(--color-brand)" />
      <circle cx="82" cy="72" r="9" fill="var(--color-brand)" />
      <path d="M64 12 L54 32 h7 l-3 12 L72 26 h-7 z" fill="var(--color-brand)" />
    </svg>
  );
}

/** First-run explainer. Shown once, skippable, ends by pointing at the first action. */
export default function WelcomeOverlay({ onClose }) {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const finish = (goAddVehicle) => {
    markWelcomeSeen();
    onClose?.();
    if (goAddVehicle) navigate('/add-vehicle');
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(6,8,10,0.72)', backdropFilter: 'blur(6px)', zIndex: 2000 }}>
      <div className="w-full max-w-md rounded-3xl p-6 screen-fade relative"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>

        <button onClick={() => finish(false)} aria-label="Skip introduction"
          className="tap absolute top-4 right-4 p-1.5 rounded-lg"
          style={{ color: 'var(--color-text-tertiary)' }}>
          <X size={16} />
        </button>

        <div className="flex items-center gap-2.5">
          <AmpMark size={30} />
          <span className="font-display font-bold">
            Amp<span className="amp-gradient-text">locate</span>
          </span>
        </div>

        <div className="flex items-center justify-center h-32 mt-5">
          <SlideArt kind={slide.art} />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <slide.Icon size={16} style={{ color: 'var(--color-brand)' }} />
          <h2 className="font-display text-xl font-bold">{slide.title}</h2>
        </div>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {slide.body}
        </p>

        <div className="flex items-center gap-1.5 mt-5">
          {SLIDES.map((_, n) => (
            <button key={n} onClick={() => setI(n)} aria-label={`Step ${n + 1}`}
              className="tap rounded-full transition-all"
              style={{
                width: n === i ? 22 : 7, height: 7,
                background: n === i ? 'var(--color-brand)' : 'var(--color-surface-2)',
              }} />
          ))}
          <div className="flex-1" />
          {!last && (
            <button onClick={() => finish(false)} className="tap text-xs font-semibold px-3 py-2"
              style={{ color: 'var(--color-text-tertiary)' }}>
              Skip
            </button>
          )}
          <button
            onClick={() => (last ? finish(true) : setI(i + 1))}
            className="tap flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}
          >
            {last ? 'Add my EV' : 'Next'} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
