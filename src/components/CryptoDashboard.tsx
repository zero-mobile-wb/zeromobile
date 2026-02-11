import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets, useCreateWallet } from '@privy-io/react-auth/solana'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Send, ArrowDownToLine, ArrowLeftRight, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react'
import logo from '../assets/0.jpg'
import { getTopTransactions, Transaction } from '../utils/getTransaction'
import SendModal from './SendModal'
import ReceiveModal from './ReceiveModal'

// RPC Configuration with failover
const RPC_URLS = [
  'https://mainnet.helius-rpc.com/?api-key=8b1f5488-b7ad-46c7-ae91-f42dd14a8f46',
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.g.allthatnode.com/full/mainnet',
]

let activeRpcIndex = 0
let connection = new Connection(RPC_URLS[activeRpcIndex], 'confirmed')

const rotateRpc = () => {
  activeRpcIndex = (activeRpcIndex + 1) % RPC_URLS.length
  connection = new Connection(RPC_URLS[activeRpcIndex], 'confirmed')
  console.log('Switched to fallback RPC:', RPC_URLS[activeRpcIndex])
}

interface Token {
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  tags?: string[]
}

interface TokenBalance {
  mint: string
  balance: number
  decimals: number
  amount: string
  metadata?: Token
  usdValue?: number
  pricePerToken?: number
}

export default function CryptoDashboard() {
  const { user, ready } = usePrivy()
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()

  const [totalUsdBalance, setTotalUsdBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenMetadata, setTokenMetadata] = useState<Token[]>([])
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)
  const [checkingWallet, setCheckingWallet] = useState(true)

  // Get the first Solana wallet
  const solanaWallet = wallets[0]

  // Check wallet loading state
  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => {
        setCheckingWallet(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [ready])

  // Fetch token metadata from Jupiter
  useEffect(() => {
    const fetchTokenMetadata = async () => {
      try {
        // Use the all tokens endpoint which is more reliable
        const response = await fetch('https://tokens.jup.ag/tokens?tags=verified')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setTokenMetadata(data)
      } catch (err) {
        console.error('Error fetching token metadata:', err)
        // Set empty array on error to prevent blocking the app
        setTokenMetadata([])
      }
    }

    fetchTokenMetadata()
  }, [])

  // Fetch token balances with USD values
  const fetchTokenBalances = async (retryCount = 0): Promise<void> => {
    if (!solanaWallet) {
      console.log('No solana wallet available for balance fetch')
      return
    }

    setLoadingTokens(true)
    setError(null)
    try {
      console.log(`Fetching balances for: ${solanaWallet.address} using RPC ${activeRpcIndex}`)
      const publicKey = new PublicKey(solanaWallet.address)

      // Fetch SOL balance
      const lamports = await connection.getBalance(publicKey)
      const solBalance = lamports / LAMPORTS_PER_SOL
      console.log('SOL Balance:', solBalance)

      // Get all token accounts
      const response = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      )

      const tokenAccounts = response.value
        .map((accountInfo) => {
          const tokenData = accountInfo.account.data.parsed.info
          return {
            mint: tokenData.mint,
            balance: tokenData.tokenAmount.uiAmount,
            decimals: tokenData.tokenAmount.decimals,
            amount: tokenData.tokenAmount.amount
          }
        })
        .filter(token => token.balance > 0)

      const SOL_MINT = 'So11111111111111111111111111111111111111112'
      const allMints = [SOL_MINT, ...tokenAccounts.map(t => t.mint)]

      // Fetch prices with explicit fallbacks
      let priceData: any = { data: {} }
      const jupKey = import.meta.env.VITE_JUPITER_API_KEY
      const headers: Record<string, string> = {}
      if (jupKey) headers['x-api-key'] = jupKey

      try {
        const priceResponse = await fetch(`/api/jupiter/price/v3?ids=${allMints.join(',')}`, {
          headers
        })

        if (priceResponse.ok) {
          priceData = await priceResponse.json()
        } else {
          console.warn(`Jupiter Price API returned ${priceResponse.status}. Using Fallbacks...`)
        }
      } catch (priceErr) {
        console.error('Error fetching from Jupiter Price API:', priceErr)
      }

      // Always try CoinGecko for SOL if we don't have a price yet
      if (!priceData.data?.[SOL_MINT]?.price && !priceData[SOL_MINT]?.price) {
        try {
          const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
          if (cgResponse.ok) {
            const cgData = await cgResponse.json()
            const solPrice = cgData.solana?.usd
            if (solPrice) {
              if (!priceData.data) priceData.data = {}
              priceData.data[SOL_MINT] = { price: solPrice }
            }
          }
        } catch (cgErr) {
          console.error('CoinGecko fallback failed:', cgErr)
        }
      }

      // Fallback for other tokens using DexScreener
      for (const mint of tokenAccounts.map(t => t.mint)) {
        if (!priceData.data?.[mint]?.price && !priceData[mint]?.price) {
          try {
            const dsResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`)
            if (dsResponse.ok) {
              const dsData = await dsResponse.json()
              const pair = dsData.pairs?.[0]
              if (pair?.priceUsd) {
                if (!priceData.data) priceData.data = {}
                priceData.data[mint] = { price: parseFloat(pair.priceUsd) }
              }
            }
          } catch (dsErr) {
            console.error(`DexScreener fallback failed for ${mint}:`, dsErr)
          }
        }
      }

      const allBalances: TokenBalance[] = []
      const getPrice = (mint: string) => {
        if (priceData.data?.[mint]?.price) return Number(priceData.data[mint].price)
        if (priceData[mint]?.price) return Number(priceData[mint].price)
        return 0
      }

      const solPrice = getPrice(SOL_MINT)
      const solMetadata = tokenMetadata.find(t => t.address === SOL_MINT)
      const solUsdValue = Number(solBalance * solPrice)

      allBalances.push({
        mint: SOL_MINT,
        balance: solBalance,
        decimals: 9,
        amount: (solBalance * LAMPORTS_PER_SOL).toString(),
        pricePerToken: solPrice,
        usdValue: solUsdValue,
        metadata: solMetadata || {
          address: SOL_MINT,
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9,
          logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
        }
      })

      for (const token of tokenAccounts) {
        const price = getPrice(token.mint)
        const metadata = tokenMetadata.find(t => t.address === token.mint)

        allBalances.push({
          mint: token.mint,
          balance: token.balance,
          decimals: token.decimals,
          amount: token.amount,
          pricePerToken: price,
          usdValue: token.balance * price,
          metadata: metadata || {
            address: token.mint,
            name: 'Unknown Token',
            symbol: token.mint.slice(0, 6),
            decimals: token.decimals
          }
        })
      }

      const totalUsd = allBalances.reduce((sum, token) => sum + (token.usdValue || 0), 0)
      setTotalUsdBalance(totalUsd)
      setTokenBalances(allBalances)
    } catch (err: any) {
      console.error('Error fetching token balances:', err)
      if (retryCount < RPC_URLS.length - 1) {
        rotateRpc()
        return fetchTokenBalances(retryCount + 1)
      }
      setError(`RPC Error: ${err.message || 'Connection failed'}`)
    } finally {
      setLoadingTokens(false)
    }
  }

  // Fetch token balances when wallet is available
  useEffect(() => {
    if (solanaWallet) {
      fetchTokenBalances()
    }
  }, [solanaWallet])

  // Create Solana wallet
  const handleCreateWallet = async () => {
    setLoading(true)
    setError(null)
    try {
      const { wallet } = await createWallet()
      console.log('Wallet created:', wallet)
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet')
      console.error('Error creating wallet:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch recent transactions
  const fetchTransactions = async (retryCount = 0): Promise<void> => {
    if (!solanaWallet) return

    setLoadingTransactions(true)
    try {
      const txs = await getTopTransactions(solanaWallet.address)
      setTransactions(txs)
    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      if (retryCount < RPC_URLS.length - 1) {
        rotateRpc()
        return fetchTransactions(retryCount + 1)
      }
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Fetch transactions when wallet is available
  useEffect(() => {
    if (solanaWallet) {
      fetchTransactions()
    }
  }, [solanaWallet])

  // Refresh all data
  const handleRefresh = async () => {
    await fetchTokenBalances()
    await fetchTransactions()
  }

  if (!user || (!solanaWallet && !checkingWallet && !loading)) {
    // If not loading and no wallet, show create wallet
    // But wait, user might be authenticated but no solana wallet
    // This view handles the "Welcome to Zero" content
  }

  // Rendering logic
  return (
    <div className="max-w-[1600px] mx-auto px-0 md:px-1 pt-4 md:pt-6 pb-12">
      {!solanaWallet ? (
        checkingWallet || loading ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse rounded-full" />
              <img src={logo} alt="Logo" className="w-24 h-24 object-contain rounded-2xl relative z-10 animate-bounce" />
            </div>
            <p className="text-gray-400 font-medium tracking-wide">{loading ? 'Setting up your wallet...' : 'Initializing...'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
            <div className="w-32 h-32 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 flex items-center justify-center mb-8 shadow-2xl">
              <img src={logo} alt="Logo" className="w-20 h-20 object-contain rounded-2xl" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Welcome to Zero</h2>
            <p className="text-gray-400 mb-10 max-w-sm mx-auto leading-relaxed">
              Please sign in to access your wallet and banking features.
            </p>
            <button
              onClick={handleCreateWallet}
              className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Create Wallet
            </button>
          </div>
        )
      ) : (
        /* Connected Wallet View */
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            {/* Wallet Balance Card */}
            <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-3xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-none dark:shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Main Account Balance</span>
                  </div>
                  {loadingTokens && totalUsdBalance === 0 ? (
                    <div className="h-16 w-48 bg-gray-200 dark:bg-white/5 animate-pulse rounded-2xl mb-2" />
                  ) : (
                    <h2 className="text-5xl md:text-7xl font-mono font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-white dark:to-white/60 mb-2 tracking-tighter">
                      ${totalUsdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                    <span className="text-sm font-mono truncate max-w-[200px]">{solanaWallet.address}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigator.clipboard.writeText(solanaWallet.address)}
                        className="p-1.5 bg-gray-200 dark:bg-white/5 rounded-md hover:bg-gray-300 dark:hover:bg-white/10 transition-colors"
                        title="Copy Address"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <span className="text-[10px] font-bold text-blue-500 uppercase">
                          {tokenBalances.find(t => t.metadata?.symbol === 'SOL' || t.mint === 'So11111111111111111111111111111111111111112')?.balance?.toLocaleString() || '0'} SOL
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                  {[
                    {
                      icon: <Send size={20} />, label: 'Send', action: () => {
                        const solToken = tokenBalances.find(t => t.metadata?.symbol === 'SOL')
                        if (solToken) { setSelectedToken(solToken); setSendModalOpen(true) }
                      }
                    },
                    { icon: <ArrowDownToLine size={20} />, label: 'Receive', action: () => setReceiveModalOpen(true) },
                    { icon: <ArrowLeftRight size={20} />, label: 'Swap', disabled: true },
                    { icon: <RefreshCw size={20} />, label: 'Refresh', action: handleRefresh, loading: loadingTokens }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={item.action}
                      disabled={item.disabled || item.loading}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-200 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/5 hover:bg-gray-300 dark:hover:bg-white/10 transition-all duration-300 group disabled:opacity-30 active:scale-95 shadow-none"
                    >
                      <div className={`w-10 h-10 flex items-center justify-center text-gray-900 dark:text-white group-hover:scale-110 transition-transform ${item.loading ? 'animate-spin' : ''}`}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tokens List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold tracking-tight">Your Assets</h3>
                <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-white/5">
                  {tokenBalances.length} Tokens
                </span>
              </div>

              <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden shadow-none dark:shadow-xl">
                {loadingTokens ? (
                  <div className="p-6 text-center text-gray-500">Loading tokens...</div>
                ) : tokenBalances.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <p className="text-sm">No digital assets found in this wallet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {tokenBalances.map((tokenBalance) => (
                      <div
                        key={tokenBalance.mint}
                        className="flex items-center justify-between p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedToken(tokenBalance)
                          setSendModalOpen(true)
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <img src={tokenBalance.metadata?.logoURI || ''} className="w-12 h-12 rounded-2xl bg-white/5 object-cover" />
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{tokenBalance.metadata?.symbol || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{tokenBalance.metadata?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{tokenBalance.balance.toLocaleString()}</p>
                          <p className="text-sm text-gray-400">${(tokenBalance.usdValue || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold tracking-tight">Recent Activity</h3>
              </div>
              <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden shadow-none dark:shadow-xl">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No transactions yet.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {transactions.map(tx => (
                      <a key={tx.signature} href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noopener noreferrer" className="block p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === 'receive' ? 'bg-green-500/10' : 
                              tx.type === 'send' ? 'bg-red-500/10' : 
                              'bg-blue-500/10'
                            }`}>
                              {tx.type === 'receive' ? (
                                <ArrowDownLeft className={`w-4 h-4 text-green-500`} />
                              ) : tx.type === 'send' ? (
                                <ArrowUpRight className={`w-4 h-4 text-red-500`} />
                              ) : (
                                <ArrowLeftRight className={`w-4 h-4 text-blue-500`} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900 dark:text-white">
                                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.tokenSymbol || 'Token'}
                              </p>
                              {tx.amount !== undefined && (
                                <p className="text-xs text-gray-500">
                                  {tx.type === 'receive' ? '+' : '-'}{tx.amount.toLocaleString(undefined, { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 6 
                                  })} {tx.tokenSymbol || ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400">{new Date(tx.timestamp * 1000).toLocaleDateString()}</span>
                            <p className="text-[10px] text-gray-500 mt-0.5">{new Date(tx.timestamp * 1000).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {selectedToken && (
        <SendModal
          isOpen={sendModalOpen}
          onClose={() => {
            setSendModalOpen(false)
            setSelectedToken(null)
          }}
          wallet={solanaWallet!} // Safe assert because modal only opens if wallet exists
          token={{
            mint: selectedToken.mint,
            symbol: selectedToken.metadata?.symbol || 'Unknown',
            balance: selectedToken.balance,
            decimals: selectedToken.decimals,
            logoURI: selectedToken.metadata?.logoURI
          }}
          onSuccess={() => {
            fetchTokenBalances()
            fetchTransactions()
          }}
        />
      )}

      {solanaWallet && (
        <ReceiveModal
          isOpen={receiveModalOpen}
          onClose={() => setReceiveModalOpen(false)}
          walletAddress={solanaWallet.address}
        />
      )}
    </div>
  )
}
