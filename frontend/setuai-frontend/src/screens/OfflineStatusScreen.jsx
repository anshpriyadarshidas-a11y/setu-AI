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
    <div className="flex flex-col flex-1 bg-zinc-950 p-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-zinc-500 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-0"
        >
          ← Back
        </button>
        <h2 className="font-bold text-white text-xl">Offline Status</h2>
      </div>

      <div className="max-w-lg w-full mx-auto space-y-4">
        <div
          className={`rounded-xl p-5 border ${
            syncStatus.isOffline
              ? 'bg-red-900/20 border-red-800'
              : 'bg-green-900/20 border-green-800'
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
                <p className={`font-bold ${syncStatus.isOffline ? 'text-red-300' : 'text-green-300'}`}>
                  {syncStatus.isOffline ? 'Working offline' : 'Online — fully synced'}
                </p>
                <p className={`text-sm ${syncStatus.isOffline ? 'text-red-400' : 'text-green-400'}`}>
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
                  ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60'
                  : 'bg-red-900/40 text-red-400 border-red-700 hover:bg-red-900/60'
              }`}
            >
              {syncStatus.isOffline ? 'Go online' : 'Go offline'}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Cached routes available</p>
          <div className="space-y-3">
            {Object.values(mockData).map((d) => (
              <div key={d.mode} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="font-semibold text-white text-sm">{MODE_LABELS[d.mode]} — {d.route.name}</p>
                  <p className="text-xs text-zinc-400">{d.route.distanceKm} km · {d.route.etaText}</p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800">
                  Cached
                </span>
              </div>
            ))}
          </div>
        </div>

        {syncStatus.isOffline && (
          <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-4">
            <p className="font-bold text-amber-300 text-sm mb-1">Predictive offline mode active</p>
            <p className="text-amber-400 text-sm">
              Showing hourly risk forecast pre-computed at {syncStatus.cachedAt} IST. Predictions are reliable for weather-driven risk but cannot reflect sudden events (e.g. landslides after last sync).
            </p>
          </div>
        )}

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Current session</p>
          <p className="text-sm text-zinc-300">
            Mode: <span className="font-semibold text-white">{MODE_LABELS[mode]}</span>
          </p>
          <p className="text-sm text-zinc-300 mt-1">
            Route: <span className="font-semibold text-white">{data.route.name} ({data.route.distanceKm} km)</span>
          </p>
          <p className="text-sm text-zinc-300 mt-1">
            Risk level: <span className="font-semibold text-white capitalize">{data.route.riskLevel}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
