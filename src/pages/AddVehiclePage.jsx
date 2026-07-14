import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bike, Car as CarIcon, Check } from 'lucide-react';
import { getCatalog, addVehicle } from '../common/api/vehicles';
import { connectorLabel } from '../common/utils/reliability';

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [category, setCategory] = useState('4W');
  const [selected, setSelected] = useState(null);
  const [soc, setSoc] = useState(80);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCatalog().then(setCatalog).catch((e) => setError(e.message));
  }, []);

  const entries = useMemo(() => catalog.filter((e) => e.category === category), [catalog, category]);

  const submit = async () => {
    if (!selected) return;
    setBusy(true); setError(null);
    try {
      await addVehicle({ catalog_id: selected.id, battery_soc: soc, is_default: true });
      navigate('/garage');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 pb-28 screen-fade">
      <button onClick={() => navigate(-1)} className="tap flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        <ChevronLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-bold mt-3">Add your EV</h1>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
        We use this to show compatible chargers and plan safe trips.
      </p>

      {/* Category toggle */}
      <div className="mt-5 flex gap-2 p-1 rounded-2xl w-fit" style={{ background: 'var(--color-surface-2)' }}>
        {[{ id: '4W', icon: CarIcon, label: 'Car' }, { id: '2W', icon: Bike, label: 'Scooter / Bike' }].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => { setCategory(id); setSelected(null); }}
            className="tap flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: category === id ? 'var(--color-surface)' : 'transparent',
              color: category === id ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              boxShadow: category === id ? 'var(--shadow-sm)' : 'none',
            }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>}

      {/* Model grid */}
      <div className="mt-4 grid sm:grid-cols-2 gap-2.5 animate-stagger">
        {entries.map((e) => {
          const isSel = selected?.id === e.id;
          return (
            <button key={e.id} onClick={() => setSelected(e)}
              className="tap text-left p-4 rounded-2xl relative"
              style={{
                background: 'var(--color-surface)',
                border: `1.5px solid ${isSel ? 'var(--color-brand)' : 'var(--color-border)'}`,
                boxShadow: isSel ? 'var(--shadow-md)' : 'none',
              }}>
              {isSel && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--color-brand)' }}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </span>
              )}
              <div className="text-sm font-bold">{e.make} {e.model}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {e.battery_kwh} kWh · {e.connector_types.map(connectorLabel).join(', ')}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                ~{Math.round(e.battery_kwh / e.efficiency_wh_per_km * 1000)} km range
                {e.max_dc_power_kw > 0 ? ` · DC up to ${e.max_dc_power_kw} kW` : ' · AC charging'}
              </div>
            </button>
          );
        })}
      </div>

      {/* SoC + submit */}
      {selected && (
        <div className="mt-5 p-4 rounded-2xl sheet-in" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Current battery level</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-brand)' }}>{soc}%</span>
          </div>
          <input type="range" min={5} max={100} value={soc} onChange={(e) => setSoc(Number(e.target.value))} className="w-full mt-2" />
          <button onClick={submit} disabled={busy}
            className="tap mt-4 w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'var(--color-brand)', boxShadow: 'var(--shadow-md)' }}>
            {busy ? 'Adding…' : `Add ${selected.make} ${selected.model}`}
          </button>
        </div>
      )}
    </div>
  );
}
