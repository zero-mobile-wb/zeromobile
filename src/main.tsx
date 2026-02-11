import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { ThemeProvider } from './context/ThemeContext'
import { BankingProvider } from './context/BankingContext'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#3b82f6',
          showWalletLoginFirst: true,
        },
        loginMethods: ['email', 'wallet', 'google'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        externalWallets: { solana: { connectors: toSolanaWalletConnectors() } },
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc('https://mainnet.helius-rpc.com/?api-key=8b1f5488-b7ad-46c7-ae91-f42dd14a8f46'),
              rpcSubscriptions: createSolanaRpcSubscriptions('wss://mainnet.helius-rpc.com/?api-key=8b1f5488-b7ad-46c7-ae91-f42dd14a8f46'),
            },
          },
        },
      }}
    >
      <ThemeProvider>
        <BankingProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </BankingProvider>
      </ThemeProvider>
    </PrivyProvider>
  </StrictMode>,
)
