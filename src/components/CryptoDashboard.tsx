import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  Send, ArrowLeftRight, ArrowUpRight,
  ArrowDownLeft, RefreshCw, TrendingUp, Activity, CheckCircle2, QrCode, Search, X, ArrowLeft
} from 'lucide-react'
import { getTopTransactions, Transaction } from '../utils/getTransaction'
import SendPage from './SendPage'
import ReceivePage from './ReceivePage'

// ─── RPC ──────────────────────────────────────────────────────────────────
const RPC_URLS = [
  'https://mainnet.helius-rpc.com/?api-key=8b1f5488-b7ad-46c7-ae91-f42dd14a8f46',
  'https://api.mainnet-beta.solana.com',
]
let activeRpcIndex = 0
let connection = new Connection(RPC_URLS[activeRpcIndex], 'confirmed')
const rotateRpc = () => {
  activeRpcIndex = (activeRpcIndex + 1) % RPC_URLS.length
  connection = new Connection(RPC_URLS[activeRpcIndex], 'confirmed')
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface Token { address: string; name: string; symbol: string; decimals: number; logoURI?: string }
interface TokenBalance {
  mint: string; balance: number; decimals: number; amount: string
  metadata?: Token; usdValue?: number; pricePerToken?: number
}

// ─── Component: Swap Form ─────────────────────────────────────────────────
function SwapForm({ balances, allTokens, walletAddress }: { balances: TokenBalance[], allTokens: Token[], walletAddress: string }) {
  const [fromMint, setFromMint] = useState('So11111111111111111111111111111111111111112')
  const [toMint, setToMint] = useState('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  const [amount, setAmount] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteResponse, setQuoteResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSelector, setShowSelector] = useState<'from' | 'to' | null>(null)
  const [search, setSearch] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [rateInfo, setRateInfo] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const SOL_MINT = 'So11111111111111111111111111111111111111112'
  const PINNED = [SOL_MINT, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN']

  const balanceMap = useMemo(() => {
    const m: Record<string, TokenBalance> = {}
    balances.forEach(b => { m[b.mint] = b })
    return m
  }, [balances])

  // ── Filtered + sorted token list for selector ──
  const filteredTokens = useMemo(() => {
    const q = search.toLowerCase().trim()
    const excludeMint = showSelector === 'from' ? toMint : fromMint
    const base = allTokens.filter(t => t.address !== excludeMint)
    const matches = q
      ? base.filter(t =>
        (t.symbol?.toLowerCase() || '').includes(q) ||
        (t.name?.toLowerCase() || '').includes(q) ||
        t.address.toLowerCase().startsWith(q)
      )
      : base
    return matches.sort((a, b) => {
      const aPin = PINNED.indexOf(a.address), bPin = PINNED.indexOf(b.address)
      if (aPin !== -1 && bPin !== -1) return aPin - bPin
      if (aPin !== -1) return -1
      if (bPin !== -1) return 1
      return (balanceMap[b.address] ? 1 : 0) - (balanceMap[a.address] ? 1 : 0)
    }).slice(0, 120)
  }, [allTokens, search, showSelector, fromMint, toMint, balanceMap])

  // ── Real-time Jupiter quote ──
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || !fromMint || !toMint || parseFloat(amount) <= 0) {
        setQuoteAmount(''); setQuoteResponse(null); setRateInfo(null); return
      }
      const fromToken = allTokens.find(t => t.address === fromMint)
      if (!fromToken) return
      const inputAmount = Math.floor(parseFloat(amount) * Math.pow(10, fromToken.decimals)).toString()
      setQuoteLoading(true)
      setError(null)
      try {
        const res = await fetch(`${BACKEND_URL}/api/zero/jupiter/quote?inputMint=${fromMint}&outputMint=${toMint}&amount=${inputAmount}&slippageBps=50`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Quote failed')
        setQuoteResponse(data)
        const toToken = allTokens.find(t => t.address === toMint)
        const out = parseInt(data.outAmount) / Math.pow(10, toToken?.decimals || 6)
        setQuoteAmount(out.toFixed(6))
        const rate = out / parseFloat(amount)
        setRateInfo(`1 ${fromToken.symbol} ≈ ${rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toToken?.symbol || ''}`)
      } catch (err: any) {
        setError(err.message); setQuoteAmount(''); setQuoteResponse(null); setRateInfo(null)
      } finally {
        setQuoteLoading(false)
      }
    }
    const t = setTimeout(fetchQuote, 550)
    return () => clearTimeout(t)
  }, [amount, fromMint, toMint, allTokens])

  // ── Switch tokens ──
  const handleSwitch = () => {
    if (switching) return
    setSwitching(true)
    const pFrom = fromMint, pTo = toMint, pQuote = quoteAmount
    setFromMint(pTo); setToMint(pFrom)
    setAmount(pQuote || amount)
    setQuoteAmount(''); setQuoteResponse(null); setRateInfo(null)
    setTimeout(() => setSwitching(false), 350)
  }

  // ── Execute swap ──
  const executeSwap = async () => {
    if (!quoteResponse || !walletAddress || walletAddress === 'No Wallet Found') return
    setLoading(true); setError(null); setSuccess(null)
    try {
      const swapRes = await fetch(`${BACKEND_URL}/api/zero/jupiter/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteResponse, userPublicKey: walletAddress, wrapAndUnwrapSol: true })
      })
      const swapData = await swapRes.json()
      if (!swapRes.ok) throw new Error(swapData.error || 'Swap build failed')
      const binaryString = atob(swapData.swapTransaction)
      const transactionArr = new Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) transactionArr[i] = binaryString.charCodeAt(i)
      const sendRes = await fetch(`${BACKEND_URL}/api/zero/wallet/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAddress: walletAddress, transaction: transactionArr })
      })
      const sendData = await sendRes.json()
      if (!sendRes.ok) throw new Error(sendData.error || 'Swap execution failed')
      setAmount(''); setQuoteAmount(''); setQuoteResponse(null); setRateInfo(null)
      setSuccess(sendData.signature)
      setTimeout(() => setSuccess(null), 9000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fromToken = allTokens.find(t => t.address === fromMint)
  const toToken = allTokens.find(t => t.address === toMint)
  const fromBalance = balanceMap[fromMint]?.balance

  const TokenLogo = ({ token }: { token?: Token }) => (
    <div className="w-7 h-7 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] overflow-hidden flex-shrink-0 flex items-center justify-center">
      {token?.logoURI
        ? <img src={token.logoURI} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : <span className="text-[9px] font-black text-[#6b7280]">{token?.symbol?.slice(0, 2) || '?'}</span>
      }
    </div>
  )

  return (
    <>
      {/* ── Token Selector Overlay ── */}
      {showSelector && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={e => { if (e.target === e.currentTarget) { setShowSelector(null); setSearch('') } }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowSelector(null); setSearch('') }} />
          <div className="relative w-full sm:max-w-[420px] bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '82vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#f3f4f6]">
              <p className="text-[11px] font-black text-[#6b7280] uppercase tracking-[0.2em]">Select Token</p>
              <button onClick={() => { setShowSelector(null); setSearch('') }} className="w-8 h-8 rounded-xl bg-[#f3f4f6] flex items-center justify-center hover:bg-[#e5e7eb] transition-colors">
                <X size={14} className="text-[#6b7280]" />
              </button>
            </div>
            {/* Search */}
            <div className="px-6 py-3 border-b border-[#f3f4f6]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tokens…"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm font-medium text-[#09090b] placeholder-[#9ca3af] focus:outline-none focus:border-[#09090b] transition-all"
                />
              </div>
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-[#f9fafb]">
              {filteredTokens.length === 0
                ? <div className="p-10 text-center text-[#9ca3af] text-sm">No tokens found</div>
                : filteredTokens.map(token => {
                  const held = balanceMap[token.address]
                  const isPinned = PINNED.includes(token.address)
                  return (
                    <button
                      key={token.address}
                      onClick={() => {
                        if (showSelector === 'from') { setFromMint(token.address); setAmount(''); setQuoteAmount('') }
                        else { setToMint(token.address); setQuoteAmount('') }
                        setShowSelector(null); setSearch('')
                      }}
                      className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-[#fafafa] transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {token.logoURI
                          ? <img src={token.logoURI} alt={token.symbol} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          : <span className="text-[10px] font-black text-[#6b7280]">{token.symbol.slice(0, 2)}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#09090b]">{token.symbol}</span>
                          {isPinned && <span className="px-1.5 py-0.5 bg-[#09090b] text-white text-[8px] font-black uppercase tracking-widest rounded leading-none">Popular</span>}
                        </div>
                        <p className="text-[11px] text-[#9ca3af] font-medium truncate mt-0.5">{token.name}</p>
                      </div>
                      {held && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black font-mono text-[#09090b]">{held.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                          {held.usdValue !== undefined && <p className="text-[10px] font-bold text-[#9ca3af]">${held.usdValue.toFixed(2)}</p>}
                        </div>
                      )}
                    </button>
                  )
                })
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Swap Card ── */}
      <div className="rounded-2xl bg-white border border-[#e5e7eb] p-6 md:p-7 shadow-sm relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-black/[0.015] blur-[50px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] font-black text-[#6b7280] uppercase tracking-[0.2em]">Instant Swap</p>
          <div className="flex items-center gap-1.5">
            {quoteLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-ping" />
                <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest">Fetching</span>
              </div>
            )}
            {quoteResponse && !quoteLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* YOU PAY */}
        <div className="space-y-1.5 mb-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">You Pay</label>
            {fromBalance !== undefined && (
              <button onClick={() => setAmount(fromBalance.toFixed(6))} className="text-[9px] font-bold text-[#6b7280] hover:text-[#09090b] transition-colors uppercase tracking-tight">
                Bal: {fromBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} · Max
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-2xl focus-within:border-[#09090b]/25 transition-all">
            <button
              onClick={() => setShowSelector('from')}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-2xl shadow-sm hover:border-[#09090b]/30 hover:shadow-md transition-all active:scale-95 flex-shrink-0"
            >
              <TokenLogo token={fromToken} />
              <span className="text-[12px] font-black text-[#09090b]">{fromToken?.symbol || 'Select'}</span>
              <svg className="w-3 h-3 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-black font-mono text-[#09090b] placeholder-[#d1d5db] focus:outline-none text-right min-w-0"
            />
          </div>
        </div>

        {/* SWITCH */}
        <div className="flex items-center gap-3 py-1.5">
          <div className="flex-1 h-px bg-[#e5e7eb]" />
          <button
            onClick={handleSwitch}
            className="w-9 h-9 rounded-xl bg-white border border-[#e5e7eb] shadow-sm flex items-center justify-center hover:border-[#09090b]/30 hover:shadow-md active:scale-90 transition-all"
            style={{ transform: switching ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <ArrowLeftRight size={14} className="text-[#09090b]" />
          </button>
          <div className="flex-1 h-px bg-[#e5e7eb]" />
        </div>

        {/* YOU RECEIVE */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">You Receive</label>
            <span className="text-[9px] font-bold text-[#9ca3af]">Est. equivalent</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-2xl transition-all">
            <button
              onClick={() => setShowSelector('to')}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-2xl shadow-sm hover:border-[#09090b]/30 hover:shadow-md transition-all active:scale-95 flex-shrink-0"
            >
              <TokenLogo token={toToken} />
              <span className="text-[12px] font-black text-[#09090b]">{toToken?.symbol || 'Select'}</span>
              <svg className="w-3 h-3 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {quoteLoading
              ? <div className="flex-1 flex items-center justify-end"><div className="w-28 h-7 bg-[#e5e7eb] rounded-xl animate-pulse" /></div>
              : <input type="text" placeholder="0.00" value={quoteAmount} readOnly className="flex-1 bg-transparent text-2xl font-black font-mono text-[#09090b] placeholder-[#d1d5db] focus:outline-none text-right min-w-0 opacity-55 cursor-default" />
            }
          </div>
          {rateInfo && !quoteLoading && (
            <div className="px-1 flex items-center gap-1.5">
              <TrendingUp size={10} className="text-[#9ca3af]" />
              <span className="text-[10px] font-bold text-[#9ca3af]">{rateInfo}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl mb-3">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-100 rounded-xl mb-3 flex items-center gap-2">
            <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
            <a href={`https://explorer.solana.com/tx/${success}`} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-green-600 uppercase tracking-widest hover:underline truncate">
              Swap successful · View Explorer
            </a>
          </div>
        )}

        <button
          onClick={executeSwap}
          disabled={loading || !quoteResponse || quoteLoading}
          className="w-full py-4 rounded-2xl bg-[#09090b] text-white text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-30 transition-all hover:bg-black/80 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Executing…</>
          ) : quoteResponse ? 'Execute Swap' : quoteLoading ? 'Fetching Rate…' : 'Enter Amount'}
        </button>
      </div>
    </>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function CryptoDashboard() {
  const { user } = useAuth()

  const [totalUsdBalance, setTotalUsdBalance] = useState(0)
  const [tokenMetadata, setTokenMetadata] = useState<Token[]>([])
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [subView, setSubView] = useState<'send' | 'receive' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const walletAddress = user?.walletAddress || 'No Wallet Found'
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'

  // ── Fetch token metadata from Jupiter ──────────────────────────────────
  useEffect(() => {
    fetch('https://tokens.jup.ag/tokens?tags=verified')
      .then(r => r.json())
      .then(data => {
        // Ensure SOL is always correctly identified even if the list is huge or fetch acts up
        const sol = data.find((t: any) => t.address === 'So11111111111111111111111111111111111111112')
        if (!sol) {
          data.unshift({
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
          })
        }
        setTokenMetadata(data)
      })
      .catch(() => setTokenMetadata([{
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
      }]))
  }, [])

  // ── Fetch balances ─────────────────────────────────────────────────────
  const fetchTokenBalances = async (retryCount = 0): Promise<void> => {
    if (!walletAddress || walletAddress === 'No Wallet Found') return
    setLoadingTokens(true)
    setError(null)
    try {
      const publicKey = new PublicKey(walletAddress)
      const lamports = await connection.getBalance(publicKey)
      const solBalance = lamports / LAMPORTS_PER_SOL

      const response = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      )
      const tokenAccounts = response.value
        .map(a => ({
          mint: a.account.data.parsed.info.mint,
          balance: a.account.data.parsed.info.tokenAmount.uiAmount,
          decimals: a.account.data.parsed.info.tokenAmount.decimals,
          amount: a.account.data.parsed.info.tokenAmount.amount,
        }))
        .filter(t => t.balance > 0)

      const SOL_MINT = 'So11111111111111111111111111111111111111112'
      const allMints = [SOL_MINT, ...tokenAccounts.map(t => t.mint)]

      let priceData: any = { data: {} }
      try {
        const jupKey = import.meta.env.VITE_JUPITER_API_KEY
        const headers: Record<string, string> = {}
        if (jupKey) headers['x-api-key'] = jupKey
        const pr = await fetch(`https://price.jup.ag/v6/price?ids=${allMints.join(',')}`, { headers })
        if (pr.ok) priceData = await pr.json()
      } catch { }

      if (!priceData.data?.[SOL_MINT]?.price) {
        try {
          const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
          if (cg.ok) {
            const d = await cg.json()
            if (!priceData.data) priceData.data = {}
            priceData.data[SOL_MINT] = { price: d.solana?.usd || 0 }
          }
        } catch { }
      }

      const getPrice = (mint: string) =>
        priceData.data?.[mint]?.price ? Number(priceData.data[mint].price) : 0

      const allBalances: TokenBalance[] = []
      const solPrice = getPrice(SOL_MINT)

      allBalances.push({
        mint: SOL_MINT, balance: solBalance, decimals: 9,
        amount: (solBalance * LAMPORTS_PER_SOL).toString(),
        pricePerToken: solPrice, usdValue: solBalance * solPrice,
        metadata: tokenMetadata.find(t => t.address === SOL_MINT) || {
          address: SOL_MINT, name: 'Solana', symbol: 'SOL', decimals: 9,
          logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
        }
      })

      for (const token of tokenAccounts) {
        const price = getPrice(token.mint)
        allBalances.push({
          ...token, pricePerToken: price, usdValue: token.balance * price,
          metadata: tokenMetadata.find(t => t.address === token.mint) || {
            address: token.mint, name: 'Unknown Token',
            symbol: token.mint.slice(0, 6), decimals: token.decimals
          }
        })
      }

      setTotalUsdBalance(allBalances.reduce((s, t) => s + (t.usdValue || 0), 0))
      setTokenBalances(allBalances)
    } catch (err: any) {
      if (retryCount < RPC_URLS.length - 1) { rotateRpc(); return fetchTokenBalances(retryCount + 1) }
      setError(`RPC Error: ${err.message}`)
    } finally {
      setLoadingTokens(false)
    }
  }

  // ── Fetch transactions ─────────────────────────────────────────────────
  const fetchTransactions = async (retryCount = 0): Promise<void> => {
    if (!walletAddress || walletAddress === 'No Wallet Found') return
    setLoadingTransactions(true)
    try {
      setTransactions(await getTopTransactions(walletAddress))
    } catch (err: any) {
      if (retryCount < RPC_URLS.length - 1) { rotateRpc(); return fetchTransactions(retryCount + 1) }
    } finally {
      setLoadingTransactions(false)
    }
  }

  useEffect(() => {
    if (walletAddress && walletAddress !== 'No Wallet Found') { fetchTokenBalances(); fetchTransactions() }
  }, [walletAddress, tokenMetadata])

  const handleRefresh = async () => { await fetchTokenBalances(); await fetchTransactions() }

  // ── Sub-view: Send / Receive pages ────────────────────────────────────────
  if (subView === 'send') {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="px-5 md:px-8 pt-6 flex items-center gap-3">
          <button onClick={() => setSubView(null)} className="flex items-center gap-1.5 text-[10px] font-black text-[#6b7280] uppercase tracking-widest hover:text-[#09090b] transition-colors">
            <ArrowLeft size={12} /> Back
          </button>
        </div>
        <SendPage
          balances={tokenBalances}
          allTokens={tokenMetadata}
          walletAddress={walletAddress}
          walletObject={{ address: walletAddress }}
          onSuccess={() => { fetchTokenBalances(); fetchTransactions() }}
        />
      </div>
    )
  }

  if (subView === 'receive') {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="px-5 md:px-8 pt-6 flex items-center gap-3">
          <button onClick={() => setSubView(null)} className="flex items-center gap-1.5 text-[10px] font-black text-[#6b7280] uppercase tracking-widest hover:text-[#09090b] transition-colors">
            <ArrowLeft size={12} /> Back
          </button>
        </div>
        <ReceivePage walletAddress={walletAddress} />
      </div>
    )
  }

  return (
    <div className="h-full px-5 md:px-8 py-6 md:py-8 overflow-y-auto bg-white">
      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto min-h-full">

        {/* ════════════════ LEFT COLUMN: Balance, Actions, Assets ════════════════ */}
        <div className="flex-1 lg:basis-[60%] flex flex-col gap-6">

          {/* Consolidated Enterprise Header/Balance Card */}
          <div className="rounded-2xl bg-[#09090b] text-white p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 gap-y-6">
              <div>
                <div className="text-[10px] font-bold text-[rgba(255,255,255,0.5)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span>TOTAL BALANCE</span>
                </div>
                {loadingTokens && totalUsdBalance === 0 ? (
                  <div className="h-12 w-64 bg-[rgba(255,255,255,0.1)] animate-pulse rounded-2xl" />
                ) : (
                  <h2 className="text-5xl md:text-6xl font-medium font-mono tracking-tight leading-none">
                    ${totalUsdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                )}
                {error && <p className="mt-4 text-xs font-bold text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
              </div>

              {/* Minimal Welcome Details nested elegantly inside the balance box */}
              <div className="md:text-right border-t border-white/10 md:border-t-0 pt-4 md:pt-0">
                <p className="text-[10px] font-black text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-1">Session Owner</p>
                <p className="text-sm font-semibold text-white truncate max-w-[150px] md:max-w-none">{firstName}</p>
              </div>
            </div>
          </div>

          {/* Interaction Buttons Row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: <Send size={20} />, label: 'Send', action: () => setSubView('send') },
              { icon: <QrCode size={20} />, label: 'Receive', action: () => setSubView('receive') },
              { icon: <ArrowLeftRight size={20} />, label: 'Swap', disabled: true },
              { icon: <RefreshCw size={20} />, label: 'Sync', action: handleRefresh, loading: loadingTokens || loadingTransactions },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                disabled={item.disabled || item.loading}
                className="flex flex-col items-center justify-center p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-2xl hover:bg-white hover:border-[#09090b]/20 hover:shadow-md transition-all duration-300 group disabled:opacity-40 active:scale-95 text-center"
              >
                <div className={`text-[#09090b] mb-2 ${item.loading ? 'animate-spin' : 'group-hover:-translate-y-1 transition-transform'}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.15em] shrink-0">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Assets Box (Moved to Main Column) */}
          <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
            <div className="px-7 py-5 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa]">
              <p className="text-[11px] font-black text-[#6b7280] uppercase tracking-[0.2em]">Portfolio Assets</p>
              <span className="text-[10px] font-bold text-[#09090b] bg-white border border-[#e5e7eb] px-2.5 py-1 rounded-lg shadow-sm">{tokenBalances.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingTokens ? (
                <div className="p-8 text-center text-[#9ca3af] text-sm font-medium">Synchronizing Ledger…</div>
              ) : tokenBalances.length === 0 ? (
                <div className="p-8 text-center text-[#9ca3af] text-sm font-medium">No assets held in this wallet.</div>
              ) : (
                <div className="divide-y divide-[#e5e7eb]">
                  {tokenBalances.map(tb => (
                    <div
                      key={tb.mint}
                      onClick={() => setSubView('send')}
                      className="flex items-center justify-between px-7 py-4 hover:bg-[#fafafa] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        {tb.metadata?.logoURI
                          ? <img src={tb.metadata.logoURI} className="w-10 h-10 rounded-full bg-white shadow-sm object-cover border border-[#e5e7eb]" />
                          : <div className="w-10 h-10 rounded-full bg-[#f3f4f6] flex items-center justify-center text-xs font-black text-[#6b7280] border border-[#e5e7eb]">{tb.metadata?.symbol?.slice(0, 2) || '?'}</div>
                        }
                        <div>
                          <p className="text-sm font-bold text-[#09090b]">{tb.metadata?.symbol || 'Unknown'}</p>
                          <p className="text-[11px] font-medium text-[#9ca3af] mt-0.5">{tb.metadata?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black font-mono text-[#09090b]">{tb.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                        <p className="text-[11px] font-bold text-[#6b7280] mt-0.5">${(tb.usdValue || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════ RIGHT COLUMN: Swap & Transactions ════════════════ */}
        <div className="lg:basis-[40%] flex flex-col gap-6">

          {/* Swap Form Component */}
          <SwapForm balances={tokenBalances} allTokens={tokenMetadata} walletAddress={walletAddress} />

          {/* Transaction History */}
          <div className="rounded-2xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
            <div className="px-7 py-5 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fafafa]">
              <p className="text-[11px] font-black text-[#6b7280] uppercase tracking-[0.2em]">Live Activity</p>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
              {loadingTransactions ? (
                <div className="p-10 flex justify-center"><svg className="animate-spin w-5 h-5 text-[#09090b]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></div>
              ) : transactions.length === 0 ? (
                <div className="p-10 text-center text-[#9ca3af] text-sm font-medium">No transaction records</div>
              ) : (
                <div className="divide-y divide-[#e5e7eb]">
                  {transactions.map(tx => (
                    <a
                      key={tx.signature}
                      href={`https://explorer.solana.com/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-7 py-4 hover:bg-[#fafafa] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shadow-sm ${tx.type === 'receive' ? 'bg-[#f0fdf4] border-[#bbf7d0]' :
                          tx.type === 'send' ? 'bg-[#fef2f2] border-[#fecaca]' :
                            'bg-[#f8fafc] border-[#e2e8f0]'
                          }`}>
                          {tx.type === 'receive' ? <ArrowDownLeft className="w-3.5 h-3.5 text-[#16a34a]" />
                            : tx.type === 'send' ? <ArrowUpRight className="w-3.5 h-3.5 text-[#dc2626]" />
                              : <ArrowLeftRight className="w-3.5 h-3.5 text-[#475569]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#09090b]">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.tokenSymbol || ''}</p>
                          {tx.amount !== undefined && (
                            <p className="text-[11px] font-mono font-medium text-[#6b7280] mt-0.5">
                              {tx.type === 'receive' ? '+' : '-'}{tx.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.tokenSymbol || ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[#09090b] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest hidden sm:block">Explore ↗</p>
                        <p className="text-[9px] font-black text-[#9ca3af] mt-1 sm:mt-1.5 uppercase tracking-wider">{new Date(tx.timestamp * 1000).toLocaleDateString()}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
