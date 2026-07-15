import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route as RouteIcon, BatteryCharging, Clock, IndianRupee, History,
  ShieldCheck, AlertTriangle, Navigation, ChevronRight, ArrowUpDown, Zap,
  Circle, MapPin, Flag, Pencil,
} from 'lucide-react';
import MapView from '../components/MapView';
import LocationSearch from '../components/LocationSearch';
import { planTrip } from '../common/api/trips';
import { listMyVehicles } from '../common/api/vehicles';
import { relPct } from '../common/utils/reliability';

const RECENTS_KEY = 'amplocate.recentTrips';

function loadRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY)) || []; } catch { return []; }
}
function saveRecent(origin, dest) {
  const entry = { origin, dest, at: Date.now() };
  const list = [entry, ...loadRecents().filter(
    (r) => r.dest.label !== dest.label || r.origin.label !== origin.label,
  )].slice(0, 4);
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/* ── Journey card: connected From/To fields ─────────────────────────── */
function JourneyCard({ origin, dest, activeField, setActiveField, onSwap, children }) {
  const Field = ({ id, value, placeholder, icon: Icon, iconColor }) => {
    const active = activeField === id;
    return (
      <button
        onClick={() => setActiveField(active ? null : id)}
        className="tap flex-1 min-w-0 flex items-center gap-3 py-3 text-left"
      >
        <Icon size={15} style={{ color: iconColor }} className="shrink-0" fill={id === 'origin' ? iconColor : 'none'} />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            {id === 'origin' ? 'From' : 'To'}
          </div>
          <div
            className="text-sm font-semibold truncate"
            style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
          >
            {value ? value.label : placeholder}
          </div>
        </div>
        {active ? <Pencil size={13} style={{ color: 'var(--color-brand)' }} className="shrink-0" />
          : <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)' }} className="shrink-0" />}
      </button>
    );
  };

  return (
    <div
      className="rounded-3xl px-4"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          <Field id="origin" value={origin} placeholder="Where from?" icon={Circle} iconColor="var(--color-brand)" />
          <div style={{ borderTop: '1px dashed var(--color-border-dark)', marginLeft: 27 }} />
          <Field id="dest" value={dest} placeholder="Where to?" icon={MapPin} iconColor="var(--color-rose)" />
        </div>
        <button
          onClick={onSwap}
          aria-label="Swap origin and destination"
          className="tap ml-2 p-2.5 rounded-xl shrink-0"
          style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
        >
          <ArrowUpDown size={15} />
        </button>
      </div>
      {children}
    </div>
  );
}

/* ── Battery bar ────────────────────────────────────────────────────── */
function SocBar({ from, to, danger = false }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ background: 'var(--color-surface-2)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{
          width: `${Math.max(from, to)}%`,
          background: danger ? 'var(--color-rose)' : 'linear-gradient(90deg, var(--color-emerald), var(--color-brand))',
          opacity: 0.35,
        }} />
        <div className="absolute inset-y-0 left-0 rounded-full" style={{
          width: `${Math.min(from, to)}%`,
          background: danger ? 'var(--color-rose)' : 'linear-gradient(90deg, var(--color-emerald), var(--color-brand))',
        }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        {Math.round(from)}% → {Math.round(to)}%
      </span>
    </div>
  );
}

/* ── Timeline result ────────────────────────────────────────────────── */
function Timeline({ plan, origin, dest, soc, navigate }) {
  const stop = plan.stops?.[0];
  const Row = ({ dot, line, children }) => (
    <div className="flex gap-3">
      <div className="flex flex-col items-center" style={{ width: 18 }}>
        {dot}
        {line && <div className="flex-1 w-0.5 my-1" style={{ background: 'var(--color-border-dark)' }} />}
      </div>
      <div className="flex-1 min-w-0 pb-4">{children}</div>
    </div>
  );

  return (
    <div className="p-4 rounded-3xl screen-fade" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <Row line dot={<Circle size={14} fill="var(--color-brand)" style={{ color: 'var(--color-brand)', marginTop: 3 }} />}>
        <div className="text-sm font-bold truncate">{origin.label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          Departing at {Math.round(soc)}% battery
        </div>
      </Row>

      {stop && (
        <Row line dot={
          <div className="rounded-full p-1 mt-0.5" style={{ background: 'var(--color-brand-light)' }}>
            <BatteryCharging size={12} style={{ color: 'var(--color-brand)' }} />
          </div>
        }>
          <button onClick={() => navigate(`/charger/${stop.charger.id}`)} className="tap w-full text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold truncate">{stop.charger.name}</div>
              <ChevronRight size={15} className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              {stop.charger.operator} · {relPct(stop.charger.reliability_score)} reliable
            </div>
          </button>
          <div className="mt-2.5"><SocBar from={stop.arrival_soc} to={stop.target_soc} /></div>
          <div className="flex items-center gap-3 mt-2 text-xs font-medium flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="flex items-center gap-1"><Clock size={12} /> ~{Math.round(stop.dwell_minutes)} min</span>
            <span className="flex items-center gap-1"><Zap size={12} /> +{stop.energy_to_add_kwh} kWh</span>
            {stop.estimated_cost != null && (
              <span className="flex items-center gap-1"><IndianRupee size={12} /> ~₹{Math.round(stop.estimated_cost)}</span>
            )}
          </div>
          {stop.backup_charger && (
            <div className="mt-2.5 flex items-start gap-1.5 text-[11px] font-medium p-2 rounded-lg"
              style={{ background: 'var(--color-emerald-light)', color: 'var(--color-emerald)' }}>
              <ShieldCheck size={13} className="shrink-0 mt-px" />
              Backup: {stop.backup_charger.name} is reachable if this charger fails
            </div>
          )}
        </Row>
      )}

      <Row dot={<Flag size={14} style={{ color: 'var(--color-rose)', marginTop: 3 }} />}>
        <div className="text-sm font-bold truncate">{dest.label}</div>
        <div className="text-xs mt-0.5 mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Arriving with ~{plan.destination_arrival_soc}% battery
        </div>
        <SocBar
          from={stop ? stop.target_soc : soc}
          to={plan.destination_arrival_soc ?? 0}
          danger={(plan.destination_arrival_soc ?? 0) < 15}
        />
      </Row>

      <a
        href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}${stop ? `&waypoints=${stop.charger.lat},${stop.charger.lng}` : ''}`}
        target="_blank" rel="noreferrer"
        className="tap mt-1 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white"
        style={{ background: 'var(--color-brand)', boxShadow: 'var(--shadow-md)' }}
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
  const [origin, setOrigin] = useState(null);
  const [dest, setDest] = useState(null);
  const [soc, setSoc] = useState(80);
  const [activeField, setActiveField] = useState('dest'); // destination-first
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
    // default origin: current location
    navigator.geolocation?.getCurrentPosition(
      (pos) => setOrigin((o) => o || { label: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const setPoint = (point) => {
    setPlan(null);
    if (activeField === 'origin') { setOrigin(point); setActiveField(dest ? null : 'dest'); }
    else { setDest(point); setActiveField(origin ? null : 'origin'); }
  };

  const onMapClick = ([lat, lng]) => {
    if (!activeField) return;
    setPoint({ label: `Pinned (${lat.toFixed(3)}, ${lng.toFixed(3)})`, lat, lng });
  };

  const swap = () => { setPlan(null); setOrigin(dest); setDest(origin); };

  const submit = async () => {
    if (!origin || !dest || !vehicleId) return;
    setBusy(true); setError(null); setPlan(null);
    try {
      const res = await planTrip({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        vehicle_id: vehicleId,
        departure_soc: soc,
      });
      setPlan(res);
      saveRecent(origin, dest);
      setRecents(loadRecents());
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const stop = plan?.stops?.[0];
  const mapCenter = useMemo(() => {
    if (origin && dest) return [(origin.lat + dest.lat) / 2, (origin.lng + dest.lng) / 2];
    const p = origin || dest;
    return p ? [p.lat, p.lng] : [12.9716, 77.5946];
  }, [origin, dest]);

  const routePoints = useMemo(() => {
    if (!origin || !dest) return null;
    const pts = [[origin.lat, origin.lng]];
    if (stop) pts.push([stop.charger.lat, stop.charger.lng]);
    pts.push([dest.lat, dest.lng]);
    return pts;
  }, [origin, dest, stop]);

  const markers = useMemo(() => {
    const m = [];
    if (origin) m.push({ pos: [origin.lat, origin.lng], color: '#2563eb', label: 'Start' });
    if (dest) m.push({ pos: [dest.lat, dest.lng], color: '#e11d48', label: 'End' });
    return m;
  }, [origin, dest]);

  const confidenceColor = { high: 'var(--color-emerald)', medium: 'var(--color-amber)', low: 'var(--color-rose)' }[plan?.confidence] || 'var(--color-text-tertiary)';
  const readyToPlan = origin && dest && vehicleId;

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Panel */}
      <div className="lg:w-[430px] shrink-0 overflow-y-auto hide-scrollbar order-2 lg:order-1"
        style={{ borderRight: '1px solid var(--color-border)' }}>
        <div className="p-4 lg:p-5 pb-24 lg:pb-8 space-y-3.5">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <RouteIcon size={19} style={{ color: 'var(--color-brand)' }} /> Plan a trip
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Risk-free by design — 15% reserve, worst-case range, verified backup charger.
            </p>
          </div>

          <JourneyCard origin={origin} dest={dest} activeField={activeField} setActiveField={(f) => { setActiveField(f); }} onSwap={swap}>
            {activeField && (
              <div className="pb-4 pt-1 screen-fade">
                <LocationSearch
                  key={activeField}
                  autoFocus
                  placeholder={activeField === 'origin' ? 'Search starting point…' : 'Search destination…'}
                  allowMyLocation={activeField === 'origin'}
                  onSelect={setPoint}
                />
                <div className="mt-2 text-[11px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  …or tap directly on the map
                </div>
              </div>
            )}
          </JourneyCard>

          {/* Recents */}
          {!plan && recents.length > 0 && (
            <div className="space-y-1.5">
              {recents.map((r, i) => (
                <button key={i}
                  onClick={() => { setOrigin(r.origin); setDest(r.dest); setActiveField(null); setPlan(null); }}
                  className="tap w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-left"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                  <History size={14} className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {r.origin.label} → {r.dest.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Vehicle + battery strip */}
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
              onClick={submit}
              disabled={!readyToPlan || busy}
              className="tap w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: 'var(--color-brand)', boxShadow: 'var(--shadow-md)' }}
            >
              {busy ? 'Planning your trip…'
                : !dest ? 'Choose a destination'
                : !origin ? 'Choose a starting point'
                : 'Plan my trip'}
            </button>
          )}

          {error && <div className="p-3.5 rounded-2xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>}

          {/* Results */}
          {plan && (
            <div className="space-y-3 screen-fade">
              <div className="flex items-center justify-between px-1">
                <div className="text-sm font-bold">
                  {plan.feasible ? (plan.stops.length === 0 ? 'No charging needed 🎉' : 'Your journey') : 'Not safely plannable'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                    style={{ background: 'var(--color-surface-2)', color: confidenceColor }}>
                    {plan.confidence}
                  </span>
                  <button onClick={() => setPlan(null)} className="tap text-[11px] font-bold px-2 py-1 rounded-md"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}>
                    Edit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [`${plan.total_distance_km} km`, 'distance'],
                  [plan.total_trip_minutes ? `${Math.floor(plan.total_trip_minutes / 60)}h ${Math.round(plan.total_trip_minutes % 60)}m` : '—', 'total time'],
                  [plan.destination_arrival_soc != null ? `${plan.destination_arrival_soc}%` : '—', 'arrival battery'],
                ].map(([v, l]) => (
                  <div key={l} className="p-2.5 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="text-sm font-bold tabular-nums">{v}</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{l}</div>
                  </div>
                ))}
              </div>

              {plan.warnings?.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-3 rounded-2xl"
                  style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w}
                </div>
              ))}

              {plan.feasible ? (
                <Timeline plan={plan} origin={origin} dest={dest} soc={soc} navigate={navigate} />
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
          zoom={origin && dest ? 9 : 12}
          chargers={stop ? [stop.charger, ...(stop.backup_charger ? [stop.backup_charger] : [])] : []}
          routePoints={routePoints}
          markers={markers}
          onMapClick={onMapClick}
          onSelect={(c) => navigate(`/charger/${c.id}`)}
        />
        {activeField && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold pulse-dot"
            style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)', zIndex: 500 }}>
            Tap the map to set your {activeField === 'origin' ? 'starting point' : 'destination'}
          </div>
        )}
      </div>
    </div>
  );
}
