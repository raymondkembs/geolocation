import React from 'react';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, MessageCircle } from 'lucide-react';

function MapResizer({ trigger }) {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timeout);
  }, [map, trigger]);

  return null;
}

export default function MapView({
  targetCoords,
  currentCoords,
  customerCoords,
  activeJob,
  visibleMarkers,
  hardcodedCleaners,
  recenterTrigger,
  setTargetCoords,
  setRecenterTrigger,
  userMarkerIcon,
  createRoleIcon,
  renderPopupContentJSX,
  RecenterMap,
  ManualRoute,
  onStartChat
}) {
 

  return (
    <MapContainer center={[0, 0]} zoom={2} className="h-full w-full">

      <MapResizer trigger={recenterTrigger} />

      {(targetCoords || currentCoords) && (
        <RecenterMap
          coords={targetCoords || currentCoords}
          trigger={recenterTrigger}
        />
      )}

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {currentCoords && customerCoords && activeJob && (
        <ManualRoute from={currentCoords} to={customerCoords} />
      )}

      {currentCoords && targetCoords && (
        <ManualRoute from={currentCoords} to={targetCoords} />
      )}

      {currentCoords && (
        <Marker
          position={[currentCoords.lat, currentCoords.lng]}
          icon={userMarkerIcon}
        >
          <Popup>You (this device)</Popup>
        </Marker>
      )}

      {hardcodedCleaners.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={createRoleIcon(
            'https://img.icons8.com/ios-filled/50/000000/broom.png',
            'cleaner'
          )}
        >
          <Popup>
            <div className="space-y-1">
              {/* Cleaner title */}
              <div className="text-sm font-semibold text-gray-800">
                Demo Cleaner
                <span className="ml-1 text-gray-500 font-normal">
                  #{c.id}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {/* Track button */}
                <button
                  onClick={() => {
                    setTargetCoords({ lat: c.lat, lng: c.lng });
                    setRecenterTrigger(t => t + 1);
                  }}
                  className="
                    inline-flex items-center gap-1.5
                    rounded-md px-3 py-1.5
                    text-xs font-medium
                    bg-blue-500 text-white
                    shadow-sm
                    hover:bg-blue-600
                    active:scale-95
                    transition
                  "
                >
                  <MapPin size={14} />
                  Track
                </button>

                {/* Chat button */}
                <button
                  onClick={() => onStartChat(c.id)}
                  className="
                    inline-flex items-center gap-1.5
                    rounded-md px-3 py-1.5
                    text-xs font-medium
                    bg-emerald-500 text-white
                    shadow-sm
                    hover:bg-emerald-600
                    active:scale-95
                    transition
                  "
                >
                  <MessageCircle size={14} />
                  Chat
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {visibleMarkers.map(([id, loc]) => (
        <Marker
          key={id}
          position={[loc.lat, loc.lng]}
          icon={createRoleIcon(
            loc.role === 'cleaner'
              ? 'https://img.icons8.com/ios-filled/50/000000/broom.png'
              : 'https://img.icons8.com/ios-filled/50/000000/user.png',
            loc.role
          )}
        >
          <Popup>{renderPopupContentJSX(loc)}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
