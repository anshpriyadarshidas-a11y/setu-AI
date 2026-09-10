import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useState, useEffect } from 'react'
import { fetchData } from '../services/api'
import { SEVERITY_COLORS } from '../data/mockData'

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.35);">!</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

const LEGEND = [
  { color: SEVERITY_COLORS.critical, label: 'Critical' },
  { color: SEVERITY_COLORS.high, label: 'High' },
  { color: SEVERITY_COLORS.moderate, label: 'Moderate' },
]

export default function DisruptionMapScreen() {
  const navigate = useNavigate()
  const [allDisruptions, setAllDisruptions] = useState([])

  useEffect(() => {
    fetchData('/disruptions').then((data) => data && setAllDisruptions(data))
  }, [])

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer bg-transparent border-0"
        >
          ← Back
        </button>
        <h2 className="font-bold text-gray-900 text-lg">Live Disruption Map</h2>
        <span className="text-xs text-gray-400">NER region — all active disruptions</span>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4">
        <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-gray-100 min-h-[400px]">
          <MapContainer center={[26.38, 92.09]} zoom={8} scrollWheelZoom={true} style={{ width: '100%', height: '100%', minHeight: 400 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {allDisruptions.map((d) => (
              <Marker
                key={d.id + d.label}
                position={d.coordinates}
                icon={makeIcon(SEVERITY_COLORS[d.severity] || SEVERITY_COLORS.moderate)}
              >
                <Popup>
                  <strong>{d.label}</strong>
                  <br />
                  Severity: <span style={{ color: SEVERITY_COLORS[d.severity] }}>{d.severity}</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="lg:w-64 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legend</p>
            <div className="space-y-2">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full inline-block"
                    style={{ background: l.color }}
                  />
                  <span className="text-sm text-gray-700">{l.label} disruption</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Active disruptions</p>
            <div className="space-y-3">
              {allDisruptions.map((d) => (
                <div key={d.id + d.label} className="flex items-start gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                    style={{ background: SEVERITY_COLORS[d.severity] || SEVERITY_COLORS.moderate }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{d.label}</p>
                    <p className="text-xs text-gray-400 capitalize">{d.type} · {d.severity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
