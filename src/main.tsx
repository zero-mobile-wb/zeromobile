import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { BankingProvider } from './context/BankingContext'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <BankingProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </BankingProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
