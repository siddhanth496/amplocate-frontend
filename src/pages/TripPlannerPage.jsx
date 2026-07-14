import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route as RouteIcon, MapPin, Flag, BatteryCharging, Clock, IndianRupee,
  ShieldCheck, AlertTriangle, Navigation, ChevronRight, LocateFixed, Zap,
} from 'lucide-react';
import MapView from '../components/MapView';
import { planTrip } from '../common/api/trips';
import { listMyVehicles } from '../common/api/vehicles';
import { relPct } from '../common/utils/reliability';

const PRESETS = [
  { label: 'Bengaluru — MG Road', lat: 12.9758, lng: 77.6045 },
  { label: 'Bengaluru — Whitefield', lat: 12.9698, lng: 77.7500 },
  { label: 'Bengaluru — Electronic City', lat: 12.8452, lng: 77.6602 },
  { label: 'Kempegowda Airport', lat: 13.1986, lng: 77.7066 },
  { label: 'Mysuru Palace', lat: 12.3052, lng: 76.6552 },
  { label: 'Delhi — Connaught Place', lat: 28.6315, lng: 77.2196 },
  { label: 'Gurugram — Cyber City', lat: 28.4950, lng: 77.0890 },
  { label: 'Noida — Sector 18', lat: 28.5700, lng: 77.3210 },
];

function LocationField({ label, icon: Icon, value, onPick, onUseLocation, active, onFocus }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>{label}</label>
      <div
        className="mt-1.5 rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: `1.5px solid ${active ? 'var(--color-brand)' : 'var(--color-border-dark)'}`,
        }}
      >
        <button onClick={onFocus} className="tap w-full flex items-center gap-2.5 px-4 py-3 text-left">
          <Icon size={16} style={{ color: 'var(--color-brand)' }} className="shrink-0" />
          <span className="text-sm font-medium truncate" style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
            {value ? value.label : 'Choose on map or from list'}
          </span>
        </button>
        {active && (
          <div className="px-2 pb-2 space-y-0.5 screen-fade" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            {onUseLocation && (
              <button onClick={onUseLocation} className="tap w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold" style={{ color: 'var(--color-brand)' }}>
                <LocateFixed size={13} /> Use my current location
              </button>
            )}
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => onPick(p)}
                className="tap w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-[var(--color-surface-alt)]"
                style={{ color: 'var(--color-text-secondary)' }}>
                {p.label}
              </button>
            ))}
            <div className="px-2.5 pt-1 pb-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              …or click anywhere on the map
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TripPlannerPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [origin, setOrigin] = useState(null);        // {label, lat, lng}
  const [dest, setDest] = useState(null);
  const [soc, setSoc] = useState(80);
  const [activeField, setActiveField] = useState(null); // 'origin' | 'dest'
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listMyVehicles().then((vs) => {
      setVehicles(vs);
      const def = vs.find((v) => v.is_default) || vs[0];
      if (def) { setVehicleId(def.id); setSoc(Math.round(def.battery_soc)); }
    }).catch((e) => setError(e.message));
  }, []);

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setOrigin({ label: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude }); setActiveField(null); },
      () => setError('Could not get your location'),
      { timeout: 5000 },
    );
  };

  const onMapClick = ([lat, lng]) => {
    const point = { label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng };
    if (activeField === 'origin') { setOrigin(point); setActiveField('dest'); }
    else { setDest(point); setActiveField(null); }
  };

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
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const stop = plan?.stops?.[0];
  const mapCenter = useMemo(() => {
    if (origin && dest) return [(origin.lat + dest.lat) / 2, (origin.lng + dest.lng) / 2];
    return origin ? [origin.lat, origin.lng] : [12.9716, 77.5946];
  }, [origin, dest]);
  const mapZoom = origin && dest ? 9 : 12;

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
    if (dest) m.push({ pos: [dest.lat, dest.lng], color: '#0f172a', label: 'End' });
    return m;
  }, [origin, dest]);

  const confidenceColor = { high: 'var(--color-emerald)', medium: 'var(--color-amber)', low: 'var(--color-rose)' }[plan?.confidence] || 'var(--color-text-tertiary)';

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Controls / results panel */}
      <div className="lg:w-[420px] shrink-0 overflow-y-auto hide-scrollbar order-2 lg:order-1"
        style={{ borderRight: '1px solid var(--color-border)' }}>
        <div className="p-4 lg:p-5 pb-24 lg:pb-8 space-y-4">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2"><RouteIcon size={19} style={{ color: 'var(--color-brand)' }} /> Trip planner</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Risk-free plans: 15% battery reserve, pessimistic range, verified backup charger.
            </p>
          </div>

          <LocationField label="From" icon={MapPin} value={origin}
            active={activeField === 'origin'}
            onFocus={() => setActiveField(activeField === 'origin' ? null : 'origin')}
            onPick={(p) => { setOrigin(p); setActiveField('dest'); }}
            onUseLocation={useMyLocation} />
          <LocationField label="To" icon={Flag} value={dest}
            active={activeField === 'dest'}
            onFocus={() => setActiveField(activeField === 'dest' ? null : 'dest')}
            onPick={(p) => { setDest(p); setActiveField(null); }} />

          {/* Vehicle + SoC */}
          <div className="p-4 rounded-2xl space-y-3.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Vehicle</label>
              {vehicles.length === 0 ? (
                <button onClick={() => navigate('/add-vehicle')} className="tap mt-1.5 w-full py-2.5 rounded-xl text-xs font-bold" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                  + Add your EV first
                </button>
              ) : (
                <select
                  value={vehicleId || ''}
                  onChange={(e) => {
                    setVehicleId(e.target.value);
                    const v = vehicles.find((x) => x.id === e.target.value);
                    if (v) setSoc(Math.round(v.battery_soc));
                  }}
                  className="mt-1.5 w-full py-2.5 px-3 rounded-xl text-sm font-medium outline-none"
                  style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.make} {v.model}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Battery now</label>
                <span className="text-sm font-bold tabular-nums" style={{ color: soc < 20 ? 'var(--color-rose)' : 'var(--color-brand)' }}>{soc}%</span>
              </div>
              <input type="range" min={5} max={100} value={soc} onChange={(e) => setSoc(Number(e.target.value))} className="w-full mt-2" />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!origin || !dest || !vehicleId || busy}
            className="tap w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'var(--color-brand)', boxShadow: 'var(--shadow-md)' }}
          >
            {busy ? 'Planning…' : 'Plan my trip'}
          </button>

          {error && <div className="p-3.5 rounded-2xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>}

          {/* Results */}
          {plan && (
            <div className="space-y-3 screen-fade">
              <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">{plan.feasible ? (plan.stops.length === 0 ? 'No charging needed 🎉' : '1 charging stop') : 'Trip not safely plannable'}</div>
                  <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                    style={{ background: 'var(--color-surface-alt)', color: confidenceColor }}>
                    {plan.confidence} confidence
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="p-2 rounded-xl" style={{ background: 'var(--color-surface-alt)' }}>
                    <div className="text-sm font-bold tabular-nums">{plan.total_distance_km} km</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>distance</div>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: 'var(--color-surface-alt)' }}>
                    <div className="text-sm font-bold tabular-nums">
                      {plan.total_trip_minutes ? `${Math.floor(plan.total_trip_minutes / 60)}h ${Math.round(plan.total_trip_minutes % 60)}m` : '—'}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>total time</div>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: 'var(--color-surface-alt)' }}>
                    <div className="text-sm font-bold tabular-nums">{plan.destination_arrival_soc != null ? `${plan.destination_arrival_soc}%` : '—'}</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>arrival battery</div>
                  </div>
                </div>
                {plan.note && (
                  <p className="mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{plan.note}</p>
                )}
                {plan.warnings?.map((w, i) => (
                  <div key={i} className="mt-2 flex items-start gap-2 text-xs p-2.5 rounded-xl" style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w}
                  </div>
                ))}
              </div>

              {stop && (
                <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-brand)', boxShadow: 'var(--shadow-md)' }}>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-brand)' }}>
                    <BatteryCharging size={14} /> Charging stop
                  </div>
                  <button onClick={() => navigate(`/charger/${stop.charger.id}`)} className="tap w-full text-left mt-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold">{stop.charger.name}</div>
                      <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      {stop.charger.operator} · {relPct(stop.charger.reliability_score)} reliable
                    </div>
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      <Zap size={13} /> Arrive at <b>{stop.arrival_soc}%</b> → charge to <b>{stop.target_soc}%</b>
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      <Clock size={13} /> ~<b>{Math.round(stop.dwell_minutes)} min</b> charge
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      <BatteryCharging size={13} /> +{stop.energy_to_add_kwh} kWh
                    </div>
                    {stop.estimated_cost != null && (
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                        <IndianRupee size={13} /> ~₹{Math.round(stop.estimated_cost)}
                      </div>
                    )}
                  </div>
                  {stop.backup_charger && (
                    <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl text-xs" style={{ background: 'var(--color-emerald-light)', color: 'var(--color-emerald)' }}>
                      <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                      <span>Backup verified: <b>{stop.backup_charger.name}</b> is reachable if this one fails.</span>
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&waypoints=${stop.charger.lat},${stop.charger.lng}`}
                    target="_blank" rel="noreferrer"
                    className="tap mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'var(--color-brand)' }}
                  >
                    <Navigation size={14} /> Start navigation
                  </a>
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
          zoom={mapZoom}
          chargers={stop ? [stop.charger, ...(stop.backup_charger ? [stop.backup_charger] : [])] : []}
          routePoints={routePoints}
          markers={markers}
          onMapClick={onMapClick}
          onSelect={(c) => navigate(`/charger/${c.id}`)}
        />
        {activeField && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)', zIndex: 500 }}>
            Click the map to set {activeField === 'origin' ? 'start' : 'destination'}
          </div>
        )}
      </div>
    </div>
  );
}
