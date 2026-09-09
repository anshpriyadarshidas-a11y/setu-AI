import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'

const hazardIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">⚠</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true })
    }
  }, [center, map])
  return null
}

export default function RouteMap({ route, hazard, disruptions, showDisruptions = false, lastUpdate }) {
  const center = route?.recommendedPath
    ? route.recommendedPath[Math.floor(route.recommendedPath.length / 2)]
    : [26.3, 92.1]

  return (
    <div className="relative w-full h-full min-h-[340px] rounded-xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={8}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: 340, borderRadius: 12 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={center} />

        {route?.blockedPath && (
          <Polyline
            positions={route.blockedPath}
            pathOptions={{ color: '#ef4444', weight: 4, dashArray: '8 6', opacity: 0.8 }}
          />
        )}

        {route?.recommendedPath && (
          <Polyline
            positions={route.recommendedPath}
            pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.95 }}
          />
        )}

        {route?.recommendedPath && (
          <>
            <CircleMarker
              center={route.recommendedPath[0]}
              radius={9}
              pathOptions={{ color: '#1d4ed8', weight: 3, fillColor: 'white', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]}>Start</Tooltip>
            </CircleMarker>
            <CircleMarker
              center={route.recommendedPath[route.recommendedPath.length - 1]}
              radius={9}
              pathOptions={{ color: '#1d4ed8', weight: 3, fillColor: '#1d4ed8', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]}>End</Tooltip>
            </CircleMarker>
          </>
        )}

        {hazard && (
          <Marker position={hazard.coordinates} icon={hazardIcon}>
            <Popup>{hazard.label}</Popup>
          </Marker>
        )}

        {showDisruptions && disruptions?.map((d) => (
          <Marker key={d.id} position={d.coordinates} icon={L.divIcon({
            className: '',
            html: `<div style="background:${d.severity === 'critical' ? '#dc2626' : d.severity === 'high' ? '#f97316' : '#f59e0b'};color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 4px rgba(0,0,0,0.3);">!</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}>
            <Popup>{d.label}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {lastUpdate && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 rounded-full px-3 py-1 text-xs font-medium text-gray-700 shadow">
          Last update {lastUpdate} IST
        </div>
      )}
    </div>
  )
}
