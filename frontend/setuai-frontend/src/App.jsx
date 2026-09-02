import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TopNav from './components/TopNav'
import HomeScreen from './screens/HomeScreen'
import LocationScreen from './screens/LocationScreen'
import DashboardScreen from './screens/DashboardScreen'
import DisruptionMapScreen from './screens/DisruptionMapScreen'
import OfflineStatusScreen from './screens/OfflineStatusScreen'
import { mockData } from './data/mockData'
import './index.css'

export default function App() {
  const [mode, setMode] = useState('emergency')
  const [syncStatus, setSyncStatus] = useState(mockData.emergency.syncStatus)

  const user = mockData[mode]?.user || { initials: 'RK' }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-svh bg-gray-50">
        <TopNav mode={mode} setMode={setMode} syncStatus={syncStatus} user={user} />
        <Routes>
          <Route path="/" element={<HomeScreen setMode={setMode} />} />
          <Route path="/location" element={<LocationScreen mode={mode} />} />
          <Route
            path="/dashboard"
            element={
              <DashboardScreen
                mode={mode}
                syncStatus={syncStatus}
                setSyncStatus={setSyncStatus}
              />
            }
          />
          <Route path="/disruptions" element={<DisruptionMapScreen />} />
          <Route
            path="/offline"
            element={
              <OfflineStatusScreen
                mode={mode}
                syncStatus={syncStatus}
                setSyncStatus={setSyncStatus}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
