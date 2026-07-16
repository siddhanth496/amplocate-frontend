import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gauge, Zap, BatteryCharging, MapPin, Flag, IndianRupee, Leaf, Car,
  CheckCircle2, XCircle, ChevronRight, Bike, Plug, Timer,
} from 'lucide-react';
import { listMyVehicles } from '../common/api/vehicles';
import { getMyStats } from '../common/api/users';
import { connectorLabel, timeAgo } from '../common/utils/reliability';

const AC_FALLBACK_KW = 7.4;

function StatCard({ icon: Icon, value, label, tint }) {
  return (
    <div className="card-lift p-4 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: tint || 'var(--amp-gradient-soft)', color: 'var(--color-brand)' }}>
        <Icon size={17} />
      </div>
      <div className="font-display text-xl font-bold tabular-nums mt-2.5 leading-none">{value}</div>
      <div className="text-[11px] font-medium mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
    </div>
  );
}

function VehicleHero({ vehicle }) {
  const navigate = useNavigate();
  const soc = Math.round(vehicle.battery_soc);
  const rangeKm = Math.round((vehicle.battery_kwh * soc / 100) / vehicle.efficiency_wh_per_km * 1000);
  const fullRange = Math.round(vehicle.battery_kwh / vehicle.efficiency_wh_per_km * 1000);
  const dcKw = vehicle.max_dc_power_kw;
  // 20 -> 80% charge time estimates (85% efficiency factor)
  const chargeKwh = vehicle.battery_kwh * 0.6;
  const dcMinutes = dcKw > 0 ? Math.round(chargeKwh / (dcKw * 0.85) * 60) : null;
  const acMinutes = Math.round(chargeKwh / (AC_FALLBACK_KW * 0.85) * 60);
  const Icon = vehicle.category === '2W' ? Bike : Car;

  return (
    <div className="p-5 lg:p-6 rounded-3xl text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f2167 0%, #1d4ed8 55%, #0ea5e9 130%)', boxShadow: 'var(--shadow-brand)' }}>
      {/* faint bolt watermark */}
      <svg viewBox="0 0 64 64" className="absolute -right-4 -bottom-6 opacity-10" width={160} height={160}>
        <path d="M35 10 L18 37 h11 l-4 17 L44 26 h-11 z" fill="#fff" />
      </svg>

      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>
        <Icon size={13} /> Your EV
      </div>
      <div className="flex items-end justify-between gap-4 mt-1 flex-wrap">
        <h2 className="font-display text-2xl font-bold">{vehicle.make} {vehicle.model}</h2>
        <button onClick={() => navigate('/garage')} className="tap text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          Manage
        </button>
      </div>

      {/* battery bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span style={{ color: 'rgba(255,255,255,0.75)' }}>Battery</span>
          <span className="tabular-nums">{soc}% · ~{rangeKm} km left</span>
        </div>
        <div className="mt-1.5 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <div className="h-full rounded-full" style={{
            width: `${soc}%`,
            background: soc < 20 ? '#f87171' : 'linear-gradient(90deg, #34d399, #a7f3d0)',
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* spec grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        {[
          [Zap, `${vehicle.battery_kwh} kWh`, 'battery pack'],
          [Gauge, `${fullRange} km`, 'full range'],
          [Timer, dcMinutes ? `~${dcMinutes} min` : `~${Math.round(acMinutes / 60)}h ${acMinutes % 60}m`,
            dcMinutes ? `20→80% @ ${dcKw} kW DC` : '20→80% @ AC'],
          [Plug, vehicle.connector_types.map(connectorLabel).join(' · '), 'ports'],
        ].map(([I, v, l]) => (
          <div key={l}>
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <I size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /> <span className="truncate">{v}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([listMyVehicles(), getMyStats()])
      .then(([vs, st]) => { setVehicles(vs); setStats(st); })
      .catch((e) => setError(e.message));
  }, []);

  const vehicle = useMemo(
    () => vehicles?.find((v) => v.is_default) || vehicles?.[0],
    [vehicles],
  );

  if (error) {
    return <div className="max-w-3xl mx-auto p-6"><div className="p-4 rounded-2xl text-sm" style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>{error}</div></div>;
  }
  if (!vehicles || !stats) {
    return <div className="h-full flex items-center justify-center">
      <div className="spin rounded-full" style={{ width: 32, height: 32, border: '3px solid var(--color-surface-2)', borderTopColor: 'var(--color-brand)' }} />
    </div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-8 pb-24 screen-fade space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold">EV Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Your car, your charging life, at a glance.
        </p>
      </div>

      {vehicle ? <VehicleHero vehicle={vehicle} /> : (
        <div className="p-8 text-center rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border-dark)' }}>
          <h2 className="font-display font-bold">No EV added yet</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Add your car or scooter to unlock the dashboard.</p>
          <button onClick={() => navigate('/add-vehicle')} className="tap mt-4 px-6 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'var(--amp-gradient)', boxShadow: 'var(--shadow-brand)' }}>
            Add your EV
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-stagger">
        <StatCard icon={BatteryCharging} value={`${stats.energy_kwh} kWh`} label="energy charged" />
        <StatCard icon={Zap}
          value={stats.success_rate != null ? `${Math.round(stats.success_rate * 100)}%` : '—'}
          label={`charge success · ${stats.sessions_total} session${stats.sessions_total === 1 ? '' : 's'}`} />
        <StatCard icon={MapPin} value={stats.chargers_visited} label="chargers visited" />
        <StatCard icon={IndianRupee} value={`₹${Math.round(stats.est_cost_inr)}`} label="est. charging spend" />
        <StatCard icon={Leaf} value={`${stats.co2_saved_kg} kg`} label="CO₂ saved vs petrol"
          tint="var(--color-emerald-light)" />
        <StatCard icon={Flag} value={stats.reports_count} label="community reports" />
      </div>

      {/* Recent sessions */}
      <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="px-4 pt-4 pb-2 font-display text-sm font-bold">Recent charging sessions</div>
        {stats.recent_sessions.length === 0 ? (
          <div className="px-4 pb-5 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            No sessions yet — start one from any charger page when you plug in.
          </div>
        ) : stats.recent_sessions.map((s, i, arr) => (
          <button key={i} onClick={() => navigate(`/charger/${s.charger_id}`)}
            className="tap w-full flex items-center gap-3 px-4 py-3 text-left"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
            {s.successful
              ? <CheckCircle2 size={17} className="shrink-0" style={{ color: 'var(--color-emerald)' }} />
              : s.successful === false
                ? <XCircle size={17} className="shrink-0" style={{ color: 'var(--color-rose)' }} />
                : <BatteryCharging size={17} className="shrink-0" style={{ color: 'var(--color-amber)' }} />}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{s.charger_name}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {timeAgo(s.started_at)}{s.energy_kwh ? ` · ${s.energy_kwh} kWh` : ''}
              </div>
            </div>
            <ChevronRight size={15} className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}
