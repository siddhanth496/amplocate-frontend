import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Navigation, Flag, Zap, IndianRupee, Clock, MapPin,
  CheckCircle2, XCircle, Car, Users, Coffee,
} from 'lucide-react';
import MapView from '../components/MapView';
import { getCharger } from '../common/api/chargers';
import { submitReport } from '../common/api/reports';
import { relColor, relLabel, relPct, timeAgo, connectorLabel } from '../common/utils/reliability';

const REPORT_META = {
  working: { icon: CheckCircle2, label: 'Working', color: 'var(--color-emerald)' },
  broken: { icon: XCircle, label: 'Broken', color: 'var(--color-rose)' },
  ice_blocked: { icon: Car, label: 'ICE blocked', color: 'var(--color-amber)' },
  queue: { icon: Users, label: 'Queue', color: 'var(--color-amber)' },
  check_in: { icon: MapPin, label: 'Check-in', color: 'var(--color-brand)' },
};

function ScoreRing({ score }) {
  const pct = Math.round(score * 100);
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: 110, height: 110 }}>
      <svg width={110} height={110}>
        <circle cx={55} cy={55} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={9} />
        <circle
          cx={55} cy={55} r={r} fill="none"
          stroke={relColor(score)} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score)}
          transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{pct}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
          reliable
        </span>
      </div>
    </div>
  );
}

export default function ChargerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [charger, setCharger] = useState(null);
  const [error, setError] = useState(null);
  const [reporting, setReporting] = useState(null); // report_type in flight
  const [reportDone, setReportDone] = useState(null);

  const load = () => getCharger(id).then(setCharger).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const quickReport = async (type) => {
    setReporting(type); setReportDone(null);
    try {
      await submitReport(id, { report_type: type });
      setReportDone(type);
      await load();
    } catch (e) {
      setError(e.message);
    } finally { setReporting(null); }
  };

  if (error && !charger) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="tap flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div className="mt-6 p-4 rounded-2xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>
      </div>
    );
  }
  if (!charger) {
    return <div className="h-full flex items-center justify-center">
      <div className="spin rounded-full" style={{ width: 32, height: 32, border: '3px solid var(--color-surface-2)', borderTopColor: 'var(--color-brand)' }} />
    </div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8 pb-24 lg:pb-10 screen-fade">
      <button onClick={() => navigate(-1)} className="tap flex items-center gap-1 text-sm font-medium mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        <ChevronLeft size={16} /> Back to map
      </button>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* Main column */}
        <div className="space-y-5">
          {/* Header card */}
          <div className="p-5 lg:p-6 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="font-display text-xl lg:text-2xl font-bold leading-tight">{charger.name}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {charger.operator} · {charger.address || charger.city}
                </p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--color-surface-alt)', color: relColor(charger.reliability_score) }}>
                    {relLabel(charger.reliability_score)}
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    <Clock size={12} /> verified {timeAgo(charger.last_verified_at)}
                  </span>
                  {charger.status && (
                    <span className="text-xs font-medium capitalize" style={{ color: charger.status === 'broken' ? 'var(--color-rose)' : 'var(--color-text-tertiary)' }}>
                      · {charger.status}
                    </span>
                  )}
                </div>
              </div>
              <ScoreRing score={charger.reliability_score} />
            </div>

            <div className="flex gap-2.5 mt-5">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${charger.lat},${charger.lng}`}
                target="_blank" rel="noreferrer"
                className="tap flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}
              >
                <Navigation size={16} /> Navigate
              </a>
              <button
                onClick={() => navigate(`/report/${charger.id}`)}
                className="tap flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}
              >
                <Flag size={15} /> Report
              </button>
            </div>
          </div>

          {/* Connectors */}
          <div className="p-5 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-bold mb-3">Connectors</h2>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {charger.connectors.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--color-surface-alt)' }}>
                  <div className="p-2 rounded-xl" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                    <Zap size={17} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{connectorLabel(c.type)}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {c.power_kw} kW · {c.count || 1} gun{(c.count || 1) > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {charger.price_per_kwh != null && (
                <span className="flex items-center gap-1 font-medium">
                  <IndianRupee size={14} /> {charger.price_per_kwh}/kWh
                </span>
              )}
              {charger.amenities?.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Coffee size={14} />
                  {charger.amenities.map((a) => a.replace('_', ' ')).join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Quick report */}
          <div className="p-5 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-bold">Been here just now?</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Your report updates the reliability score for everyone.
            </p>
            {reportDone && (
              <div className="mt-3 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'var(--color-emerald-light)', color: 'var(--color-emerald)' }}>
                Thanks — “{REPORT_META[reportDone].label}” recorded.
              </div>
            )}
            {error && charger && (
              <div className="mt-3 px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(REPORT_META).map(([type, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    disabled={!!reporting}
                    onClick={() => quickReport(type)}
                    className="tap flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50"
                    style={{ background: 'var(--color-surface-alt)', color: meta.color }}
                  >
                    <Icon size={14} /> {reporting === type ? 'Sending…' : meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent reports */}
          {charger.recent_reports?.length > 0 && (
            <div className="p-5 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-sm font-bold mb-3">Recent community reports</h2>
              <div className="space-y-2.5">
                {charger.recent_reports.map((r) => {
                  const meta = REPORT_META[r.report_type] || REPORT_META.check_in;
                  const Icon = meta.icon;
                  return (
                    <div key={r.id} className="flex items-center gap-3 text-sm">
                      <Icon size={16} style={{ color: meta.color }} className="shrink-0" />
                      <span className="font-medium">{meta.label}</span>
                      {r.comment && <span className="truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>“{r.comment}”</span>}
                      <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>{timeAgo(r.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Map column */}
        <div className="rounded-3xl overflow-hidden h-[260px] lg:h-auto lg:min-h-[420px]"
          style={{ border: '1px solid var(--color-border)' }}>
          <MapView center={[charger.lat, charger.lng]} zoom={15} chargers={[charger]} popup={false} />
        </div>
      </div>
    </div>
  );
}
