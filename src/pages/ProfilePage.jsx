import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, Car, Flag, Route } from 'lucide-react';
import { updateMe } from '../common/api/users';
import { useAuth } from '../contexts/useAuth';

export default function ProfilePage() {
  const { user, signOut, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateMe({ name });
      setSaved(true);
      refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl mx-auto p-4 lg:p-8 pb-24 screen-fade">
      <h1 className="text-xl font-bold">Profile</h1>

      <div className="mt-5 p-5 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
            {(name || user?.phone || 'A').slice(-2)}
          </div>
          <div>
            <div className="font-bold">{name || 'EV Driver'}</div>
            <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{user?.phone}</div>
          </div>
        </div>

        <label className="block mt-6 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
          Display name
        </label>
        <div className="flex gap-2 mt-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
          />
          <button onClick={save} disabled={busy || !name.trim()}
            className="tap px-5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: saved ? 'var(--color-emerald)' : 'var(--color-brand)' }}>
            {saved ? <Check size={16} /> : 'Save'}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-3xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {[
          { icon: Car, label: 'My garage', desc: 'Manage vehicles and battery levels', to: '/garage' },
          { icon: Route, label: 'Trip planner', desc: 'Plan a risk-free journey', to: '/trip-planner' },
          { icon: Flag, label: 'Report a charger', desc: 'Help keep reliability scores fresh', to: '/report' },
        ].map(({ icon: Icon, label, desc, to }, i, arr) => (
          <button key={to} onClick={() => navigate(to)}
            className="tap w-full flex items-center gap-4 p-4 text-left"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
            <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={signOut}
        className="tap mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
        style={{ background: 'var(--color-rose-light)', color: 'var(--color-rose)' }}>
        <LogOut size={16} /> Log out
      </button>

      <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        Amplocate v0.1 · The trust layer for EV charging
      </p>
    </div>
  );
}
