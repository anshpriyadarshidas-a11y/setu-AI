import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RouteMap from '../components/RouteMap'
import {
  RouteSummaryCard,
  StatTilesRow,
  AlertCard,
  ExplanationCard,
  OfflineBanner,
  CargoSpoilageCard,
  AccessibilityRequirementsCard,
  PrimaryButton,
} from '../components/InfoPanelCards'

const now = new Date()
const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

export default function DashboardScreen({ mode, syncStatus, setSyncStatus }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [disrupted, setDisrupted] = useState(false)

  useEffect(() => {
    // Replace mock with API fetch
    fetch(`http://localhost:8000/api/routes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            // In a real app, populate these from user context/inputs
            source: { coordinates: [91.73, 26.14] }, 
            destination: { coordinates: [91.89, 25.57] }, 
            mode: mode 
        })
    })
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
  }, [mode])

  if (loading) return <div className="text-white">Loading...</div>
  
  const effectiveAlert = null // disrupted ? data.alert : null
  const effectiveHazard = null // disrupted ? data.hazard : null
  const effectiveRoute = {
    ...data.recommended,
    riskLevel: disrupted ? 'high' : 'low',
    explanation: 'Route optimized for ' + mode,
    blockedPath: null // Added definition
  }
  const disruptions = [] // disrupted ? data.disruptions : []

  function handleSimulateDisruption() {
    setDisrupted((d) => !d)
  }

  function handleOfflineToggle() {
    setSyncStatus((prev) => ({
      ...prev,
      isOffline: !prev.isOffline,
    }))
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <button
          onClick={() => navigate('/location')}
          className="text-sm text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-0"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateDisruption}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
              disrupted
                ? 'bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            {disrupted ? '✓ Disruption active' : 'Simulate disruption'}
          </button>
          <button
            onClick={handleOfflineToggle}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
              syncStatus.isOffline
                ? 'bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            {syncStatus.isOffline ? '⚡ Go online' : 'Go offline'}
          </button>
          <button
            onClick={() => navigate('/disruptions')}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer transition-colors"
          >
            Live map
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-0">
        <div className="lg:flex-1 p-4" style={{ minHeight: 380 }}>
          <div className="h-full min-h-[340px]">
            <RouteMap
              route={effectiveRoute}
              hazard={effectiveHazard}
              disruptions={disruptions}
              showDisruptions={disrupted}
              lastUpdate={timeStr}
            />
          </div>
        </div>

        <div className="lg:w-96 xl:w-[420px] flex flex-col gap-3 p-4 overflow-y-auto">
          <OfflineBanner syncStatus={syncStatus} />
          <RouteSummaryCard route={effectiveRoute} />
          <StatTilesRow route={effectiveRoute} />
          {effectiveAlert && <AlertCard alert={effectiveAlert} />}
          <ExplanationCard explanation={effectiveRoute.explanation} />
          {mode === 'freight' && <CargoSpoilageCard cargo={data.cargo} />}
          {mode === 'accessibility' && <AccessibilityRequirementsCard accessibility={data.accessibility} />}
          <PrimaryButton label="Start navigation" onClick={() => {}} />
        </div>
      </div>
    </div>
  )
}
