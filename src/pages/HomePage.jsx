import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LocateFixed, SlidersHorizontal, Zap, Navigation, ShieldCheck, X,
  BatteryMedium, Car, ChevronRight, Sparkles,
} from 'lucide-react';
import MapView from '../components/MapView';
import LocationSearch from '../components/LocationSearch';
import { AmpMark } from '../components/Logo';
import { ChargerCardSkeleton } from '../components/Skeleton';
import { getNearby } from '../common/api/chargers';
import { listMyVehicles } from '../common/api/vehicles';
import { relColor, relLabel, relPct, timeAgo, connectorLabel, maxPowerKw } from '../common/utils/reliability';

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru
const CONNECTORS = ['CCS2', 'Type2_AC', 'CHAdeMO', 'Bharat_DC001', 'Bharat_AC001', 'Wall_3pin'];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Charging late?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* Mini reliability ring — the brand's recurring motif */
function RelRing({ score, size = 44 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={relColor(score)} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
        {Math.round(score * 100)}
      </span>
    </div>
  );
}

function ChargerCard({ charger, onClick }) {
  const power = maxPowerKw(charger);
  const isFast = power >= 50;
  return (
    <button
      onClick={onClick}
      className="tap card-lift w-full text-left p-4 rounded-3xl"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center gap-3.5">
        <RelRing score={charger.reliability_score} />
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-[15px] leading-snug truncate">{charger.name}</div>
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
            {charger.operator} · {charger.distance_km} km · verified {timeAgo(charger.last_verified_at)}
          </div>
        </div>
        <ChevronRight size={16} className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      <div className="flex items-center flex-wrap gap-1.5 mt-3 pl-[58px]">
        {charger.compatible === true && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ background: 'var(--color-emerald-light)', color: 'var(--color-emerald)' }}>
            <Zap size={11} /> Fits your EV
          </span>
        )}
        {charger.compatible === false && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-lg"
            style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>
            Incompatible
          </span>
        )}
        {power > 0 && (
          <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${isFast ? 'amp-gradient-bg text-white' : ''}`}
            style={isFast ? {} : { background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
            {isFast ? `⚡ ${power} kW fast` : `${power} kW`}
          </span>
        )}
        {charger.price_per_kwh != null && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-lg"
            style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
            ₹{charger.price_per_kwh}/kWh
          </span>
        )}
      </div>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userLoc, setUserLoc] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ connector_type: null, min_reliability: null, radius_km: 25 });
  const abortRef = useRef(null);

  useEffect(() => {
    listMyVehicles()
      .then((vs) => {
        setVehicles(vs);
        const def = vs.find((v) => v.is_default) || vs[0];
        if (def) setVehicleId(def.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(loc);
        setCenter(loc);
      },
      () => {},
      { timeout: 5000 },
    );
  }, []);

  const fetchChargers = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    getNearby(
      {
        lat: center[0], lng: center[1],
        radius_km: filters.radius_km,
        connector_type: filters.connector_type || undefined,
        min_reliability: filters.min_reliability || undefined,
        vehicle_id: vehicleId || undefined,
        limit: 60,
      },
      { signal: ctrl.signal },
    )
      .then((rows) => { setChargers(rows); setLoading(false); })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(err.message); setLoading(false);
      });
  }, [center, filters, vehicleId]);

  useEffect(() => { fetchChargers(); }, [fetchChargers]);

  const selected = useMemo(() => chargers.find((c) => c.id === selectedId), [chargers, selectedId]);
  const defaultVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) || vehicles[0],
    [vehicles, vehicleId],
  );
  const compatibleCount = useMemo(() => chargers.filter((c) => c.compatible).length, [chargers]);
  const reliableCount = useMemo(() => chargers.filter((c) => c.reliability_score >= 0.8).length, [chargers]);

  const vehiclePill = defaultVehicle ? (
    <button
      onClick={() => navigate('/garage')}
      className="tap glass flex items-center gap-2 px-3 rounded-2xl shrink-0"
      style={{ height: 42 }}
    >
      <Car size={15} style={{ color: 'var(--color-brand)' }} />
      <span className="text-xs font-semibold truncate max-w-[105px]">{defaultVehicle.model}</span>
      <span
        className="flex items-center gap-1 text-xs font-bold tabular-nums"
        style={{ color: defaultVehicle.battery_soc < 20 ? 'var(--color-rose)' : 'var(--color-emerald)' }}
      >
        <BatteryMedium size={14} /> {Math.round(defaultVehicle.battery_soc)}%
      </span>
    </button>
  ) : (
    <button
      onClick={() => navigate('/add-vehicle')}
      className="tap amp-gradient-bg flex items-center gap-1.5 px-3 rounded-2xl text-xs font-bold text-white shrink-0"
      style={{ height: 42, boxShadow: 'var(--shadow-brand)' }}
    >
      <Car size={14} /> Add your EV
    </button>
  );

  const heroLine = loading
    ? 'Scanning the grid…'
    : reliableCount > 0
      ? `${reliableCount} reliable charger${reliableCount === 1 ? '' : 's'} around you`
      : `${chargers.length} charger${chargers.length === 1 ? '' : 's'} within ${filters.radius_km} km`;

  const filtersPanel = showFilters && (
    <div className="p-3.5 rounded-3xl space-y-3 screen-fade"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>Connector</div>
        <div className="flex flex-wrap gap-1.5">
          {CONNECTORS.map((c) => (
            <button key={c}
              onClick={() => setFilters((f) => ({ ...f, connector_type: f.connector_type === c ? null : c }))}
              className={`tap text-[11px] font-semibold px-2.5 py-1.5 rounded-lg ${filters.connector_type === c ? 'amp-gradient-bg text-white' : ''}`}
              style={filters.connector_type === c ? {} : { background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
            >{connectorLabel(c)}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          <input
            type="checkbox"
            checked={filters.min_reliability != null}
            onChange={(e) => setFilters((f) => ({ ...f, min_reliability: e.target.checked ? 0.8 : null }))}
          />
          <ShieldCheck size={14} style={{ color: 'var(--color-emerald)' }} /> Reliable only (80%+)
        </label>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Radius</span>
          <input type="range" min={5} max={100} step={5} value={filters.radius_km}
            onChange={(e) => setFilters((f) => ({ ...f, radius_km: Number(e.target.value) }))}
            className="flex-1" />
          <span className="text-xs font-semibold w-12">{filters.radius_km} km</span>
        </div>
      </div>
    </div>
  );

  const listBody = (
    <>
      {error && (
        <div className="p-4 rounded-3xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>
          {error}
        </div>
      )}
      {!loading && !error && chargers.length === 0 && (
        <div className="p-8 text-center rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border-dark)' }}>
          <div className="text-sm font-semibold">No chargers found</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Try widening the radius or removing filters.</div>
        </div>
      )}
      {loading && chargers.length === 0 ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => <ChargerCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-2.5 animate-stagger" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity 0.2s' }}>
          {chargers.map((c) => (
            <ChargerCard key={c.id} charger={c} onClick={() => navigate(`/charger/${c.id}`)} />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* ── Desktop panel ── */}
      <div className="hidden lg:flex flex-col w-[420px] shrink-0 overflow-y-auto hide-scrollbar"
        style={{ borderRight: '1px solid var(--color-border)' }}>
        <div className="p-5 pb-8 flex flex-col gap-3">
          <div className="rounded-3xl p-5" style={{ background: 'var(--amp-gradient-soft)' }}>
            <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-brand)' }}>
              <Sparkles size={13} /> {greeting()}
            </div>
            <h1 className="font-display text-[26px] font-bold leading-tight mt-1.5">
              {loading ? <span>Scanning the grid…</span> : (
                <>
                  <span className="amp-gradient-text">{reliableCount} reliable</span> chargers around you
                </>
              )}
            </h1>
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Verified by the community, matched to your EV.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LocationSearch
              placeholder="Search an area — Indiranagar, Mysuru…"
              compact
              onSelect={(r) => setCenter([r.lat, r.lng])}
            />
            {vehiclePill}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-full"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              {loading ? 'Searching…' : `${chargers.length} chargers · ${filters.radius_km} km`}
            </span>
            <div className="flex items-center gap-2">
              {!loading && vehicleId && chargers.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1"
                  style={{ background: 'var(--color-emerald-light)', color: 'var(--color-emerald)' }}>
                  <Zap size={11} /> {compatibleCount} fit your EV
                </span>
              )}
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="tap flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
                style={{
                  background: showFilters ? 'var(--color-brand-light)' : 'var(--color-surface)',
                  color: showFilters ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {filtersPanel}
          {listBody}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="relative h-[46vh] lg:h-auto lg:flex-1 shrink-0">
        <MapView
          center={center}
          zoom={12}
          chargers={chargers}
          selectedId={selectedId}
          onSelect={(c) => setSelectedId(c.id)}
          userLocation={userLoc}
        />

        {/* Mobile floating header */}
        <div className="lg:hidden absolute top-3 left-3 right-3 space-y-2" style={{ zIndex: 700 }}>
          <div className="flex items-center gap-2">
            <div className="shrink-0" style={{ boxShadow: 'var(--shadow-brand)', borderRadius: 14 }}>
              <AmpMark size={42} />
            </div>
            <LocationSearch
              placeholder="Search an area…"
              compact
              onSelect={(r) => setCenter([r.lat, r.lng])}
            />
            {vehiclePill}
          </div>
        </div>

        <button
          onClick={() => userLoc && setCenter([...userLoc])}
          className="tap glass absolute bottom-4 right-4 p-3 rounded-2xl"
          style={{ zIndex: 500, color: 'var(--color-brand)' }}
          aria-label="My location"
        >
          <LocateFixed size={19} />
        </button>

        {/* Selected charger floating card */}
        {selected && (
          <div className="absolute left-4 right-4 bottom-4 lg:left-auto lg:right-16 lg:w-[380px] sheet-in" style={{ zIndex: 600 }}>
            <div className="glass p-4 rounded-3xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <RelRing score={selected.reliability_score} size={40} />
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-sm truncate">{selected.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      {relLabel(selected.reliability_score)} · {selected.distance_km} km
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="tap p-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigate(`/charger/${selected.id}`)}
                  className="tap amp-gradient-bg flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  View details
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                  target="_blank" rel="noreferrer"
                  className="tap flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}
                >
                  <Navigation size={13} /> Go
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile list ── */}
      <div className="lg:hidden flex-1 overflow-y-auto hide-scrollbar">
        <div className="flex flex-col gap-2.5 p-4 pb-24">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-brand)' }}>
                <Sparkles size={12} /> {greeting()}
              </div>
              <h1 className="font-display text-lg font-bold leading-tight mt-0.5">{heroLine}</h1>
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="tap flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
              style={{
                background: showFilters ? 'var(--color-brand-light)' : 'var(--color-surface)',
                color: showFilters ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
          </div>
          {filtersPanel}
          {listBody}
        </div>
      </div>
    </div>
  );
}
