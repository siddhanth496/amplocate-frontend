import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { relHex, relPct } from '../common/utils/reliability';

// Markers sit on a pale basemap now, so they carry a white keyline instead of a
// black one and lean on a soft drop shadow for separation.
function chargerIcon(charger, selected = false) {
  const color = relHex(charger.reliability_score ?? 0.5);
  const size = selected ? 38 : 30;
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 4px;
      transform: rotate(-45deg); display:flex;align-items:center;justify-content:center;
      background:${color}; border:2.5px solid #ffffff;
      box-shadow:0 ${selected ? 6 : 3}px ${selected ? 16 : 8}px rgba(14,16,19,${selected ? 0.3 : 0.2});
    ">
      <svg width="${size * 0.45}" height="${size * 0.45}" viewBox="0 0 24 24" fill="#ffffff"
        style="transform: rotate(45deg);">
        <path d="M13 2 L5 13 h5 l-2 9 L17 10 h-5 z"/>
      </svg>
    </div>`;
  return L.divIcon({ className: 'amp-marker', html, iconSize: [size, size], iconAnchor: [size / 2, size] });
}

function dotIcon(color, label) {
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
      <div style="width:15px;height:15px;border-radius:50%;background:${color};
        border:3px solid #ffffff;box-shadow:0 2px 8px rgba(14,16,19,0.28);"></div>
      ${label ? `<span style="font:600 10px Inter,sans-serif;color:#0e1013;background:rgba(255,255,255,0.94);padding:1px 6px;border-radius:6px;box-shadow:0 1px 4px rgba(14,16,19,0.16);">${label}</span>` : ''}
    </div>`;
  return L.divIcon({ className: 'amp-marker', html, iconSize: [60, 34], iconAnchor: [30, 8] });
}

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center?.[0], center?.[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick?.([e.latlng.lat, e.latlng.lng]) });
  return null;
}

/**
 * @param {{
 *  center: [number,number], zoom?: number,
 *  chargers?: Array, selectedId?: string,
 *  onSelect?: (charger) => void, onMapClick?: (latlng) => void,
 *  userLocation?: [number,number] | null,
 *  routePoints?: Array<[number,number]>,
 *  markers?: Array<{ pos: [number,number], color: string, label?: string }>,
 *  popup?: boolean,
 * }} props
 */
export default function MapView({
  center, zoom = 13, chargers = [], selectedId, onSelect, onMapClick,
  userLocation, routePoints, markers = [], popup = true, className = '', style,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ width: '100%', height: '100%', zIndex: 0, ...style }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* Positron: near-greyscale basemap so charger colour is the only signal. */}
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <Recenter center={center} zoom={zoom} />
      {onMapClick && <ClickHandler onClick={onMapClick} />}

      {routePoints && routePoints.length > 1 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: '#1b4cf0', weight: 5, opacity: 0.9, lineCap: 'round' }}
        />
      )}

      {userLocation && <Marker position={userLocation} icon={dotIcon('#1b4cf0', 'You')} />}

      {markers.map((m, i) => (
        <Marker key={`m-${i}`} position={m.pos} icon={dotIcon(m.color, m.label)} />
      ))}

      {chargers.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={chargerIcon(c, c.id === selectedId)}
          eventHandlers={{ click: () => onSelect?.(c) }}
        >
          {popup && (
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#545b66', marginTop: 2 }}>
                  {relPct(c.reliability_score)} reliable · {c.operator}
                </div>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
