import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocateFixed, SlidersHorizontal, Zap, Navigation, ShieldCheck, X } from 'lucide-react';
import MapView from '../components/MapView';
import { getNearby } from '../common/api/chargers';
import { listMyVehicles } from '../common/api/vehicles';
import { relColor, relLabel, relPct, timeAgo, connectorLabel, maxPowerKw } from '../common/utils/reliability';

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru
const CONNECTORS = ['CCS2', 'Type2_AC', 'CHAdeMO', 'Bharat_DC001', 'Bharat_AC001', 'Wall_3pin'];

function ChargerCard({ charger, selected, onClick }) {
  const power = maxPowerKw(charger);
  return (
    <button
      onClick={onClick}
      className="tap w-full text-left p-4 rounded-2xl transition-shadow"
      style={{
        background: 'var(--color-surface)',
        border: `1.5px solid ${selected ? 'var(--color-brand)' : 'var(--color-border)'}`,
        boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-[15px] leading-snug truncate">{charger.name}</div>
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
            {charger.operator} · {charger.distance_km} km away
          </div>
        </div>
        <div
          className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--color-surface-alt)', color: relColor(charger.reliability_score) }}
        >
          {relPct(charger.reliability_score)}
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-1.5 mt-3">
        {charger.compatible === true && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
            style={{ background: 'var(--color-emerald-light)', color: 'var(--color-emerald)' }}>
            <Zap size={11} /> Compatible
          </span>
        )}
        {charger.compatible === false && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
            style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>
            Incompatible
          </span>
        )}
        {power > 0 && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
            style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
            up to {power} kW
          </span>
        )}
        {charger.price_per_kwh != null && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md"
            style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
            ₹{charger.price_per_kwh}/kWh
          </span>
        )}
        <span className="text-[11px] ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
          verified {timeAgo(charger.last_verified_at)}
        </span>
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

  // vehicles (for compatibility highlighting)
  useEffect(() => {
    listMyVehicles()
      .then((vs) => {
        setVehicles(vs);
        const def = vs.find((v) => v.is_default) || vs[0];
        if (def) setVehicleId(def.id);
      })
      .catch(() => {});
  }, []);

  // geolocate once
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

  const listPanel = (
    <div className="flex flex-col gap-2.5 p-4 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Nearby chargers</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {loading ? 'Searching…' : `${chargers.length} within ${filters.radius_km} km`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="tap flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
          style={{
            background: showFilters ? 'var(--color-brand-light)' : 'var(--color-surface)',
            color: showFilters ? 'var(--color-brand)' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="p-3.5 rounded-2xl space-y-3 screen-fade"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>Connector</div>
            <div className="flex flex-wrap gap-1.5">
              {CONNECTORS.map((c) => (
                <button key={c}
                  onClick={() => setFilters((f) => ({ ...f, connector_type: f.connector_type === c ? null : c }))}
                  className="tap text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: filters.connector_type === c ? 'var(--color-brand)' : 'var(--color-surface-alt)',
                    color: filters.connector_type === c ? '#fff' : 'var(--color-text-secondary)',
                  }}
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
      )}

      {error && (
        <div className="p-4 rounded-2xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>
          {error}
        </div>
      )}

      {!loading && !error && chargers.length === 0 && (
        <div className="p-8 text-center rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border-dark)' }}>
          <div className="text-sm font-semibold">No chargers found</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Try widening the radius or removing filters.</div>
        </div>
      )}

      <div className="space-y-2.5 animate-stagger">
        {chargers.map((c) => (
          <ChargerCard
            key={c.id}
            charger={c}
            selected={c.id === selectedId}
            onClick={() => navigate(`/charger/${c.id}`)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* List panel — desktop left */}
      <div className="hidden lg:block w-[400px] shrink-0 overflow-y-auto hide-scrollbar"
        style={{ borderRight: '1px solid var(--color-border)' }}>
        {listPanel}
      </div>

      {/* Map */}
      <div className="relative h-[42vh] lg:h-auto lg:flex-1 shrink-0">
        <MapView
          center={center}
          zoom={12}
          chargers={chargers}
          selectedId={selectedId}
          onSelect={(c) => setSelectedId(c.id)}
          userLocation={userLoc}
        />
        <button
          onClick={() => userLoc && setCenter([...userLoc])}
          className="tap absolute bottom-4 right-4 p-3 rounded-2xl"
          style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)', zIndex: 500, color: 'var(--color-brand)' }}
          aria-label="My location"
        >
          <LocateFixed size={19} />
        </button>

        {/* Selected charger floating card (map click) */}
        {selected && (
          <div className="absolute left-4 right-4 bottom-4 lg:left-auto lg:right-16 lg:w-[380px] sheet-in" style={{ zIndex: 600 }}>
            <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{selected.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {relLabel(selected.reliability_score)} · {relPct(selected.reliability_score)} · {selected.distance_km} km
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="tap p-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigate(`/charger/${selected.id}`)}
                  className="tap flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                  style={{ background: 'var(--color-brand)' }}
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

      {/* List panel — mobile below map */}
      <div className="lg:hidden flex-1 overflow-y-auto hide-scrollbar">{listPanel}</div>
    </div>
  );
}
