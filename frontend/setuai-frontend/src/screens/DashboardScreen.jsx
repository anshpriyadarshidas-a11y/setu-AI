import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import RouteMap from '../components/RouteMap'
import AlertPopup from '../components/AlertPopup'
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
import { mockData } from '../data/mockData'

export default function DashboardScreen({ mode, syncStatus, setSyncStatus }) {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state || {}

  const srcCoord = locationState.srcCoord || [26.1445, 91.7362]
  const dstCoord = locationState.dstCoord || [26.6200, 92.4500]

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [disrupted, setDisrupted] = useState(false)
  const [navStarted, setNavStarted] = useState(false)
  
  const [showSMSAlert, setShowSMSAlert] = useState(false)
  const [smsAlertData, setSmsAlertData] = useState(null)

  const srcCoordRef = useRef(srcCoord)
  const dstCoordRef = useRef(dstCoord)

  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`http://localhost:8000/api/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: { coordinates: [srcCoordRef.current[1], srcCoordRef.current[0]] },
        destination: { coordinates: [dstCoordRef.current[1], dstCoordRef.current[0]] },
        mode,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
      .then((json) => {
        if (!cancelled) {
          setData(json.recommended ? json : { recommended: json })
          setLoading(false)
          setError(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(mockData[mode])
          setError(true)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [mode])

  if (loading) return (
    <div className="flex flex-1 items-center justify-center bg-zinc-950">
      <p className="text-zinc-400 text-sm animate-pulse">Calculating risk-aware route...</p>
    </div>
  )

  const modeData = mockData[mode]
  const effectiveAlert = disrupted ? modeData.alert : null
  const effectiveHazard = disrupted ? modeData.hazard : null
  const disruptions = disrupted ? modeData.disruptions : []

  const recommended = data?.recommended || modeData.route
  
  // Format real data
  const distKm = (recommended.distance / 1000).toFixed(1)
  const etaMins = Math.round(recommended.estimatedTime / 60)
  const etaText = `${Math.floor(etaMins / 60)}h ${etaMins % 60}m`

  const effectiveRoute = {
    ...recommended,
    distanceKm: recommended.distanceKm || distKm,
    etaText: recommended.etaText || etaText,
    riskLevel: disrupted ? 'high' : (recommended.riskLevel || 'low'),
    explanation: disrupted
      ? (modeData.alert?.message || 'Disruption detected — alternative route recommended.')
      : ('Route optimized for ' + mode + ' mode.'),
    blockedPath: disrupted ? modeData.route.blockedPath : null,
  }

  function handleSimulateDisruption() {
    setDisrupted((d) => !d)
    
    // Simulate SMS alert popping up for demo
    if (!disrupted) {
      setSmsAlertData({
        segmentName: 'NH-27 Landslide Zone',
        oldLevel: 'Moderate',
        newLevel: 'Critical'
      })
      setShowSMSAlert(true)
    }
  }

  function handleOfflineToggle() {
    setSyncStatus((prev) => ({
      ...prev,
      isOffline: !prev.isOffline,
    }))
  }

  function handleStartNavigation() {
    setNavStarted(true)
    setTimeout(() => setNavStarted(false), 3000)
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-950">
      {showSMSAlert && (
          <AlertPopup alert={smsAlertData} onClose={() => setShowSMSAlert(false)} />
      )}
      {error && (
        <div className="px-4 py-2 bg-amber-900/40 border-b border-amber-800 text-amber-400 text-xs text-center">
          Backend unreachable — showing cached route data
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <button
          onClick={() => navigate(-1)}
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
          {mode === 'freight' && <CargoSpoilageCard cargo={data?.cargo || modeData.cargo} />}
          {mode === 'accessibility' && <AccessibilityRequirementsCard accessibility={data?.accessibility || modeData.accessibility} />}
          <PrimaryButton
            label={navStarted ? '✓ Navigation started!' : 'Start navigation'}
            onClick={handleStartNavigation}
            active={navStarted}
          />
        </div>
      </div>
    </div>
  )
}
