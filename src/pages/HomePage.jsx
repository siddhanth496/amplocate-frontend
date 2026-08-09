import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LocateFixed, SlidersHorizontal, Zap, Navigation, X,
  BatteryMedium, Car, ChevronUp, Route as RouteIcon, MapPin,
} from 'lucide-react';
import MapView from '../components/MapView';
import LocationSearch from '../components/LocationSearch';
import { ChargerCardSkeleton } from '../components/Skeleton';
import { getNearby } from '../common/api/chargers';
import { listMyVehicles } from '../common/api/vehicles';
import { relColor, relTextColor, relLabel, timeAgo, connectorLabel, maxPowerKw } from '../common/utils/reliability';

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru
const CONNECTORS = ['CCS2', 'Type2_AC', 'CHAdeMO', 'Bharat_DC001', 'Bharat_AC001', 'Wall_3pin'];

/* ═══════════════════════════════════════════════════════════════════════════
   Discover is one surface, not two.

   The old screen stacked a map on top of a list; they were separate objects
   that happened to show the same data. Now the map IS the page and the results
   live in a sheet that slides over it. Selecting a pin and selecting a row are
   the same act — whichever you touch, the other follows.
   ═══════════════════════════════════════════════════════════════════════════ */

const SNAPS = { peek: 128, half: 0.52, full: 0.92 }; // px, or fraction of height

function sheetHeight(snap, vh) {
  if (snap === 'peek') return SNAPS.peek;
  return Math.round(vh * SNAPS[snap]);
}

// ─── Charger card ────────────────────────────────────────────────────────────
function ChargerCard({ charger, selected, onSelect, onOpen }) {
  const power = maxPowerKw(charger);
  const isFast = power >= 50;
  const verdict = relLabel(charger.reliability_score);
  const dot = relColor(charger.reliability_score);
  const tone = relTextColor(charger.reliability_score);

  return (
    <div
      id={`charger-row-${charger.id}`}
      className="card-lift overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${selected ? 'var(--color-brand)' : 'var(--color-border)'}`,
        boxShadow: selected ? `0 0 0 3px var(--color-brand-ring)` : 'none',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <button onClick={onSelect} className="tap w-full text-left px-4 pt-3.5 pb-3">
        {/* The verdict is the headline. Everything else is supporting detail. */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
          <span className="text-[13px] font-bold" style={{ color: tone }}>{verdict}</span>
          <span className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
            · checked {timeAgo(charger.last_verified_at)}
          </span>
        </div>

        <div className="font-display font-semibold text-[16px] leading-snug truncate mt-1.5"
          style={{ letterSpacing: '-0.02em' }}>
          {charger.name}
        </div>
        <div className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {charger.distance_km} km away · {charger.operator}
          {charger.price_per_kwh != null && ` · ₹${charger.price_per_kwh}/kWh`}
        </div>

        <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
          {charger.compatible === true && (
            <span className="text-[12px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1"
              style={{ background: 'var(--color-emerald-light)', color: 'var(--color-emerald)' }}>
              <Zap size={11} /> Fits your car
            </span>
          )}
          {charger.compatible === false && (
            <span className="text-[12px] font-semibold px-2 py-1 rounded-lg"
              style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>
              Wrong plug
            </span>
          )}
          {power > 0 && (
            <span className="text-[12px] font-semibold px-2 py-1 rounded-lg"
              style={{
                background: isFast ? 'var(--color-brand-light)' : 'var(--color-surface-alt)',
                color: isFast ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              }}>
              {power} kW{isFast ? ' fast' : ''}
            </span>
          )}
        </div>
      </button>

      <div className="flex" style={{ borderTop: '1px solid var(--color-border-light)' }}>
        <button onClick={onOpen} className="tap flex-1 py-2.5 text-[13px] font-semibold"
          style={{ color: 'var(--color-text-secondary)' }}>
          Details
        </button>
        <div style={{ width: 1, background: 'var(--color-border-light)' }} />
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${charger.lat},${charger.lng}`}
          target="_blank" rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="tap flex-1 py-2.5 text-[13px] font-bold flex items-center justify-center gap-1.5"
          style={{ color: 'var(--color-brand)' }}
        >
          <Navigation size={14} /> Go
        </a>
      </div>
    </div>
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
  const [onlyFits, setOnlyFits] = useState(false);
  const [filters, setFilters] = useState({ connector_type: null, min_reliability: null, min_power_kw: null, radius_km: 25 });

  // Sheet state (mobile only). dragBase lives in state, not a ref, because the
  // rendered height depends on it — refs must not be read during render.
  const [snap, setSnap] = useState('half');
  const [dragBase, setDragBase] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [vh, setVh] = useState(typeof window === 'undefined' ? 800 : window.innerHeight);
  const startYRef = useRef(0);
  const abortRef = useRef(null);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
        min_power_kw: filters.min_power_kw || undefined,
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
  const visible = useMemo(
    () => (onlyFits ? chargers.filter((c) => c.compatible !== false) : chargers),
    [chargers, onlyFits],
  );
  const workingCount = useMemo(() => chargers.filter((c) => c.reliability_score >= 0.7).length, [chargers]);

  // Selecting a pin collapses the sheet so you can see where it is; selecting a
  // row on desktop scrolls the list to it. One selection, two views.
  const selectCharger = useCallback((id) => {
    setSelectedId(id);
    setSnap('peek');
    requestAnimationFrame(() => {
      document.getElementById(`charger-row-${id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const resetFilters = () => {
    setFilters({ connector_type: null, min_reliability: null, min_power_kw: null, radius_km: 25 });
    setOnlyFits(false);
  };

  // ── Sheet drag ────────────────────────────────────────────────────────────
  const dragging = dragBase != null;

  const onPointerDown = (e) => {
    startYRef.current = e.clientY;
    setDragBase(sheetHeight(snap, vh));
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    setDragY(startYRef.current - e.clientY);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    const target = dragBase + dragY;
    const options = [['peek', SNAPS.peek], ['half', vh * SNAPS.half], ['full', vh * SNAPS.full]];
    const nearest = options.reduce((a, b) => (Math.abs(b[1] - target) < Math.abs(a[1] - target) ? b : a));
    setSnap(nearest[0]);
    setDragBase(null);
    setDragY(0);
  };

  const currentHeight = Math.max(
    SNAPS.peek,
    Math.min(vh * SNAPS.full, dragging ? dragBase + dragY : sheetHeight(snap, vh)),
  );

  // ── Pieces reused by both layouts ─────────────────────────────────────────
  const vehiclePill = defaultVehicle ? (
    <button
      onClick={() => navigate('/garage')}
      className="tap glass flex items-center gap-2 px-3 rounded-xl shrink-0"
      style={{ height: 42 }}
    >
      <Car size={15} style={{ color: 'var(--color-text-secondary)' }} />
      <span className="text-[13px] font-semibold truncate max-w-[100px]">{defaultVehicle.model}</span>
      <span
        className="flex items-center gap-1 text-[13px] font-bold tabular-nums"
        style={{ color: defaultVehicle.battery_soc < 20 ? 'var(--color-rose)' : 'var(--color-emerald)' }}
      >
        <BatteryMedium size={14} /> {Math.round(defaultVehicle.battery_soc)}%
      </span>
    </button>
  ) : (
    <button
      onClick={() => navigate('/add-vehicle')}
      className="tap flex items-center gap-1.5 px-3 rounded-xl text-[13px] font-bold shrink-0"
      style={{ height: 42, background: 'var(--color-brand)', color: 'var(--color-on-brand)', boxShadow: 'var(--shadow-brand)' }}
    >
      <Car size={14} /> Add your EV
    </button>
  );

  const chipStyle = (on) => (on
    ? { background: 'var(--color-brand)', color: 'var(--color-on-brand)', border: '1px solid var(--color-brand)' }
    : { background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' });

  // The two questions every driver has — "will it work?" and "does it fit?" —
  // stay visible. Everything rarer lives behind the sliders icon.
  const quickFilters = (
    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
      <button
        onClick={() => setFilters((f) => ({ ...f, min_reliability: f.min_reliability ? null : 0.7 }))}
        className="tap shrink-0 text-[12.5px] font-semibold px-3 py-2 rounded-full"
        style={chipStyle(!!filters.min_reliability)}
      >
        Working now
      </button>
      <button
        disabled={!defaultVehicle}
        onClick={() => setOnlyFits((v) => !v)}
        title={defaultVehicle ? '' : 'Add your car first'}
        className="tap shrink-0 text-[12.5px] font-semibold px-3 py-2 rounded-full disabled:opacity-40"
        style={chipStyle(onlyFits)}
      >
        Fits my car
      </button>
      <button
        onClick={() => setFilters((f) => ({ ...f, min_power_kw: f.min_power_kw ? null : 50 }))}
        className="tap shrink-0 text-[12.5px] font-semibold px-3 py-2 rounded-full"
        style={chipStyle(!!filters.min_power_kw)}
      >
        Fast charging
      </button>
      <button
        onClick={() => setShowFilters((v) => !v)}
        aria-label="More filters"
        className="tap shrink-0 rounded-full flex items-center justify-center"
        style={{ ...chipStyle(showFilters), width: 34, height: 34 }}
      >
        <SlidersHorizontal size={14} />
      </button>
    </div>
  );

  const filtersPanel = showFilters && (
    <div className="p-3.5 space-y-3 screen-fade"
      style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-lg)' }}>
      <div>
        <div className="text-[13px] font-semibold mb-2">Connector</div>
        <div className="flex flex-wrap gap-1.5">
          {CONNECTORS.map((c) => (
            <button key={c}
              onClick={() => setFilters((f) => ({ ...f, connector_type: f.connector_type === c ? null : c }))}
              className="tap text-[12.5px] font-semibold px-2.5 py-1.5 rounded-full"
              style={filters.connector_type === c
                ? { background: 'var(--color-brand)', color: 'var(--color-on-brand)' }
                : { background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >{connectorLabel(c)}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] shrink-0" style={{ color: 'var(--color-text-secondary)' }}>Search radius</span>
        <input type="range" min={5} max={100} step={5} value={filters.radius_km}
          onChange={(e) => setFilters((f) => ({ ...f, radius_km: Number(e.target.value) }))}
          className="flex-1" />
        <span className="text-[13px] font-semibold w-12 tabular-nums text-right">{filters.radius_km} km</span>
      </div>
      <button onClick={resetFilters} className="tap text-[13px] font-semibold" style={{ color: 'var(--color-brand)' }}>
        Reset filters
      </button>
    </div>
  );

  const emptyState = !loading && !error && chargers.length === 0 && (
    <div className="p-7 text-center" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border-dark)', borderRadius: 'var(--radius-lg)' }}>
      <div className="mx-auto w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface-alt)' }}>
        <MapPin size={18} style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      <div className="font-display text-[16px] font-bold mt-3" style={{ letterSpacing: '-0.02em' }}>
        Nothing charging here
      </div>
      <div className="text-[13px] mt-1 max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
        No chargers within {filters.radius_km} km. Search a different area, or look further out.
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <button onClick={resetFilters} className="tap text-[13px] font-bold px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--color-brand)', color: 'var(--color-on-brand)' }}>
          Clear filters
        </button>
        <button
          onClick={() => setFilters((f) => ({ ...f, radius_km: Math.min(100, f.radius_km + 25) }))}
          className="tap text-[13px] font-bold px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)' }}
        >
          Search wider
        </button>
      </div>
    </div>
  );

  const list = (
    <>
      {error && (
        <div className="p-4 text-[13.5px]" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)', borderRadius: 'var(--radius-lg)' }}>
          {error}
        </div>
      )}
      {emptyState}
      {loading && chargers.length === 0 ? (
        <div className="space-y-2.5">{[0, 1, 2, 3].map((i) => <ChargerCardSkeleton key={i} />)}</div>
      ) : (
        <div className="space-y-2.5" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity 0.2s' }}>
          {visible.map((c) => (
            <ChargerCard
              key={c.id}
              charger={c}
              selected={c.id === selectedId}
              onSelect={() => { setSelectedId(c.id); setCenter([c.lat, c.lng]); }}
              onOpen={() => navigate(`/charger/${c.id}`)}
            />
          ))}
        </div>
      )}
    </>
  );

  const countLine = loading
    ? 'Looking around you…'
    : chargers.length === 0
      ? `Nothing within ${filters.radius_km} km`
      : `${chargers.length} nearby · ${workingCount} usually working`;

  const mapEl = (
    <MapView
      center={center}
      zoom={12}
      chargers={chargers}
      selectedId={selectedId}
      onSelect={(c) => selectCharger(c.id)}
      userLocation={userLoc}
      popup={false}
    />
  );

  return (
    <div className="h-full flex flex-col lg:flex-row relative">
      {/* ═══ Desktop: list rail + map, selection synced both ways ═══ */}
      <div className="hidden lg:flex flex-col w-[430px] shrink-0"
        style={{ borderRight: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
        <div className="p-5 pb-3 space-y-3 shrink-0">
          <div>
            <h1 className="font-display text-[24px] font-bold leading-tight" style={{ letterSpacing: '-0.03em' }}>
              Chargers near you
            </h1>
            <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{countLine}</p>
          </div>
          <div className="flex items-center gap-2">
            <LocationSearch placeholder="Search an area — Indiranagar, Mysuru…" compact onSelect={(r) => setCenter([r.lat, r.lng])} />
            {vehiclePill}
          </div>
          {quickFilters}
          {filtersPanel}
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-8 space-y-2.5">{list}</div>
      </div>

      {/* ═══ Map — the persistent canvas ═══ */}
      <div className="relative flex-1 min-h-0">
        {mapEl}

        {/* Floating controls, mobile */}
        {/* Above the sheet (z 800) so the search dropdown is not clipped by it. */}
        <div className="lg:hidden absolute top-3 left-3 right-3 flex items-center gap-2" style={{ zIndex: 900 }}>
          <LocationSearch placeholder="Search an area…" compact onSelect={(r) => setCenter([r.lat, r.lng])} />
          {vehiclePill}
        </div>

        <button
          onClick={() => userLoc && setCenter([...userLoc])}
          className="tap glass absolute right-4 p-3 rounded-xl lg:bottom-6"
          style={{ zIndex: 500, color: 'var(--color-brand)', bottom: `calc(${SNAPS.peek}px + 16px)` }}
          aria-label="Recentre on my location"
        >
          <LocateFixed size={19} />
        </button>
      </div>

      {/* ═══ Mobile results sheet — drag or tap the handle ═══ */}
      <div
        className="lg:hidden absolute left-0 right-0 bottom-0 flex flex-col"
        style={{
          height: currentHeight,
          zIndex: 800,
          background: 'var(--color-surface)',
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          boxShadow: '0 -8px 32px -8px rgba(14,16,19,0.18)',
          transition: dragging ? 'none' : 'height 0.28s cubic-bezier(0.22,0.9,0.3,1)',
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => !dragY && setSnap(snap === 'full' ? 'peek' : snap === 'half' ? 'full' : 'half')}
          className="shrink-0 pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-surface-2)', margin: '0 auto' }} />
        </div>

        {selected ? (
          /* One charger selected — the sheet becomes that charger. */
          <div className="px-4 pb-4 overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>Selected</span>
              <button onClick={() => { setSelectedId(null); setSnap('half'); }} className="tap p-1" style={{ color: 'var(--color-text-tertiary)' }}>
                <X size={16} />
              </button>
            </div>
            <ChargerCard
              charger={selected}
              selected
              onSelect={() => navigate(`/charger/${selected.id}`)}
              onOpen={() => navigate(`/charger/${selected.id}`)}
            />
            <button
              onClick={() => navigate(`/trip-planner?to=${encodeURIComponent(selected.name)}&lat=${selected.lat}&lng=${selected.lng}`)}
              className="tap w-full mt-2.5 py-3 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)' }}
            >
              <RouteIcon size={15} /> Plan a trip here
            </button>
          </div>
        ) : (
          <>
            <div className="px-4 pb-2.5 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{countLine}</span>
                {snap === 'peek' && (
                  <button onClick={() => setSnap('half')} className="tap flex items-center gap-1 text-[13px] font-bold" style={{ color: 'var(--color-brand)' }}>
                    See list <ChevronUp size={14} />
                  </button>
                )}
              </div>
              {quickFilters}
              {filtersPanel}
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-6 space-y-2.5">{list}</div>
          </>
        )}
      </div>
    </div>
  );
}
