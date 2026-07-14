import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ChargerDetailsPage from './pages/ChargerDetailsPage';
import AddVehiclePage from './pages/AddVehiclePage';
import ReportPage from './pages/ReportPage';
import TripPlannerPage from './pages/TripPlannerPage';
import GaragePage from './pages/GaragePage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function FullScreenSpinner() {
  return (
    <div className="h-full flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div
        className="spin rounded-full"
        style={{ width: 36, height: 36, border: '3px solid var(--color-surface-2)', borderTopColor: 'var(--color-brand)' }}
      />
    </div>
  );
}

function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullScreenSpinner />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

function Shell() {
  const { status } = useAuth();
  const authed = status === 'authenticated';

  return (
    <div className="h-full flex" style={{ background: 'var(--color-bg)' }}>
      {authed && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto hide-scrollbar relative">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
            <Route path="/charger/:id" element={<RequireAuth><ChargerDetailsPage /></RequireAuth>} />
            <Route path="/add-vehicle" element={<RequireAuth><AddVehiclePage /></RequireAuth>} />
            <Route path="/report" element={<RequireAuth><ReportPage /></RequireAuth>} />
            <Route path="/report/:chargerId" element={<RequireAuth><ReportPage /></RequireAuth>} />
            <Route path="/trip-planner" element={<RequireAuth><TripPlannerPage /></RequireAuth>} />
            <Route path="/garage" element={<RequireAuth><GaragePage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {authed && <BottomNav />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
