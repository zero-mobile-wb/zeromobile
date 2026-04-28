import { useState, useEffect } from 'react'
import { Server, Activity, ArrowUpRight, Copy, Check, Info } from 'lucide-react'

interface PortfolioProps {
    address: string
}

export default function Portfolio({ address }: PortfolioProps) {
    const [positions, setPositions] = useState<any>(null)
    const [stakedJup, setStakedJup] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchPortfolioData = async () => {
            if (!address) return
            setLoading(true)
            setError(null)
            try {
                const jupKey = import.meta.env.VITE_JUPITER_API_KEY
                const headers: Record<string, string> = {}
                if (jupKey) headers['x-api-key'] = jupKey

                const posResponse = await fetch(`/api/jupiter/portfolio/v1/positions/${address}`, { headers })
                if (posResponse.status === 401) throw new Error('UNAUTHORIZED')
                setPositions(await posResponse.json())

                const stakeResponse = await fetch(`/api/jupiter/portfolio/v1/staked-jup/${address}`, { headers })
                if (stakeResponse.ok) setStakedJup(await stakeResponse.json())
            } catch (err: any) {
                if (err.message === 'UNAUTHORIZED') setError('API_RESTRICTED')
                else setError('Failed to fetch portfolio data from Jupiter.')
            } finally {
                setLoading(false)
            }
        }
        fetchPortfolioData()
    }, [address])

    const copyAddress = async () => {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (error === 'API_RESTRICTED') {
        return (
            <div className="h-full px-5 md:px-8 py-6 md:py-8 overflow-y-auto bg-white flex flex-col items-center justify-center">
                <div className="max-w-md w-full border border-[#09090b] rounded-none p-8 text-center bg-[#fafafa]">
                    <h3 className="text-sm font-black text-[#09090b] uppercase tracking-widest mb-2">Access Restricted</h3>
                    <p className="text-[11px] text-[#6b7280] leading-relaxed mb-6">
                        Jupiter Portfolio API requires authorization. Please view your positions directly on the Jupiter platform.
                    </p>
                    <div className="flex gap-2">
                        <a href={`https://jup.ag/stats/${address}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-[#09090b] text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black/80">
                            Jupiter Stats
                        </a>
                        <a href="https://vote.jup.ag" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-white border border-[#e5e7eb] text-[#09090b] text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#fafafa]">
                            JUP DAO
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="h-full px-5 md:px-8 py-6 md:py-8 overflow-y-auto bg-white animate-pulse">
                <div className="max-w-6xl mx-auto space-y-4">
                    <div className="h-24 bg-[#fafafa] border border-[#e5e7eb] rounded-xl" />
                    <div className="h-64 bg-[#fafafa] border border-[#e5e7eb] rounded-xl" />
                </div>
            </div>
        )
    }

    // Combine all positions for a single high-density table
    const allPositions = [
        ...(positions?.positions || []).map((p: any) => ({ ...p, _type: 'Spot', _val: p.value_usd })),
        ...(positions?.perp_positions || []).map((p: any) => ({ ...p, _type: 'Perp', _val: p.size_usd })),
        ...(positions?.limit_orders || []).map((p: any) => ({ ...p, _type: 'Limit', _val: p.value })),
        ...(positions?.dca || []).map((p: any) => ({ ...p, _type: 'DCA', _val: p.value_usd }))
    ].sort((a, b) => b._val - a._val)

    return (
        <div className="h-full px-5 md:px-8 py-6 md:py-8 overflow-y-auto bg-white">
            <div className="max-w-6xl mx-auto space-y-4">

                {/* Top Terminal Strip */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-[#09090b] text-white rounded-xl">
                    <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
                        <div>
                            <p className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] mb-1">Net Portfolio Value</p>
                            <p className="text-3xl font-black font-mono tracking-tighter leading-none">
                                ${positions?.total_value_usd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </p>
                        </div>
                        <div className="h-10 w-px bg-white/20 hidden md:block" />
                        <div>
                            <p className="text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] mb-1">Staked JUP</p>
                            <p className="text-xl font-black font-mono tracking-tighter leading-none text-[#f3f4f6]">
                                {stakedJup?.stakedAmount?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10 overflow-hidden w-full md:w-auto">
                            <Server size={12} className="text-[#9ca3af]" />
                            <span className="text-[10px] font-mono text-[#d1d5db] truncate max-w-[120px]">{address}</span>
                            <button onClick={copyAddress} className="text-[#9ca3af] hover:text-white transition-colors ml-1">
                                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Col: Positions Table */}
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black text-[#09090b] uppercase tracking-[0.15em]">Active Positions</h2>
                            <span className="text-[9px] font-black bg-[#f3f4f6] text-[#6b7280] px-2 py-0.5 rounded uppercase">{allPositions.length} Items</span>
                        </div>

                        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] gap-3 sm:gap-4 px-4 py-2 bg-[#fafafa] border-b border-[#e5e7eb]">
                                <div className="w-6"></div>
                                <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest">Asset</span>
                                <span className="hidden sm:block text-[9px] font-black text-[#9ca3af] uppercase tracking-widest text-right">Type</span>
                                <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest text-right min-w-[80px]">Value (USD)</span>
                            </div>

                            {/* Table Body */}
                            {allPositions.length === 0 ? (
                                <div className="p-8 text-center text-[11px] font-black text-[#9ca3af] uppercase tracking-widest">
                                    No Active Positions
                                </div>
                            ) : (
                                <div className="divide-y divide-[#e5e7eb]">
                                    {allPositions.map((pos, idx) => (
                                        <div key={idx} className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] gap-3 sm:gap-4 items-center px-4 py-3 hover:bg-[#fafafa] transition-colors">
                                            <div className="w-6 h-6 bg-[#f3f4f6] rounded flex items-center justify-center border border-[#e5e7eb] overflow-hidden">
                                                <img src={pos.logoURI || 'https://jup.ag/svg/jupiter-logo.svg'} className="w-4 h-4" alt="" onError={(e) => { e.currentTarget.src = 'https://jup.ag/svg/jupiter-logo.svg' }} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#09090b] leading-tight flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-none">
                                                    {pos.name || 'Unknown'}
                                                    {pos._type === 'Perp' && pos.side && (
                                                        <span className={`text-[8px] font-black px-1 py-0.5 rounded uppercase flex-shrink-0 ${pos.side.toLowerCase() === 'long' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                            {pos.side}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="hidden sm:flex text-right items-center justify-end">
                                                <span className="text-[9px] font-black text-[#6b7280] uppercase tracking-widest border border-[#e5e7eb] px-1.5 py-0.5 rounded">
                                                    {pos._type}
                                                </span>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-xs font-black font-mono text-[#09090b]">
                                                    ${(pos._val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Staking & Info */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black text-[#09090b] uppercase tracking-[0.15em]">Governance</h2>
                        </div>

                        <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-xl p-4">
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">Unstaking</span>
                                    <span className="text-[10px] font-black font-mono text-[#09090b]">
                                        {stakedJup?.unstaking?.reduce((sum: number, u: any) => sum + u.amount, 0)?.toLocaleString() || '0'} JUP
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">Active Periods</span>
                                    <span className="text-[10px] font-black font-mono text-[#09090b]">
                                        {stakedJup?.unstaking?.length || 0}
                                    </span>
                                </div>
                            </div>

                            <a
                                href="https://vote.jup.ag"
                                target="_blank" rel="noopener noreferrer"
                                className="w-full py-2.5 bg-white border border-[#e5e7eb] text-[#09090b] rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#f3f4f6] flex items-center justify-center gap-1.5"
                            >
                                JUP DAO <ArrowUpRight size={12} />
                            </a>
                        </div>

                        {/* API Info */}
                        <div className="flex items-start gap-2 p-3 bg-white border border-[#e5e7eb] rounded-xl">
                            <Activity size={12} className="text-[#9ca3af] mt-0.5 shrink-0" />
                            <p className="text-[10px] font-medium text-[#6b7280] leading-snug">
                                Data synced via Jupiter API. Estimates reflect current DEX liquidity and spot prices.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
