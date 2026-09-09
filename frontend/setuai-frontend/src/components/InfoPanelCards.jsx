import { RISK_COLORS } from '../data/mockData'

const RISK_LABELS = { low: 'Low Risk', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Critical Risk' }

export function RouteSummaryCard({ route }) {
  return (
    <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Recommended Route</p>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{route.name}</h2>
        <span
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-white"
          style={{ background: RISK_COLORS[route.riskLevel] }}
        >
          <span className="w-2 h-2 rounded-full bg-white opacity-80 inline-block" />
          {RISK_LABELS[route.riskLevel]}
        </span>
      </div>
    </div>
  )
}

export function StatTilesRow({ route }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Distance</p>
        <p className="text-3xl font-bold text-white">{route.distanceKm} <span className="text-base font-medium text-zinc-500">km</span></p>
      </div>
      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">ETA</p>
        <p className="text-3xl font-bold text-white">{route.etaText}</p>
      </div>
    </div>
  )
}

export function AlertCard({ alert }) {
  if (!alert) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-xl mt-0.5">⚠</span>
        <div>
          <p className="font-bold text-red-800 text-sm">{alert.title}</p>
          <p className="text-red-700 text-sm mt-0.5">{alert.message}</p>
        </div>
      </div>
    </div>
  )
}

export function ExplanationCard({ explanation }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Why this route</p>
      <p className="text-gray-700 text-sm leading-relaxed">{explanation}</p>
    </div>
  )
}

export function OfflineBanner({ syncStatus }) {
  if (!syncStatus.isOffline) return null
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
      <span className="text-green-600 text-xl mt-0.5">⚡</span>
      <div>
        <p className="font-bold text-green-800 text-sm">Working offline</p>
        <p className="text-green-700 text-sm mt-0.5">Showing cached route data from {syncStatus.cachedAt} IST</p>
      </div>
    </div>
  )
}

export function CargoSpoilageCard({ cargo }) {
  if (!cargo) return null
  const pressureColor = { low: 'text-green-600', moderate: 'text-amber-600', high: 'text-red-600' }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cargo & Spoilage</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Type</p>
          <p className="font-semibold text-gray-800 text-sm">{cargo.type}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Shelf life left</p>
          <p className="font-bold text-gray-900 text-xl">{cargo.shelfLifeHoursRemaining}h</p>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Spoilage pressure</p>
        <p className={`font-semibold capitalize ${pressureColor[cargo.spoilagePressure] || 'text-gray-700'}`}>{cargo.spoilagePressure}</p>
      </div>
      <p className="text-gray-500 text-xs mt-2 border-t border-gray-100 pt-2">{cargo.delayImpactNote}</p>
    </div>
  )
}

export function AccessibilityRequirementsCard({ accessibility }) {
  if (!accessibility) return null
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Accessibility Requirements</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {accessibility.requirements.map((req) => (
          <span key={req} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
            {req}
          </span>
        ))}
      </div>
      <p className="text-gray-600 text-sm">{accessibility.matchNote}</p>
    </div>
  )
}

export function PrimaryButton({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-full font-semibold py-3.5 rounded-xl transition-colors text-base cursor-pointer border-0 ${
        active
          ? 'bg-green-700 hover:bg-green-600 text-white'
          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
      }`}
    >
      {label}
    </button>
  )
}
