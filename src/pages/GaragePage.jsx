import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Star, Zap, BatteryMedium, Bike, Car as CarIcon } from 'lucide-react';
import { listMyVehicles, updateVehicle, deleteVehicle } from '../common/api/vehicles';
import { connectorLabel } from '../common/utils/reliability';

function VehicleCard({ vehicle, onChanged }) {
  const [soc, setSoc] = useState(Math.round(vehicle.battery_soc));
  const [busy, setBusy] = useState(false);
  const Icon = vehicle.category === '2W' ? Bike : CarIcon;

  const saveSoc = async (value) => {
    setBusy(true);
    try { await updateVehicle(vehicle.id, { battery_soc: value }); onChanged(); }
    finally { setBusy(false); }
  };

  const rangeKm = Math.round((vehicle.battery_kwh * soc / 100) / vehicle.efficiency_wh_per_km * 1000);

  return (
    <div className="p-5 rounded-3xl" style={{ background: 'var(--color-surface)', border: `1.5px solid ${vehicle.is_default ? 'var(--color-brand)' : 'var(--color-border)'}`, boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
            <Icon size={22} />
          </div>
          <div>
            <div className="font-bold">{vehicle.make} {vehicle.model}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              {vehicle.battery_kwh} kWh · {vehicle.connector_types.map(connectorLabel).join(' · ')}
            </div>
          </div>
        </div>
        {vehicle.is_default ? (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
            <Star size={11} fill="currentColor" /> Default
          </span>
        ) : (
          <button
            onClick={async () => { await updateVehicle(vehicle.id, { is_default: true }); onChanged(); }}
            className="tap text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
          >
            Set default
          </button>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            <BatteryMedium size={14} /> Battery
          </span>
          <span className="font-bold tabular-nums" style={{ color: soc < 20 ? 'var(--color-rose)' : 'var(--color-brand)' }}>
            {soc}% · ~{rangeKm} km
          </span>
        </div>
        <input
          type="range" min={0} max={100} value={soc} disabled={busy}
          onChange={(e) => setSoc(Number(e.target.value))}
          onMouseUp={(e) => saveSoc(Number(e.target.value))}
          onTouchEnd={() => saveSoc(soc)}
          className="w-full mt-2"
        />
      </div>

      <div className="flex justify-end mt-2">
        <button
          onClick={async () => { if (confirm(`Remove ${vehicle.make} ${vehicle.model}?`)) { await deleteVehicle(vehicle.id); onChanged(); } }}
          className="tap flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  );
}

export default function GaragePage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState(null);

  const load = () => listMyVehicles().then(setVehicles).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-8 pb-24 screen-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">My garage</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Your EVs power compatibility filtering and trip planning.
          </p>
        </div>
        <button
          onClick={() => navigate('/add-vehicle')}
          className="tap flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}
        >
          <Plus size={16} /> Add EV
        </button>
      </div>

      {error && <div className="mt-5 p-4 rounded-2xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div>}

      {vehicles && vehicles.length === 0 && (
        <div className="mt-8 p-10 text-center rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border-dark)' }}>
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-brand-light)' }}>
            <Zap size={24} style={{ color: 'var(--color-brand)' }} />
          </div>
          <h2 className="font-bold mt-4">No vehicles yet</h2>
          <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Add your EV to see compatible chargers and plan risk-free trips.
          </p>
          <button onClick={() => navigate('/add-vehicle')} className="tap mt-5 px-6 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: 'var(--color-brand)' }}>
            Add your first EV
          </button>
        </div>
      )}

      <div className="mt-5 grid sm:grid-cols-2 gap-4 animate-stagger">
        {vehicles?.map((v) => <VehicleCard key={v.id} vehicle={v} onChanged={load} />)}
      </div>
    </div>
  );
}
