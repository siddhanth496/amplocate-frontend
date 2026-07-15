import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, LocateFixed, Loader2 } from 'lucide-react';

/**
 * Type-ahead place search backed by OpenStreetMap Nominatim (free, no key).
 * onSelect receives { label, lat, lng }.
 */
export default function LocationSearch({
  placeholder = 'Search a place…',
  onSelect,
  allowMyLocation = false,
  compact = false,
  initialQuery = '',
  autoFocus = false,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 3) { setResults([]); setBusy(false); return; }
    setBusy(true);
    timer.current = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`,
          { headers: { Accept: 'application/json' } },
        );
        const data = await resp.json();
        setResults(data.map((r) => ({
          label: r.display_name.split(',').slice(0, 3).join(','),
          full: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        })));
        setOpen(true);
      } catch {
        setResults([]);
      } finally { setBusy(false); }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [query]);

  const pick = (r) => {
    onSelect?.(r);
    setQuery(r.label);
    setOpen(false);
  };

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => pick({ label: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 },
    );
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <div
        className="flex items-center gap-2 rounded-2xl px-3.5"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-dark)',
          height: compact ? 42 : 48,
          boxShadow: compact ? 'var(--shadow-md)' : 'none',
        }}
      >
        {busy
          ? <Loader2 size={16} className="spin shrink-0" style={{ color: 'var(--color-brand)' }} />
          : <Search size={16} className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />}
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (results.length || allowMyLocation) && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium"
        />
      </div>

      {open && (results.length > 0 || allowMyLocation) && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-2xl overflow-hidden screen-fade"
          style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)', zIndex: 900 }}
        >
          {allowMyLocation && (
            <button onClick={useMyLocation}
              className="tap w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold"
              style={{ color: 'var(--color-brand)', borderBottom: results.length ? '1px solid var(--color-border-light)' : 'none' }}>
              <LocateFixed size={15} /> Use my current location
            </button>
          )}
          {results.map((r, i) => (
            <button key={i} onClick={() => pick(r)}
              className="tap w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-[var(--color-surface-alt)]">
              <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
