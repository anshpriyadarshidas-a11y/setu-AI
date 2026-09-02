export const MODES = ['emergency', 'freight', 'accessibility']

export const mockData = {
  emergency: {
    mode: 'emergency',
    user: { initials: 'RK' },
    syncStatus: {
      isOffline: false,
      lastSyncedMinutesAgo: 2,
      cachedAt: '08:42',
    },
    route: {
      name: 'Route B',
      riskLevel: 'low',
      distanceKm: 205,
      etaText: '4h 30m',
      recommendedPath: [
        [26.1445, 91.7362],
        [26.2000, 91.8500],
        [26.3500, 92.0000],
        [26.5000, 92.2000],
        [26.6200, 92.4500],
      ],
      blockedPath: [
        [26.1445, 91.7362],
        [26.2500, 91.9200],
        [26.3800, 92.1000],
        [26.5000, 92.2000],
      ],
      explanation:
        'Route B avoids the flagged landslide zone near KM 42, adding 25 minutes but cutting overall risk exposure by roughly 70% compared to Route A.',
    },
    alert: {
      title: 'Route A blocked',
      message: 'Landslide reported near KM 42. Rerouted automatically via Route B.',
    },
    hazard: {
      type: 'landslide',
      label: 'Landslide reported',
      coordinates: [26.3000, 91.9500],
    },
    disruptions: [
      { id: 1, type: 'landslide', label: 'Landslide – KM 42', coordinates: [26.3000, 91.9500], severity: 'critical' },
      { id: 2, type: 'flood', label: 'Flood zone – NH-27', coordinates: [26.4500, 92.1000], severity: 'high' },
      { id: 3, type: 'rain', label: 'Heavy rain – Guwahati bypass', coordinates: [26.1700, 91.7800], severity: 'moderate' },
    ],
  },
  freight: {
    mode: 'freight',
    user: { initials: 'RK' },
    syncStatus: {
      isOffline: false,
      lastSyncedMinutesAgo: 5,
      cachedAt: '09:10',
    },
    route: {
      name: 'Route C',
      riskLevel: 'moderate',
      distanceKm: 218,
      etaText: '5h 10m',
      recommendedPath: [
        [26.1445, 91.7362],
        [26.1800, 91.8800],
        [26.3200, 92.0500],
        [26.5200, 92.2800],
        [26.6200, 92.4500],
      ],
      blockedPath: [
        [26.1445, 91.7362],
        [26.2500, 91.9200],
        [26.3800, 92.1000],
        [26.5000, 92.2000],
      ],
      explanation:
        'Route C takes the NH-37 corridor, avoiding the flood-prone NH-27 stretch. The extra 18km reduces spoilage risk for perishable cargo.',
    },
    alert: {
      title: 'NH-27 flood risk',
      message: 'Flood alerts on NH-27. Rerouted via NH-37 to protect cargo.',
    },
    hazard: {
      type: 'flood',
      label: 'Flood risk zone',
      coordinates: [26.3500, 92.0800],
    },
    cargo: {
      type: 'Perishable – Agricultural produce',
      shelfLifeHoursRemaining: 18,
      spoilagePressure: 'moderate',
      delayImpactNote: '1.5h added delay puts cargo at moderate spoilage risk. Recommend refrigerated transport.',
    },
    disruptions: [
      { id: 1, type: 'flood', label: 'Flood zone – NH-27', coordinates: [26.4500, 92.1000], severity: 'high' },
      { id: 2, type: 'rain', label: 'Heavy rain – Dibrugarh approach', coordinates: [26.5000, 92.3000], severity: 'moderate' },
    ],
  },
  accessibility: {
    mode: 'accessibility',
    user: { initials: 'RK' },
    syncStatus: {
      isOffline: false,
      lastSyncedMinutesAgo: 1,
      cachedAt: '09:30',
    },
    route: {
      name: 'Route D',
      riskLevel: 'low',
      distanceKm: 212,
      etaText: '4h 45m',
      recommendedPath: [
        [26.1445, 91.7362],
        [26.1900, 91.8600],
        [26.3400, 92.0200],
        [26.5100, 92.2400],
        [26.6200, 92.4500],
      ],
      blockedPath: null,
      explanation:
        'Route D uses fully paved, low-gradient roads with no segments above the steep-terrain threshold. All stops on this route have reported accessible facilities.',
    },
    alert: null,
    hazard: null,
    accessibility: {
      requirements: ['Wheelchair-friendly', 'Avoid steep terrain', 'Elderly-friendly', 'Accessible vehicle required'],
      matchNote: 'Route D has no segments above the steep-terrain threshold and all stops are wheelchair accessible.',
    },
    disruptions: [
      { id: 1, type: 'rain', label: 'Moderate rain – Bypass road', coordinates: [26.2500, 91.9500], severity: 'moderate' },
    ],
  },
}

export const RISK_COLORS = {
  low: '#22c55e',
  moderate: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
}

export const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#f97316',
  moderate: '#f59e0b',
  low: '#22c55e',
}
