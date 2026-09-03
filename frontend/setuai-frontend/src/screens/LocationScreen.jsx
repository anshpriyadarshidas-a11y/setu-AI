import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const MODE_LABELS = { emergency: 'Emergency', freight: 'Freight', accessibility: 'Accessibility' }

const defaultLocations = {
  emergency: { source: 'Guwahati Medical College', destination: 'Tezpur Civil Hospital' },
  freight: { source: 'Guwahati ICD Depot', destination: 'Dibrugarh Market Hub' },
  accessibility: { source: 'Guwahati Railway Station', destination: 'Jorhat Town Centre' },
}

const pinIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

function MapClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) })
  return null
}

export default function LocationScreen({ mode }) {
  const navigate = useNavigate()
  const defaults = defaultLocations[mode] || defaultLocations.emergency
  const [source, setSource] = useState(defaults.source)
  const [destination, setDestination] = useState(defaults.destination)
  const [srcCoord] = useState([26.1445, 91.7362])
  const [dstCoord] = useState([26.6200, 92.4500])

  function handleFind(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {MODE_LABELS[mode]} Mode
          </span>
          <h2 className="text-2xl font-bold text-white mt-3">Where are you going?</h2>
          <p className="text-zinc-400 text-sm mt-1">Enter your source and destination to get a risk-aware route.</p>
        </div>

        <form onSubmit={handleFind} className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Current location / Source
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Enter starting point"
                className="flex-1 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setSource('Current location')}
                className="px-3 py-3 border border-zinc-700 rounded-xl text-zinc-400 hover:bg-zinc-800 text-sm cursor-pointer bg-zinc-900"
                title="Use current location"
              >
                📍
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination"
              className="w-full border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-base cursor-pointer border-0"
          >
            Find route →
          </button>
        </form>

        <div className="rounded-xl overflow-hidden shadow-sm border border-zinc-800" style={{ height: 220 }}>
          <MapContainer center={[26.38, 92.09]} zoom={7} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={srcCoord} icon={pinIcon('#22c55e')} />
            <Marker position={dstCoord} icon={pinIcon('#ef4444')} />
            <MapClickHandler onPick={() => {}} />
          </MapContainer>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Map preview — NER region</p>
      </div>
    </div>
  )
}
