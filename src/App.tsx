import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import DashboardLayout from './components/DashboardLayout'
import CryptoDashboard from './components/CryptoDashboard'
import ZeroAlphaDashboard from './components/ZeroAlphaDashboard'
import Settings from './components/Settings'
import PortfolioWrapper from './components/PortfolioWrapper'
import DigitalPreloader from './components/DigitalPreloader'
import XNFTDevPreview from './components/XNFTDevPreview'
import SendPageWrapper from './components/SendPageWrapper'
import ReceivePageWrapper from './components/ReceivePageWrapper'
import VaultPasskeyGuard from './components/VaultPasskeyGuard'
import './App.css'

function App() {
  const { ready, authenticated } = useAuth()

  if (!ready) {
    return <DigitalPreloader />
  }

  return (
    <Routes>
      <Route path="/" element={!authenticated ? <LoginScreen /> : <Navigate to="/dashboard" />} />

      <Route path="/dashboard" element={authenticated ? <VaultPasskeyGuard><DashboardLayout /></VaultPasskeyGuard> : <Navigate to="/" />}>
        <Route index element={<CryptoDashboard />} />
      </Route>
      <Route path="/send" element={authenticated ? <VaultPasskeyGuard><DashboardLayout /></VaultPasskeyGuard> : <Navigate to="/" />}>
        <Route index element={<SendPageWrapper />} />
      </Route>
      <Route path="/receive" element={authenticated ? <VaultPasskeyGuard><DashboardLayout /></VaultPasskeyGuard> : <Navigate to="/" />}>
        <Route index element={<ReceivePageWrapper />} />
      </Route>
      <Route path="/zeroalpha" element={authenticated ? <VaultPasskeyGuard><DashboardLayout /></VaultPasskeyGuard> : <Navigate to="/" />}>
        <Route index element={<ZeroAlphaDashboard />} />
      </Route>
      <Route path="/portfolio" element={authenticated ? <VaultPasskeyGuard><DashboardLayout /></VaultPasskeyGuard> : <Navigate to="/" />}>
        <Route index element={<PortfolioWrapper />} />
      </Route>
      <Route path="/settings" element={authenticated ? <VaultPasskeyGuard><DashboardLayout /></VaultPasskeyGuard> : <Navigate to="/" />}>
        <Route index element={<Settings />} />
      </Route>

      {/* Dev Tools */}
      <Route path="/xnft/preview" element={<XNFTDevPreview />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
