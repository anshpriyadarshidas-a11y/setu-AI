import { useNavigate, useLocation } from 'react-router-dom'

const MODES = ['emergency', 'freight', 'accessibility']
const MODE_LABELS = { emergency: 'Emergency', freight: 'Freight', accessibility: 'Accessibility' }

export default function TopNav({ mode, setMode, syncStatus, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const onDashboard = location.pathname === '/dashboard'

  function handleModeSwitch(m) {
    setMode(m)
    if (!onDashboard) navigate('/dashboard')
  }

  return (
    <nav className="w-full bg-gray-900 text-white flex items-center justify-between px-4 py-3 sticky top-0 z-50">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 cursor-pointer bg-transparent border-0 text-white"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm select-none">
          S
        </div>
        <span className="font-semibold text-lg tracking-tight">SetuAI</span>
      </button>

      <div className="flex items-center gap-1 bg-gray-800 rounded-full px-1 py-1">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer border-0 ${
              mode === m
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white bg-transparent'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${syncStatus.isOffline ? 'bg-red-400' : 'bg-green-400'}`}
          />
          <span className="text-gray-300 hidden sm:inline">
            {syncStatus.isOffline
              ? 'Working offline'
              : `Synced ${syncStatus.lastSyncedMinutesAgo} min ago`}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-xs select-none">
          {user.initials}
        </div>
      </div>
    </nav>
  )
}
