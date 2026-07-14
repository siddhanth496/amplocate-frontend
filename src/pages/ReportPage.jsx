import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, Car, Users, MapPin, Search } from 'lucide-react';
import { getNearby, getCharger } from '../common/api/chargers';
import { submitReport } from '../common/api/reports';
import { relPct } from '../common/utils/reliability';

const TYPES = [
  { type: 'working', icon: CheckCircle2, label: 'Charger is working', desc: 'Charged successfully or saw it in use', color: 'var(--color-emerald)', bg: 'var(--color-emerald-light)' },
  { type: 'broken', icon: XCircle, label: 'Charger is broken', desc: 'Out of order, errored, or won’t start', color: 'var(--color-rose)', bg: 'var(--color-rose-light)' },
  { type: 'ice_blocked', icon: Car, label: 'Spot is blocked', desc: 'A non-EV vehicle is parked in the bay', color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
  { type: 'queue', icon: Users, label: 'There’s a queue', desc: 'Waiting time before you can plug in', color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
  { type: 'check_in', icon: MapPin, label: 'Just checking in', desc: 'I’m here — helps confirm activity', color: 'var(--color-brand)', bg: 'var(--color-brand-light)' },
];

export default function ReportPage() {
  const { chargerId } = useParams();
  const navigate = useNavigate();
  const [charger, setCharger] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // load target charger, or nearby list to pick from
  useEffect(() => {
    setDone(false); setError(null); setType(null);
    if (chargerId) {
      getCharger(chargerId).then(setCharger).catch((e) => setError(e.message));
    } else {
      setCharger(null);
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          getNearby({ lat: pos.coords.latitude, lng: pos.coords.longitude, radius_km: 10, limit: 20 })
            .then(setNearby).catch((e) => setError(e.message));
        },
        () => {
          getNearby({ lat: 12.9716, lng: 77.5946, radius_km: 15, limit: 20 })
            .then(setNearby).catch((e) => setError(e.message));
        },
        { timeout: 4000 },
      );
    }
  }, [chargerId]);

  const submit = async () => {
    if (!type) return;
    setBusy(true); setError(null);
    try {
      await submitReport(chargerId, { report_type: type, comment: comment || undefined });
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  // ---- Charger picker mode ----
  if (!chargerId) {
    const filtered = nearby.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-8 pb-24 screen-fade">
        <h1 className="text-xl font-bold">Report a charger</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Pick the station you want to report on.
        </p>
        <div className="mt-4 flex items-center gap-2 px-4 rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-dark)' }}>
          <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nearby chargers…"
            className="flex-1 py-3 outline-none bg-transparent text-sm"
          />
        </div>
        {error && <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>}
        <div className="mt-4 space-y-2 animate-stagger">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => navigate(`/report/${c.id}`)}
              className="tap w-full text-left p-4 rounded-2xl flex items-center justify-between gap-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{c.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {c.distance_km} km · {relPct(c.reliability_score)} reliable
                </div>
              </div>
              <ChevronLeft size={16} className="rotate-180 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---- Success ----
  if (done) {
    return (
      <div className="max-w-md mx-auto p-6 pt-20 text-center screen-fade">
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--color-emerald-light)' }}>
          <CheckCircle2 size={30} style={{ color: 'var(--color-emerald)' }} />
        </div>
        <h1 className="text-xl font-bold mt-5">Thanks for helping the community!</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Your report has been recorded and the reliability score for
          <span className="font-semibold"> {charger?.name}</span> is already updated.
        </p>
        <div className="flex gap-2.5 mt-8">
          <button onClick={() => navigate(`/charger/${chargerId}`)} className="tap flex-1 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: 'var(--color-brand)' }}>
            Back to charger
          </button>
          <button onClick={() => navigate('/')} className="tap flex-1 py-3 rounded-2xl text-sm font-bold" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-dark)' }}>
            Discover
          </button>
        </div>
      </div>
    );
  }

  // ---- Report form ----
  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 pb-24 screen-fade">
      <button onClick={() => navigate(-1)} className="tap flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        <ChevronLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-bold mt-3">What did you find?</h1>
      {charger && (
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Reporting on <span className="font-semibold">{charger.name}</span> · {charger.operator}
        </p>
      )}

      <div className="mt-5 space-y-2.5">
        {TYPES.map(({ type: t, icon: Icon, label, desc, color, bg }) => (
          <button key={t} onClick={() => setType(t)}
            className="tap w-full flex items-center gap-4 p-4 rounded-2xl text-left"
            style={{
              background: 'var(--color-surface)',
              border: `1.5px solid ${type === t ? color : 'var(--color-border)'}`,
              boxShadow: type === t ? 'var(--shadow-md)' : 'none',
            }}>
            <div className="p-2.5 rounded-xl shrink-0" style={{ background: bg, color }}>
              <Icon size={19} />
            </div>
            <div>
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a note (optional) — e.g. “Gun 2 works, gun 1 errored”"
        rows={3}
        className="mt-4 w-full p-4 rounded-2xl text-sm outline-none resize-none"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-dark)' }}
      />

      {error && <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>}

      <button
        onClick={submit}
        disabled={!type || busy}
        className="tap mt-5 w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
        style={{ background: 'var(--color-brand)', boxShadow: 'var(--shadow-md)' }}
      >
        {busy ? 'Submitting…' : 'Submit report'}
      </button>
    </div>
  );
}
