import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bike, Car as CarIcon, Check, PencilRuler, LibraryBig } from 'lucide-react';
import { getCatalog, addVehicle } from '../common/api/vehicles';
import { connectorLabel, CONNECTOR_LABELS } from '../common/utils/reliability';

const ALL_CONNECTORS = Object.keys(CONNECTOR_LABELS);

function Field({ label, suffix, ...props }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </label>
      <div className="mt-1 flex items-center rounded-xl overflow-hidden"
        style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
        <input {...props} className="flex-1 min-w-0 px-3 py-2.5 text-sm font-medium bg-transparent outline-none" />
        {suffix && <span className="pr-3 text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function ManualForm({ category, soc, setSoc, onSubmit, busy }) {
  const [form, setForm] = useState({ make: '', model: '', battery_kwh: '', range_km: '', max_dc_power_kw: '', connectors: [] });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleConnector = (c) =>
    setForm((f) => ({
      ...f,
      connectors: f.connectors.includes(c) ? f.connectors.filter((x) => x !== c) : [...f.connectors, c],
    }));

  const battery = parseFloat(form.battery_kwh);
  const range = parseFloat(form.range_km);
  const efficiency = battery > 0 && range > 0 ? (battery * 1000) / range : null;
  const valid = form.make.trim() && form.model.trim() && battery > 0 && range > 0 && form.connectors.length > 0;

  return (
    <div className="mt-4 space-y-3.5 screen-fade">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Make" placeholder="e.g. Citroën" value={form.make} onChange={set('make')} />
        <Field label="Model" placeholder="e.g. ëC3" value={form.model} onChange={set('model')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Battery" suffix="kWh" type="number" min="1" step="0.1" placeholder="29.2"
          value={form.battery_kwh} onChange={set('battery_kwh')} />
        <Field label="Real-world range" suffix="km" type="number" min="10" placeholder="260"
          value={form.range_km} onChange={set('range_km')} />
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <Field label="Max DC charging (0 if AC only)" suffix="kW" type="number" min="0" placeholder="30"
          value={form.max_dc_power_kw} onChange={set('max_dc_power_kw')} />
        {efficiency && (
          <div className="text-xs px-3 py-2.5 rounded-xl font-semibold"
            style={{ background: 'var(--amp-gradient-soft)', color: 'var(--color-brand)' }}>
            ≈ {Math.round(efficiency)} Wh/km efficiency
          </div>
        )}
      </div>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
          Charging ports
        </label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {ALL_CONNECTORS.map((c) => (
            <button key={c} onClick={() => toggleConnector(c)}
              className={`tap text-[11px] font-semibold px-2.5 py-1.5 rounded-lg ${form.connectors.includes(c) ? 'amp-gradient-bg text-white' : ''}`}
              style={form.connectors.includes(c) ? {} : { background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
              {connectorLabel(c)}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Current battery level</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-brand)' }}>{soc}%</span>
        </div>
        <input type="range" min={5} max={100} value={soc} onChange={(e) => setSoc(Number(e.target.value))} className="w-full mt-2" />
      </div>
      <button
        onClick={() => onSubmit({
          make: form.make.trim(), model: form.model.trim(), category,
          battery_kwh: battery, efficiency_wh_per_km: Math.round(efficiency),
          connector_types: form.connectors,
          max_dc_power_kw: parseFloat(form.max_dc_power_kw) || 0,
          battery_soc: soc, is_default: true,
        })}
        disabled={!valid || busy}
        className="tap w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
        style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}
      >
        {busy ? 'Adding…' : 'Add my EV'}
      </button>
    </div>
  );
}

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [mode, setMode] = useState('catalog'); // catalog | manual
  const [category, setCategory] = useState('4W');
  const [selected, setSelected] = useState(null);
  const [soc, setSoc] = useState(80);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCatalog().then(setCatalog).catch((e) => setError(e.message));
  }, []);

  const entries = useMemo(() => catalog.filter((e) => e.category === category), [catalog, category]);

  const submit = async (payload) => {
    setBusy(true); setError(null);
    try {
      await addVehicle(payload);
      navigate('/garage');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 pb-28 screen-fade">
      <button onClick={() => navigate(-1)} className="tap flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        <ChevronLeft size={16} /> Back
      </button>
      <h1 className="font-display text-xl font-bold mt-3">Add your EV</h1>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
        We use this to show compatible chargers and plan safe trips.
      </p>

      {/* Category + mode toggles */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
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
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
          {[{ id: 'catalog', icon: LibraryBig, label: 'From catalog' }, { id: 'manual', icon: PencilRuler, label: 'Enter manually' }].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setMode(id); setSelected(null); }}
              className="tap flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: mode === id ? 'var(--color-surface)' : 'transparent',
                color: mode === id ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                boxShadow: mode === id ? 'var(--shadow-sm)' : 'none',
              }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>}

      {mode === 'manual' ? (
        <ManualForm category={category} soc={soc} setSoc={setSoc} onSubmit={submit} busy={busy} />
      ) : (
        <>
          <div className="mt-4 grid sm:grid-cols-2 gap-2.5 animate-stagger">
            {entries.map((e) => {
              const isSel = selected?.id === e.id;
              return (
                <button key={e.id} onClick={() => setSelected(e)}
                  className="tap card-lift text-left p-4 rounded-2xl relative"
                  style={{
                    background: 'var(--color-surface)',
                    border: `1.5px solid ${isSel ? 'var(--color-brand)' : 'var(--color-border)'}`,
                    boxShadow: isSel ? 'var(--shadow-md)' : 'none',
                  }}>
                  {isSel && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center amp-gradient-bg">
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </span>
                  )}
                  <div className="font-display text-sm font-bold">{e.make} {e.model}</div>
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
          <button onClick={() => setMode('manual')} className="tap mt-3 text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
            Can't find your EV? Enter it manually →
          </button>

          {selected && (
            <div className="mt-5 p-4 rounded-2xl sheet-in" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Current battery level</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-brand)' }}>{soc}%</span>
              </div>
              <input type="range" min={5} max={100} value={soc} onChange={(e) => setSoc(Number(e.target.value))} className="w-full mt-2" />
              <button onClick={() => submit({ catalog_id: selected.id, battery_soc: soc, is_default: true })} disabled={busy}
                className="tap mt-4 w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}>
                {busy ? 'Adding…' : `Add ${selected.make} ${selected.model}`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
