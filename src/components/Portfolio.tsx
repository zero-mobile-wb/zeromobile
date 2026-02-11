import { useState, useEffect } from 'react'
import { Rocket, ShieldCheck, TrendingUp, Info, ExternalLink } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface PortfolioProps {
    address: string
}

export default function Portfolio({ address }: PortfolioProps) {
    const { theme } = useTheme()
    const [positions, setPositions] = useState<any>(null)
    const [stakedJup, setStakedJup] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPortfolioData = async () => {
            if (!address) return
            setLoading(true)
            setError(null)
            try {
                const jupKey = import.meta.env.VITE_JUPITER_API_KEY
                const headers: Record<string, string> = {}
                if (jupKey) headers['x-api-key'] = jupKey

                // Fetch Positions
                const posResponse = await fetch(`/api/jupiter/portfolio/v1/positions/${address}`, { headers })
                if (posResponse.status === 401) {
                    throw new Error('UNAUTHORIZED')
                }
                const posData = await posResponse.json()
                setPositions(posData)

                // Fetch Staked JUP
                const stakeResponse = await fetch(`/api/jupiter/portfolio/v1/staked-jup/${address}`, { headers })
                if (stakeResponse.ok) {
                    const stakeData = await stakeResponse.json()
                    console.log('Staked JUP Data:', stakeData)
                    setStakedJup(stakeData)
                } else {
                    console.warn('Staked JUP API returned:', stakeResponse.status)
                }
            } catch (err: any) {
                console.error('Error fetching portfolio:', err)
                if (err.message === 'UNAUTHORIZED') {
                    setError('API_RESTRICTED')
                } else {
                    setError('Failed to fetch portfolio data from Jupiter.')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchPortfolioData()
    }, [address])

    if (error === 'API_RESTRICTED') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl space-y-6">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <ShieldCheck size={40} className="text-blue-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Jupiter API Restricted</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                        Jupiter's Portfolio API now requires an authorized API key. You can still view and manage your positions directly on the official Jupiter site.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <a
                        href={`https://jup.ag/stats/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02]"
                    >
                        View Portfolio
                    </a>
                    <a
                        href="https://vote.jup.ag"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-4 bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02]"
                    >
                        Manage Staking
                    </a>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-gray-100 dark:bg-white/5 rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-3xl" />
                    <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-3xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 px-0 md:px-1 pt-4 md:pt-6">
            {/* Header / Summary Card */}
            <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-3xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-none">
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600/5 dark:bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp size={24} className="text-blue-500" />
                        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Jupiter Portfolio</h2>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Position Value</p>
                            <h3 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                ${positions?.total_value_usd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}
                            </h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Staked JUP</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {stakedJup?.stakedAmount?.toLocaleString() || '0'} JUP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Staked JUP Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-gray-400" />
                            <h3 className="text-xl font-bold tracking-tight">Governance & Staking</h3>
                        </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-3xl p-8 shadow-none space-y-8">
                        {stakedJup ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-200 dark:bg-white/[0.02] border border-gray-300 dark:border-white/10 rounded-2xl">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Total Staked</span>
                                        <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stakedJup.stakedAmount?.toLocaleString() || '0'}</p>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">JUP Tokens</p>
                                    </div>
                                    <div className="p-4 bg-gray-200 dark:bg-white/[0.02] border border-gray-300 dark:border-white/10 rounded-2xl">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Unstaking</span>
                                        <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stakedJup.unstaking?.reduce((sum: number, u: any) => sum + u.amount, 0)?.toLocaleString() || '0'}</p>
                                        <p className="text-[10px] font-bold text-purple-500 uppercase mt-1">JUP Tokens</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-gray-500 uppercase tracking-widest">Unstaking Periods</span>
                                        <span className="font-mono font-bold text-blue-500">{stakedJup.unstaking?.length || 0} Active</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[70%]" />
                                    </div>
                                </div>

                                <a
                                    href="https://vote.jup.ag"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <span>Open JUP DAO</span>
                                    <ExternalLink size={14} />
                                </a>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <ShieldCheck size={40} className="text-gray-300 dark:text-gray-700 mb-4" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Staking Data</p>
                            </div>
                        )}
                    </div>

                    {/* API Note */}
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3">
                        <Info size={16} className="text-blue-500 shrink-0" />
                        <p className="text-[10px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                            Data provided by Jupiter Portfolio API. Values are estimated based on current market prices and DEX liquidity.
                        </p>
                    </div>
                </div>

                {/* Jupiter Positions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Rocket size={18} className="text-gray-400" />
                            <h3 className="text-xl font-bold tracking-tight">Active Positions</h3>
                        </div>
                    </div>

                    <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden min-h-[400px]">
                        {(!positions?.positions?.length && !positions?.perp_positions?.length && !positions?.limit_orders?.length && !positions?.dca?.length) ? (
                            <div className="flex flex-col items-center justify-center p-20 text-center">
                                <Info size={40} className="text-gray-300 dark:text-gray-700 mb-4" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No active positions found</p>
                                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">Active positions on Jupiter (Spot, Perps, DCA, or Limit Orders) will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-white/5">
                                {/* Regular Positions */}
                                {positions?.positions?.map((pos: any, idx: number) => (
                                    <PositionCard key={`spot-${idx}`} pos={pos} type="Spot" />
                                ))}
                                {/* Perps */}
                                {positions?.perp_positions?.map((pos: any, idx: number) => (
                                    <PositionCard key={`perp-${idx}`} pos={{ ...pos, value_usd: pos.size_usd }} type="Perp" />
                                ))}
                                {/* Limit Orders */}
                                {positions?.limit_orders?.map((pos: any, idx: number) => (
                                    <PositionCard key={`limit-${idx}`} pos={{ ...pos, value_usd: pos.value }} type="Limit" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function PositionCard({ pos, type }: { pos: any, type: string }) {
    return (
        <div className="p-6 hover:bg-gray-200 dark:hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center border border-gray-200 dark:border-white/10">
                        <img src={pos.logoURI || 'https://jup.ag/svg/jupiter-logo.svg'} className="w-8 h-8 rounded-full" alt="" onError={(e) => { e.currentTarget.src = 'https://jup.ag/svg/jupiter-logo.svg' }} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white">{pos.name || 'Jupiter Position'}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{type}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-mono font-bold text-gray-900 dark:text-white">${pos.value_usd?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
