import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route as RouteIcon, BatteryCharging, Clock, IndianRupee, History,
  ShieldCheck, AlertTriangle, Navigation, ChevronRight, ArrowUpDown, Zap,
  Circle, MapPin, Flag, Plus, X, Sparkles,
} from 'lucide-react';
import MapView from '../components/MapView';
import LocationSearch from '../components/LocationSearch';
import { planTrip } from '../common/api/trips';
import { listMyVehicles } from '../common/api/vehicles';
import { relColor, relPct } from '../common/utils/reliability';

const RECENTS_KEY = 'amplocate.recentTrips.v2';
const MAX_WAYPOINTS = 5;

function loadRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY)) || []; } catch { return []; }
}
function saveRecent(origin, waypoints, dest) {
  const entry = { origin, waypoints, dest, at: Date.now() };
  const key = (r) => [r.origin.label, ...(r.waypoints || []).map((w) => w.label), r.dest.label].join('|');
  const list = [entry, ...loadRecents().filter((r) => key(r) !== key(entry))].slice(0, 4);
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function RelRing({ score, size = 38 }) {
  const r = (size - 7) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={3.5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={relColor(score)} strokeWidth={3.5} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums">
        {Math.round(score * 100)}
      </span>
    </div>
  );
}

/* ── Stops editor: From → via… → To ─────────────────────────────────── */
function StopsEditor({ points, activeField, setActiveField, onSwap, onAddWaypoint, onRemoveWaypoint, children }) {
  const rows = [
    { id: 'origin', label: 'From', value: points.origin, icon: Circle, color: 'var(--color-brand)' },
    ...points.waypoints.map((w, i) => ({
      id: `wp-${i}`, label: `Stop ${i + 1}`, value: w, icon: MapPin, color: 'var(--color-amber)', removable: true, wpIndex: i,
    })),
    { id: 'dest', label: 'To', value: points.dest, icon: Flag, color: 'var(--color-rose)' },
  ];

  return (
    <div className="rounded-3xl px-4"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          {rows.map((row, idx) => {
            const Icon = row.icon;
            const active = activeField === row.id;
            return (
              <div key={row.id}>
                {idx > 0 && <div style={{ borderTop: '1px dashed var(--color-border-dark)', marginLeft: 27 }} />}
                <div className="flex items-center">
                  <button onClick={() => setActiveField(active ? null : row.id)}
                    className="tap flex-1 min-w-0 flex items-center gap-3 py-2.5 text-left">
                    <Icon size={15} style={{ color: row.color }} className="shrink-0"
                      fill={row.id === 'origin' ? row.color : 'none'} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: active ? 'var(--color-brand)' : 'var(--color-text-tertiary)' }}>
                        {row.label}
                      </div>
                      <div className="text-sm font-semibold truncate"
                        style={{ color: row.value ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                        {row.value ? row.value.label : (row.id === 'dest' ? 'Where to?' : 'Choose a place')}
                      </div>
                    </div>
                  </button>
                  {row.removable && (
                    <button onClick={() => onRemoveWaypoint(row.wpIndex)} aria-label="Remove stop"
                      className="tap p-1.5 rounded-lg shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-1.5 ml-2 shrink-0">
          <button onClick={onSwap} aria-label="Swap start and destination"
            className="tap p-2.5 rounded-xl" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
            <ArrowUpDown size={15} />
          </button>
          {points.waypoints.length < MAX_WAYPOINTS && (
            <button onClick={onAddWaypoint} aria-label="Add a stop"
              className="tap p-2.5 rounded-xl" style={{ background: 'var(--amp-gradient-soft)', color: 'var(--color-brand)' }}>
              <Plus size={15} />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function SocBar({ from, to, danger = false }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ background: 'var(--color-surface-2)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{
          width: `${Math.max(from, to)}%`, opacity: 0.35,
          background: danger ? 'var(--color-rose)' : 'var(--amp-gradient)',
        }} />
        <div className="absolute inset-y-0 left-0 rounded-full" style={{
          width: `${Math.min(from, to)}%`,
          background: danger ? 'var(--color-rose)' : 'var(--amp-gradient)',
        }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        {Math.round(from)}% → {Math.round(to)}%
      </span>
    </div>
  );
}

/* ── Alternative charger suggestions ────────────────────────────────── */
function Alternatives({ stop, onPick, busy }) {
  if (!stop.alternatives?.length) return null;
  return (
    <div className="mt-3">
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"
        style={{ color: 'var(--color-text-tertiary)' }}>
        <Sparkles size={11} /> Other chargers on this leg
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
        {stop.alternatives.map((alt) => (
          <div key={alt.charger.id} className="shrink-0 w-[190px] p-3 rounded-2xl"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)' }}>
            <div className="flex items-center gap-2">
              <RelRing score={alt.charger.reliability_score} size={32} />
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">{alt.charger.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  ~{Math.round(alt.dwell_minutes)} min · arrive {Math.round(alt.arrival_soc)}%
                </div>
              </div>
            </div>
            <button
              disabled={busy}
              onClick={() => onPick(stop.leg_index, alt.charger.id)}
              className="tap mt-2 w-full py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
              style={{ background: 'var(--color-surface)', color: 'var(--color-brand)', border: '1px solid var(--color-border)' }}
            >
              Use this charger
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Journey timeline ───────────────────────────────────────────────── */
function Timeline({ plan, points, soc, navigate, onPickAlternative, busy }) {
  const allNames = [points.origin, ...points.waypoints, points.dest];
  const stopsByLeg = {};
  for (const s of plan.stops) stopsByLeg[s.leg_index] = s;

  const Row = ({ dot, line, children }) => (
    <div className="flex gap-3">
      <div className="flex flex-col items-center" style={{ width: 20 }}>
        {dot}
        {line && <div className="flex-1 my-1 rounded-full" style={{ width: 3, background: 'var(--amp-gradient)', opacity: 0.35 }} />}
      </div>
      <div className="flex-1 min-w-0 pb-4">{children}</div>
    </div>
  );

  const rows = [];
  let runningSoc = soc;
  allNames.forEach((pt, i) => {
    const isLast = i === allNames.length - 1;
    rows.push(
      <Row key={`p-${i}`} line={!isLast}
        dot={i === 0
          ? <Circle size={14} fill="var(--color-brand)" style={{ color: 'var(--color-brand)', marginTop: 3 }} />
          : isLast
            ? <Flag size={14} style={{ color: 'var(--color-rose)', marginTop: 3 }} />
            : <MapPin size={14} style={{ color: 'var(--color-amber)', marginTop: 3 }} />}>
        <div className="font-display text-sm font-bold truncate">{pt?.label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          {i === 0 ? `Departing at ${Math.round(runningSoc)}% battery` : isLast
            ? `Arriving with ~${plan.destination_arrival_soc}% battery`
            : 'Via stop'}
        </div>
      </Row>,
    );
    const stop = stopsByLeg[i];
    if (stop && !isLast) {
      rows.push(
        <Row key={`s-${i}`} line
          dot={
            <div className="rounded-full p-1.5 mt-0.5 pulse-dot" style={{ background: 'var(--amp-gradient)' }}>
              <BatteryCharging size={12} color="#fff" />
            </div>
          }>
          <div className="p-3 rounded-2xl -mt-1" style={{ background: 'var(--amp-gradient-soft)' }}>
            <button onClick={() => navigate(`/charger/${stop.charger.id}`)} className="tap w-full text-left">
              <div className="flex items-center gap-2.5">
                <RelRing score={stop.charger.reliability_score} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-bold truncate">{stop.charger.name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {stop.charger.operator} · {relPct(stop.charger.reliability_score)} reliable
                  </div>
                </div>
                <ChevronRight size={15} className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
            </button>
            <div className="mt-2.5"><SocBar from={stop.arrival_soc} to={stop.target_soc} /></div>
            <div className="flex items-center gap-3 mt-2 text-xs font-semibold flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="flex items-center gap-1"><Clock size={12} /> ~{Math.round(stop.dwell_minutes)} min</span>
              <span className="flex items-center gap-1"><Zap size={12} /> +{stop.energy_to_add_kwh} kWh</span>
              {stop.estimated_cost != null && (
                <span className="flex items-center gap-1"><IndianRupee size={12} /> ~₹{Math.round(stop.estimated_cost)}</span>
              )}
            </div>
            {stop.backup_charger && (
              <div className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold p-2 rounded-lg"
                style={{ background: 'var(--color-emerald-light)', color: 'var(--color-emerald)' }}>
                <ShieldCheck size={13} className="shrink-0 mt-px" />
                Backup verified: {stop.backup_charger.name}
              </div>
            )}
            <Alternatives stop={stop} onPick={onPickAlternative} busy={busy} />
          </div>
        </Row>,
      );
      runningSoc = stop.target_soc;
    }
  });

  const gmapsWaypoints = [
    ...points.waypoints.map((w) => `${w.lat},${w.lng}`),
    ...plan.stops.map((s) => `${s.charger.lat},${s.charger.lng}`),
  ].join('|');

  return (
    <div className="p-4 rounded-3xl screen-fade" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      {rows}
      <a
        href={`https://www.google.com/maps/dir/?api=1&origin=${points.origin.lat},${points.origin.lng}&destination=${points.dest.lat},${points.dest.lng}${gmapsWaypoints ? `&waypoints=${encodeURIComponent(gmapsWaypoints)}` : ''}`}
        target="_blank" rel="noreferrer"
        className="tap mt-1 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white"
        style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}
      >
        <Navigation size={15} /> Start navigation
      </a>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function TripPlannerPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [points, setPoints] = useState({ origin: null, waypoints: [], dest: null });
  const [soc, setSoc] = useState(80);
  const [activeField, setActiveField] = useState('dest');
  const [pins, setPins] = useState({});
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [recents, setRecents] = useState(loadRecents());

  useEffect(() => {
    listMyVehicles().then((vs) => {
      setVehicles(vs);
      const def = vs.find((v) => v.is_default) || vs[0];
      if (def) { setVehicleId(def.id); setSoc(Math.round(def.battery_soc)); }
    }).catch((e) => setError(e.message));
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPoints((p) => p.origin ? p : { ...p, origin: { label: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude } }),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  const setPoint = (point) => {
    setPlan(null); setPins({});
    setPoints((p) => {
      if (activeField === 'origin') return { ...p, origin: point };
      if (activeField === 'dest') return { ...p, dest: point };
      if (activeField?.startsWith('wp-')) {
        const i = Number(activeField.slice(3));
        const wps = [...p.waypoints]; wps[i] = point;
        return { ...p, waypoints: wps };
      }
      return p;
    });
    setActiveField((f) => (f === 'origin' && !points.dest ? 'dest' : null));
  };

  const onMapClick = ([lat, lng]) => {
    if (!activeField) return;
    setPoint({ label: `Pinned (${lat.toFixed(3)}, ${lng.toFixed(3)})`, lat, lng });
  };

  const addWaypoint = () => {
    setPlan(null); setPins({});
    setPoints((p) => ({ ...p, waypoints: [...p.waypoints, null] }));
    setActiveField(`wp-${points.waypoints.length}`);
  };
  const removeWaypoint = (i) => {
    setPlan(null); setPins({});
    setPoints((p) => ({ ...p, waypoints: p.waypoints.filter((_, x) => x !== i) }));
    setActiveField(null);
  };
  const swap = () => { setPlan(null); setPins({}); setPoints((p) => ({ ...p, origin: p.dest, dest: p.origin })); };

  const runPlan = async (pinned = pins) => {
    const wps = points.waypoints.filter(Boolean);
    if (!points.origin || !points.dest || !vehicleId) return;
    setBusy(true); setError(null);
    try {
      const res = await planTrip({
        origin: { lat: points.origin.lat, lng: points.origin.lng },
        destination: { lat: points.dest.lat, lng: points.dest.lng },
        waypoints: wps.map((w) => ({ lat: w.lat, lng: w.lng })),
        vehicle_id: vehicleId,
        departure_soc: soc,
        pinned_chargers: Object.fromEntries(Object.entries(pinned).map(([k, v]) => [String(k), v])),
      });
      setPlan(res);
      saveRecent(points.origin, wps, points.dest);
      setRecents(loadRecents());
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const pickAlternative = (legIndex, chargerId) => {
    const next = { ...pins, [legIndex]: chargerId };
    setPins(next);
    runPlan(next);
  };

  const readyToPlan = points.origin && points.dest && vehicleId && points.waypoints.every(Boolean);
  const chargeStops = plan?.stops || [];

  const mapCenter = useMemo(() => {
    const pts = [points.origin, ...points.waypoints, points.dest].filter(Boolean);
    if (pts.length >= 2) {
      return [pts.reduce((a, p) => a + p.lat, 0) / pts.length, pts.reduce((a, p) => a + p.lng, 0) / pts.length];
    }
    return pts[0] ? [pts[0].lat, pts[0].lng] : [12.9716, 77.5946];
  }, [points]);

  const routePoints = useMemo(() => {
    if (!points.origin || !points.dest) return null;
    const legs = [points.origin, ...points.waypoints.filter(Boolean), points.dest];
    const withChargers = [];
    legs.forEach((p, i) => {
      withChargers.push([p.lat, p.lng]);
      const s = chargeStops.find((x) => x.leg_index === i);
      if (s) withChargers.push([s.charger.lat, s.charger.lng]);
    });
    return withChargers;
  }, [points, chargeStops]);

  const markers = useMemo(() => {
    const m = [];
    if (points.origin) m.push({ pos: [points.origin.lat, points.origin.lng], color: '#2563eb', label: 'Start' });
    points.waypoints.filter(Boolean).forEach((w, i) =>
      m.push({ pos: [w.lat, w.lng], color: '#d97706', label: `Stop ${i + 1}` }));
    if (points.dest) m.push({ pos: [points.dest.lat, points.dest.lng], color: '#e11d48', label: 'End' });
    return m;
  }, [points]);

  const confidenceColor = { high: '#34d399', medium: '#fbbf24', low: '#f87171' }[plan?.confidence] || '#94a3b8';

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-[440px] shrink-0 overflow-y-auto hide-scrollbar order-2 lg:order-1"
        style={{ borderRight: '1px solid var(--color-border)' }}>
        <div className="p-4 lg:p-5 pb-24 lg:pb-8 space-y-3.5">
          <div>
            <h1 className="font-display text-lg font-bold flex items-center gap-2">
              <RouteIcon size={19} style={{ color: 'var(--color-brand)' }} /> Plan a trip
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Risk-free by design — 15% reserve, worst-case range, verified backups on every leg.
            </p>
          </div>

          <StopsEditor
            points={points}
            activeField={activeField}
            setActiveField={setActiveField}
            onSwap={swap}
            onAddWaypoint={addWaypoint}
            onRemoveWaypoint={removeWaypoint}
          >
            {activeField && (
              <div className="pb-4 pt-1 screen-fade">
                <LocationSearch
                  key={activeField}
                  autoFocus
                  placeholder={activeField === 'origin' ? 'Search starting point…'
                    : activeField === 'dest' ? 'Search destination…' : 'Search this stop…'}
                  allowMyLocation={activeField === 'origin'}
                  onSelect={setPoint}
                />
                <div className="mt-2 text-[11px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  …or tap directly on the map
                </div>
              </div>
            )}
          </StopsEditor>

          {!plan && recents.length > 0 && (
            <div className="space-y-1.5">
              {recents.map((r, i) => (
                <button key={i}
                  onClick={() => { setPoints({ origin: r.origin, waypoints: r.waypoints || [], dest: r.dest }); setActiveField(null); setPlan(null); setPins({}); }}
                  className="tap w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-left"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                  <History size={14} className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {[r.origin.label, ...(r.waypoints || []).map((w) => w.label), r.dest.label].join(' → ')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Vehicle + battery */}
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            {vehicles.length === 0 ? (
              <button onClick={() => navigate('/add-vehicle')} className="tap flex-1 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                + Add your EV to plan trips
              </button>
            ) : (
              <>
                <select
                  value={vehicleId || ''}
                  onChange={(e) => {
                    setVehicleId(e.target.value); setPlan(null);
                    const v = vehicles.find((x) => x.id === e.target.value);
                    if (v) setSoc(Math.round(v.battery_soc));
                  }}
                  className="text-xs font-semibold outline-none rounded-lg py-2 px-2 max-w-[150px]"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
                >
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}
                </select>
                <input type="range" min={5} max={100} value={soc}
                  onChange={(e) => { setSoc(Number(e.target.value)); setPlan(null); }} className="flex-1" />
                <span className="text-sm font-bold tabular-nums w-11 text-right"
                  style={{ color: soc < 20 ? 'var(--color-rose)' : 'var(--color-brand)' }}>{soc}%</span>
              </>
            )}
          </div>

          {!plan && (
            <button
              onClick={() => runPlan({})}
              disabled={!readyToPlan || busy}
              className="tap w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}
            >
              {busy ? 'Planning your trip…'
                : !points.dest ? 'Choose a destination'
                : !points.origin ? 'Choose a starting point'
                : !points.waypoints.every(Boolean) ? 'Finish adding your stops'
                : 'Plan my trip'}
            </button>
          )}

          {error && <div className="p-3.5 rounded-2xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>}

          {plan && (
            <div className="space-y-3 screen-fade">
              {/* Gradient summary hero */}
              <div className="p-5 rounded-3xl text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f2167 0%, #1d4ed8 55%, #0ea5e9 130%)', boxShadow: 'var(--shadow-brand)' }}>
                <div className="flex items-center justify-between">
                  <div className="font-display text-base font-bold">
                    {plan.feasible ? (chargeStops.length === 0 ? 'No charging needed ⚡' : `${chargeStops.length} charging stop${chargeStops.length > 1 ? 's' : ''}`) : 'Not safely plannable'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.15)', color: confidenceColor }}>
                      {plan.confidence}
                    </span>
                    <button onClick={() => { setPlan(null); setPins({}); }}
                      className="tap text-[11px] font-bold px-2 py-1 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                      Edit
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    [`${plan.total_distance_km}`, 'km'],
                    [plan.total_trip_minutes ? `${Math.floor(plan.total_trip_minutes / 60)}h ${Math.round(plan.total_trip_minutes % 60)}m` : '—', 'total time'],
                    [plan.destination_arrival_soc != null ? `${plan.destination_arrival_soc}%` : '—', 'arrival battery'],
                  ].map(([v, l]) => (
                    <div key={l}>
                      <div className="font-display text-xl font-bold tabular-nums leading-none">{v}</div>
                      <div className="text-[10px] mt-1 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.65)' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {plan.warnings?.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-3 rounded-2xl"
                  style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w}
                </div>
              ))}

              {plan.feasible ? (
                <Timeline plan={plan} points={points} soc={soc} navigate={navigate}
                  onPickAlternative={pickAlternative} busy={busy} />
              ) : (
                <div className="p-4 rounded-2xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>
                  {plan.note}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[38vh] lg:h-auto lg:flex-1 shrink-0 order-1 lg:order-2">
        <MapView
          center={mapCenter}
          zoom={points.origin && points.dest ? 9 : 12}
          chargers={chargeStops.flatMap((s) => [s.charger, ...(s.backup_charger ? [s.backup_charger] : [])])}
          routePoints={routePoints}
          markers={markers}
          onMapClick={onMapClick}
          onSelect={(c) => navigate(`/charger/${c.id}`)}
        />
        {activeField && (
          <div className="glass absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold pulse-dot"
            style={{ zIndex: 500 }}>
            Tap the map to set {activeField === 'origin' ? 'your start' : activeField === 'dest' ? 'your destination' : 'this stop'}
          </div>
        )}
      </div>
    </div>
  );
}
