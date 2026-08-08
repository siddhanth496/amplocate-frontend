import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Flag, Check, ChevronRight, X, Sparkles } from 'lucide-react';
import { getMyStats } from '../common/api/users';

const DISMISS_KEY = 'amplocate.getting_started_dismissed';
const VIEWED_KEY = 'amplocate.viewed_charger';

export function markChargerViewed() {
  try { localStorage.setItem(VIEWED_KEY, '1'); } catch { /* ignore */ }
}

/** Three-step checklist that tracks real progress and removes itself once done.
 *  Answers "what do I do here?" without a tour the user has to sit through. */
export default function GettingStarted({ hasVehicle }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [reports, setReports] = useState(0);
  const viewed = (() => {
    try { return localStorage.getItem(VIEWED_KEY) === '1'; } catch { return false; }
  })();

  useEffect(() => {
    getMyStats().then((s) => setReports(s.reports_count || 0)).catch(() => {});
  }, []);

  const steps = [
    { Icon: Car, label: 'Add your EV', hint: 'so we can show plugs that fit', done: hasVehicle,
      action: () => navigate('/add-vehicle') },
    { Icon: MapPin, label: 'Open a charger', hint: 'see its reliability score and reviews', done: viewed,
      action: null },
    { Icon: Flag, label: 'Report one you have used', hint: 'your report improves everyone’s score', done: reports > 0,
      action: () => navigate('/report') },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (dismissed || doneCount === steps.length) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="rounded-3xl p-4 relative" style={{ background: 'var(--amp-gradient-soft)', border: '1px solid var(--color-border)' }}>
      <button onClick={dismiss} aria-label="Dismiss getting started"
        className="tap absolute top-3 right-3 p-1" style={{ color: 'var(--color-text-tertiary)' }}>
        <X size={14} />
      </button>

      <div className="flex items-center gap-1.5">
        <Sparkles size={13} style={{ color: 'var(--color-brand)' }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-brand)' }}>
          Get started · {doneCount} of {steps.length}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {steps.map(({ Icon, label, hint, done, action }) => (
          <button
            key={label}
            onClick={action || undefined}
            disabled={done || !action}
            className="tap w-full flex items-center gap-3 p-2.5 rounded-2xl text-left disabled:cursor-default"
            style={{ background: done ? 'transparent' : 'var(--color-surface)', opacity: done ? 0.55 : 1 }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: done ? 'var(--color-emerald-light)' : 'var(--color-brand-light)' }}>
              {done ? <Check size={14} style={{ color: 'var(--color-emerald)' }} strokeWidth={3} />
                    : <Icon size={14} style={{ color: 'var(--color-brand)' }} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[13px] font-semibold ${done ? 'line-through' : ''}`}>{label}</div>
              <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{hint}</div>
            </div>
            {!done && action && <ChevronRight size={15} style={{ color: 'var(--color-text-tertiary)' }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
