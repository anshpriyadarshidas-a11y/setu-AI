import { useNavigate } from 'react-router-dom'
import DefenseLines from '../components/DefenseLines'

const MODES = [
  {
    id: 'emergency',
    label: 'Emergency',
    icon: '🚨',
    description: 'Priority routing for ambulances and relief teams around active disruptions',
    borderColor: 'border-red-600',
    hoverBg: 'hover:bg-red-950/40',
    badgeBg: 'bg-red-950/50',
    badgeText: 'text-red-300',
  },
  {
    id: 'freight',
    label: 'Freight',
    icon: '🚛',
    description: 'Cargo routing accounting for spoilage pressure, road reliability, and delay risk',
    borderColor: 'border-amber-600',
    hoverBg: 'hover:bg-amber-950/40',
    badgeBg: 'bg-amber-950/50',
    badgeText: 'text-amber-300',
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: '♿',
    description: 'Routes suited for elderly and disabled users with accessible vehicle matching',
    borderColor: 'border-blue-600',
    hoverBg: 'hover:bg-blue-950/40',
    badgeBg: 'bg-blue-950/50',
    badgeText: 'text-blue-300',
  },
]

export default function HomeScreen({ setMode }) {
  const navigate = useNavigate()

  function handleSelect(modeId) {
    setMode(modeId)
    navigate('/location')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <DefenseLines />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              S
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">SetuAI</h1>
          </div>
          <p className="text-gray-300 max-w-md text-base">
            AI-based smart logistics, accessibility, and emergency-response routing for India's North Eastern Region.
          </p>
          <p className="text-gray-400 text-sm mt-2">Choose a mode to get started</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className={`bg-zinc-900 border-2 ${m.borderColor} ${m.hoverBg} rounded-2xl p-6 text-left transition-all cursor-pointer shadow-sm hover:shadow-md`}
            >
              <div className="text-3xl mb-3">{m.icon}</div>
              <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${m.badgeBg} ${m.badgeText}`}>
                {m.label}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{m.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-400 text-xs max-w-sm">
            One shared risk-prediction engine powers all three modes. Risk scores are decision-support indicators — not safety guarantees.
          </p>
        </div>
      </div>
    </div>
  )
}
