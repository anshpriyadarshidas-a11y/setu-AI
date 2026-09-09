import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const MODE_LABELS = { emergency: 'Emergency', freight: 'Freight', accessibility: 'Accessibility' }

const defaultLocations = {
  emergency: {
    source: 'Guwahati Medical College',
    destination: 'Tezpur Civil Hospital',
    srcCoord: [26.1445, 91.7362],
    dstCoord: [26.6200, 92.4500],
  },
  freight: {
    source: 'Guwahati ICD Depot',
    destination: 'Dibrugarh Market Hub',
    srcCoord: [26.1445, 91.7362],
    dstCoord: [26.6200, 92.4500],
  },
  accessibility: {
    source: 'Guwahati Railway Station',
    destination: 'Jorhat Town Centre',
    srcCoord: [26.1445, 91.7362],
    dstCoord: [26.6200, 92.4500],
  },
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
  const [srcCoord, setSrcCoord] = useState(defaults.srcCoord)
  const [dstCoord, setDstCoord] = useState(defaults.dstCoord)
  const [picking, setPicking] = useState(null)
  
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsEnabled, setSmsEnabled] = useState(false)

  function handleMapClick(latlng) {
    if (picking === 'src') {
      setSrcCoord([latlng.lat, latlng.lng])
      setSource(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`)
      setPicking(null)
    } else if (picking === 'dst') {
      setDstCoord([latlng.lat, latlng.lng])
      setDestination(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`)
      setPicking(null)
    }
  }

  function handleFind(e) {
    e.preventDefault()
    navigate('/dashboard', {
      state: {
        source,
        destination,
        srcCoord,
        dstCoord,
        phoneNumber,
        smsEnabled
      },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-900/40 px-3 py-1 rounded-full">
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
                onClick={() => setPicking(picking === 'src' ? null : 'src')}
                className={`px-3 py-3 border rounded-xl text-sm cursor-pointer transition-colors ${picking === 'src' ? 'border-blue-500 bg-blue-900/40 text-blue-400' : 'border-zinc-700 rounded-xl text-zinc-400 hover:bg-zinc-800 bg-zinc-900'}`}
                title="Pick source on map"
              >
                📍
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Destination
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination"
                className="flex-1 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setPicking(picking === 'dst' ? null : 'dst')}
                className={`px-3 py-3 border rounded-xl text-sm cursor-pointer transition-colors ${picking === 'dst' ? 'border-red-500 bg-red-900/40 text-red-400' : 'border-zinc-700 rounded-xl text-zinc-400 hover:bg-zinc-800 bg-zinc-900'}`}
                title="Pick destination on map"
              >
                🏁
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-4">
            <h3 className="text-sm font-semibold text-white mb-3">SMS Alert Bridge</h3>
            <label className="flex items-center gap-2 text-zinc-300 text-sm mb-3 cursor-pointer">
              <input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />
              Enable SMS alerts for disruption
            </label>
            {smsEnabled && (
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="w-full border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white bg-zinc-950"
              />
            )}
          </div>

          {picking && (
            <p className="text-xs text-blue-400 text-center animate-pulse">
              Click on the map to set your {picking === 'src' ? 'source' : 'destination'}
            </p>
          )}

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
            <MapClickHandler onPick={handleMapClick} />
          </MapContainer>
        </div>
        <p className="text-xs text-zinc-500 mt-2 text-center">
          {picking ? `Tap the map to pick ${picking === 'src' ? 'source 📍' : 'destination 🏁'}` : 'Map preview — NER region'}
        </p>
      </div>
    </div>
  )
}
