import { useState } from 'react'
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
import { mockData } from '../data/mockData'

const now = new Date()
const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

export default function DashboardScreen({ mode, syncStatus, setSyncStatus }) {
  const navigate = useNavigate()
  const data = mockData[mode]
  const [disrupted, setDisrupted] = useState(false)

  const effectiveAlert = disrupted ? data.alert : null
  const effectiveHazard = disrupted ? data.hazard : null
  const effectiveRoute = {
    ...data.route,
    blockedPath: disrupted ? data.route.blockedPath : null,
    riskLevel: disrupted ? (data.route.riskLevel === 'low' ? 'high' : data.route.riskLevel) : data.route.riskLevel,
  }

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
    <div className="flex flex-col flex-1 bg-gray-50">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate('/location')}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer bg-transparent border-0"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateDisruption}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
              disrupted
                ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {disrupted ? '✓ Disruption active' : 'Simulate disruption'}
          </button>
          <button
            onClick={handleOfflineToggle}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
              syncStatus.isOffline
                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {syncStatus.isOffline ? '⚡ Go online' : 'Go offline'}
          </button>
          <button
            onClick={() => navigate('/disruptions')}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors"
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
              disruptions={data.disruptions}
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
