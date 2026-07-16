import { Map, Route, Car, Flag, User, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../contexts/useAuth';

const NAV_ITEMS = [
  { path: '/',             icon: Map,   label: 'Discover',     match: (p) => p === '/' || p.startsWith('/charger') },
  { path: '/trip-planner', icon: Route, label: 'Trip Planner', match: (p) => p.startsWith('/trip') },
  { path: '/report',       icon: Flag,  label: 'Report',       match: (p) => p.startsWith('/report') },
  { path: '/garage',       icon: Car,   label: 'Garage',       match: (p) => p === '/garage' || p === '/add-vehicle' },
  { path: '/profile',      icon: User,  label: 'Profile',      match: (p) => p === '/profile' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0"
      style={{
        width: 240,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div className="px-5 pt-6 pb-8">
        <Logo size={36} wordmarkClass="text-xl" tagline />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ path, icon: Icon, label, match }) => {
          const active = match(location.pathname);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="tap w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: active ? 'var(--amp-gradient-soft)' : 'transparent',
                color: active ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              }}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-5 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="flex items-center justify-center rounded-full font-semibold text-sm shrink-0"
            style={{ width: 36, height: 36, background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}
          >
            {(user?.name || user?.phone || 'A').slice(-2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{user?.name || 'EV Driver'}</div>
            <div className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{user?.phone}</div>
          </div>
          <button
            onClick={signOut}
            aria-label="Log out"
            className="tap p-2 rounded-lg"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
