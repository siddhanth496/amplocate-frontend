import { Map, Route, Gauge, Car, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/',             icon: Map,   label: 'Discover', match: (p) => p === '/' || p.startsWith('/charger') },
  { path: '/trip-planner', icon: Route, label: 'Trip',     match: (p) => p.startsWith('/trip') },
  { path: '/dashboard',    icon: Gauge, label: 'Stats',    match: (p) => p === '/dashboard' },
  { path: '/garage',       icon: Car,   label: 'Garage',   match: (p) => p === '/garage' || p === '/add-vehicle' },
  { path: '/profile',      icon: User,  label: 'Profile',  match: (p) => p === '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      id="bottom-navigation"
      className="lg:hidden safe-bottom shrink-0"
      style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        padding: '6px 8px',
        zIndex: 30,
      }}
    >
      {NAV_ITEMS.map(({ path, icon: Icon, label, match }) => {
        const active = match(location.pathname);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="tap flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl"
            style={{ color: active ? 'var(--color-brand)' : 'var(--color-text-tertiary)' }}
          >
            <Icon size={21} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
