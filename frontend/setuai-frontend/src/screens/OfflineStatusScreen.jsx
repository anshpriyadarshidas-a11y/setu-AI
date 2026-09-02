import { useNavigate } from 'react-router-dom'
import { mockData } from '../data/mockData'

const MODE_LABELS = { emergency: 'Emergency', freight: 'Freight', accessibility: 'Accessibility' }

export default function OfflineStatusScreen({ mode, syncStatus, setSyncStatus }) {
  const navigate = useNavigate()
  const data = mockData[mode]

  function handleToggle() {
    setSyncStatus((prev) => ({ ...prev, isOffline: !prev.isOffline }))
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-50 p-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer bg-transparent border-0"
        >
          ← Back
        </button>
        <h2 className="font-bold text-gray-900 text-xl">Offline Status</h2>
      </div>

      <div className="max-w-lg w-full mx-auto space-y-4">
        <div
          className={`rounded-xl p-5 border ${
            syncStatus.isOffline
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`w-4 h-4 rounded-full ${
                  syncStatus.isOffline ? 'bg-red-400' : 'bg-green-400'
                }`}
              />
              <div>
                <p className={`font-bold ${syncStatus.isOffline ? 'text-red-800' : 'text-green-800'}`}>
                  {syncStatus.isOffline ? 'Working offline' : 'Online — fully synced'}
                </p>
                <p className={`text-sm ${syncStatus.isOffline ? 'text-red-600' : 'text-green-600'}`}>
                  {syncStatus.isOffline
                    ? `Last synced at ${syncStatus.cachedAt} IST`
                    : `Synced ${syncStatus.lastSyncedMinutesAgo} min ago`}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                syncStatus.isOffline
                  ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
              }`}
            >
              {syncStatus.isOffline ? 'Go online' : 'Go offline'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cached routes available</p>
          <div className="space-y-3">
            {Object.values(mockData).map((d) => (
              <div key={d.mode} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{MODE_LABELS[d.mode]} — {d.route.name}</p>
                  <p className="text-xs text-gray-400">{d.route.distanceKm} km · {d.route.etaText}</p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                  Cached
                </span>
              </div>
            ))}
          </div>
        </div>

        {syncStatus.isOffline && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-bold text-amber-800 text-sm mb-1">Predictive offline mode active</p>
            <p className="text-amber-700 text-sm">
              Showing hourly risk forecast pre-computed at {syncStatus.cachedAt} IST. Predictions are reliable for weather-driven risk but cannot reflect sudden events (e.g. landslides after last sync).
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current session</p>
          <p className="text-sm text-gray-700">
            Mode: <span className="font-semibold">{MODE_LABELS[mode]}</span>
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Route: <span className="font-semibold">{data.route.name} ({data.route.distanceKm} km)</span>
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Risk level: <span className="font-semibold capitalize">{data.route.riskLevel}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
