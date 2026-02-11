import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import DashboardLayout from './components/DashboardLayout'
import CryptoDashboard from './components/CryptoDashboard'
import ZeroAlphaDashboard from './components/ZeroAlphaDashboard'
import Settings from './components/Settings'
import PortfolioWrapper from './components/PortfolioWrapper'
import DigitalPreloader from './components/DigitalPreloader'
import './App.css'

function App() {
  const { ready, authenticated, login } = usePrivy()
  const [timedOut, setTimedOut] = useState(false)

  // Loading timeout to prevent infinite loop
  useEffect(() => {
    if (!ready) {
      const timer = setTimeout(() => {
        setTimedOut(true)
      }, 10000) // 10 seconds timeout
      return () => clearTimeout(timer)
    }
  }, [ready])

  // Loading state
  if (!ready && !timedOut) {
    return <DigitalPreloader />
  }

  // Fallback if Privy fails to initialize
  if (timedOut && !ready) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-white text-xl font-semibold mb-4">Initialization Timeout</h2>
        <p className="text-gray-400 mb-8 max-w-sm">
          We're having trouble connecting to the network. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >



          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={!authenticated ? <LoginScreen onLogin={login} /> : <Navigate to="/dashboard" />} />

      {/* All authenticated routes use DashboardLayout wrapper */}
      <Route path="/dashboard" element={authenticated ? <DashboardLayout /> : <Navigate to="/" />}>
        <Route index element={<CryptoDashboard />} />
      </Route>
      <Route path="/zeroalpha" element={authenticated ? <DashboardLayout /> : <Navigate to="/" />}>
        <Route index element={<ZeroAlphaDashboard />} />
      </Route>
      <Route path="/portfolio" element={authenticated ? <DashboardLayout /> : <Navigate to="/" />}>
        <Route index element={<PortfolioWrapper />} />
      </Route>
      <Route path="/settings" element={authenticated ? <DashboardLayout /> : <Navigate to="/" />}>
        <Route index element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
