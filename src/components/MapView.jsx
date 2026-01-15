import React from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  ManualRoute
}) {
  return (
    <MapContainer center={[0, 0]} zoom={2} className="h-full w-full">

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
            <strong>Demo Cleaner: {c.id}</strong>
            <button
              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
              onClick={() => {
                setTargetCoords({ lat: c.lat, lng: c.lng });
                setRecenterTrigger(t => t + 1);
              }}
            >
              Track This Cleaner
            </button>
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
