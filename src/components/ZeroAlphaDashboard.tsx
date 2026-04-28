import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
    Mail, Lock, Trophy, TrendingUp, Calendar, RefreshCw,
    Star, Zap, Copy, Check, ChevronUp, ChevronDown, Minus
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_API_URL
const STORAGE_KEY = 'zeroalpha_auth_email'

interface UserData {
    _id: string; email: string; walletAddress: string
    points: number; fairScore: number; reputationTier: string
    multiplier: number; lastDailyCheckIn: string | null; tradingVolume: number
}
interface LeaderboardUser {
    _id: string; email: string; walletAddress: string
    points: number; fairScore: number; reputationTier: string
    multiplier: number; tradingVolume: number; rank: number
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    RP1: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
    RP2: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    RP3: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    RP4: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    RP5: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
}
const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function ZeroAlphaDashboard() {
    const { user, token } = useAuth()
    const [step, setStep] = useState<'email' | 'otp' | 'dashboard'>(user?.email ? 'dashboard' : 'email')
    const [email, setEmail] = useState(user?.email || '')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [userData, setUserData] = useState<UserData | null>(null)
    const [checkInLoading, setCheckInLoading] = useState(false)
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
    const [selectedTier, setSelectedTier] = useState('all')
    const [leaderboardLoading, setLeaderboardLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (user?.email) { setEmail(user.email); setStep('dashboard'); fetchByEmail(user.email); return }
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) { setEmail(saved); setStep('dashboard'); fetchByEmail(saved) }
    }, [user])

    useEffect(() => { if (step === 'dashboard') fetchLeaderboard(selectedTier) }, [step, selectedTier])
    useEffect(() => {
        if (step === 'dashboard' && email) {
            const id = setInterval(() => fetchByEmail(email), 30000)
            return () => clearInterval(id)
        }
    }, [step, email])

    const fetchByEmail = async (e: string) => {
        try {
            const r = await fetch(`${BACKEND_URL}/api/zero/user/${encodeURIComponent(e)}`)
            if (r.ok) setUserData(await r.json())
        } catch { }
    }

    const fetchLeaderboard = async (tier: string) => {
        setLeaderboardLoading(true)
        try {
            const url = tier === 'all' ? `${BACKEND_URL}/api/zero/leaderboard` : `${BACKEND_URL}/api/zero/leaderboard?tier=${tier}`
            const r = await fetch(url)
            if (r.ok) setLeaderboard(await r.json())
        } catch { }
        finally { setLeaderboardLoading(false) }
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault(); setError(''); setLoading(true)
        try {
            const r = await fetch(`${BACKEND_URL}/api/zero/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error || 'Failed to send OTP')
            setStep('otp')
        } catch (err: any) { setError(err.message) } finally { setLoading(false) }
    }

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault(); setError(''); setLoading(true)
        const otpCode = otp.join('')
        if (otpCode.length !== 6) { setError('Enter all 6 digits'); setLoading(false); return }
        try {
            const r = await fetch(`${BACKEND_URL}/api/zero/auth/verify`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode, walletAddress: user?.walletAddress })
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error || 'Failed to verify OTP')
            localStorage.setItem(STORAGE_KEY, email)
            setUserData(d.user); setStep('dashboard'); fetchByEmail(email)
        } catch (err: any) { setError(err.message) } finally { setLoading(false) }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return
        const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp)
        if (value && index < 5) otpRefs.current[index + 1]?.focus()
        if (index === 5 && value) {
            const full = [...newOtp]; full[5] = value.slice(-1)
            if (full.every(d => d !== '')) { setOtp(full); setTimeout(() => handleVerifyOtp(), 100) }
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
    }

    const handleCheckIn = async () => {
        setCheckInLoading(true); setError('')
        try {
            const r = await fetch(`${BACKEND_URL}/api/zero/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ email })
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error || 'Check-in failed')
            await fetchByEmail(email)
        } catch (err: any) { setError(err.message) } finally { setCheckInLoading(false) }
    }

    const canCheckIn = !userData?.lastDailyCheckIn ||
        new Date().toDateString() !== new Date(userData.lastDailyCheckIn).toDateString()

    const tier = userData?.reputationTier || 'RP1'
    const tierColors = TIER_COLORS[tier] || TIER_COLORS.RP1

    // ── Email step ──────────────────────────────────────────────────────────
    if (step === 'email') {
        return (
            <div className="h-full flex items-center justify-center px-4 bg-white">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <Trophy size={16} className="text-[#09090b]" />
                            <span className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.2em]">ZeroAlpha Points</span>
                        </div>
                        <h1 className="text-2xl font-black text-[#09090b] tracking-tight mb-1">Sign In</h1>
                        <p className="text-sm text-[#6b7280]">Enter your email to access your points dashboard</p>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
                                <input
                                    type="email" required value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-3.5 bg-[#fafafa] border border-[#e5e7eb] rounded-xl text-sm text-[#09090b] placeholder-[#d1d5db] focus:outline-none focus:border-[#09090b]/25 transition-all"
                                />
                            </div>
                        </div>
                        {error && <p className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#09090b] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-40 transition-all hover:bg-black/80 flex items-center justify-center gap-2">
                            {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Sending…</> : 'Send Code'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // ── OTP step ────────────────────────────────────────────────────────────
    if (step === 'otp') {
        return (
            <div className="h-full flex items-center justify-center px-4 bg-white">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <div className="w-10 h-10 bg-[#f3f4f6] border border-[#e5e7eb] rounded-xl flex items-center justify-center mb-4">
                            <Lock size={18} className="text-[#09090b]" />
                        </div>
                        <h1 className="text-2xl font-black text-[#09090b] tracking-tight mb-1">Verify Identity</h1>
                        <p className="text-sm text-[#6b7280]">Enter the 6-digit code sent to <strong className="text-[#09090b]">{email}</strong></p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="flex gap-2 justify-between">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el }}
                                    type="text" inputMode="numeric" maxLength={1} value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    autoFocus={i === 0}
                                    className="flex-1 h-14 bg-[#fafafa] border border-[#e5e7eb] rounded-xl text-[#09090b] text-center text-xl font-black focus:border-[#09090b] focus:outline-none transition-all"
                                />
                            ))}
                        </div>
                        {error && <p className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
                        <button type="submit" disabled={loading || otp.some(d => !d)} className="w-full py-3.5 bg-[#09090b] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-40 transition-all hover:bg-black/80 flex items-center justify-center gap-2">
                            {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Verifying…</> : 'Verify & Continue'}
                        </button>
                        <button type="button" onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']) }} className="w-full text-center text-[11px] text-[#9ca3af] hover:text-[#09090b] transition-colors font-medium">
                            ← Back to email
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // ── Dashboard ────────────────────────────────────────────────────────────
    const userRank = leaderboard.find(u => u.email === email)?.rank

    return (
        <div className="h-full px-5 md:px-8 py-6 md:py-8 overflow-y-auto bg-white">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top bar */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-[#09090b] tracking-tight">ZeroAlpha</h1>
                        <p className="text-sm text-[#6b7280] mt-0.5">{email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => fetchByEmail(email)} className="w-9 h-9 flex items-center justify-center bg-[#fafafa] border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6] transition-all">
                            <RefreshCw size={14} className="text-[#6b7280]" />
                        </button>
                        <button
                            onClick={handleCheckIn}
                            disabled={checkInLoading || !canCheckIn}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${canCheckIn
                                ? 'bg-[#09090b] text-white hover:bg-black/80 active:scale-95'
                                : 'bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed'
                                }`}
                        >
                            {checkInLoading
                                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                : <Calendar size={13} />}
                            {canCheckIn ? 'Daily Check-in' : 'Checked In'}
                        </button>
                    </div>
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl"><p className="text-[11px] font-bold text-red-600">{error}</p></div>}

                {/* Hero row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Points card */}
                    <div className="lg:col-span-2 bg-[#09090b] rounded-xl p-7 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy size={14} className="text-[#facc15]" />
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Total Points</span>
                            </div>
                            <p className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-white mb-4 leading-none truncate pr-4 mt-2">
                                {(userData?.points || 0).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}>
                                    {tier}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/70 border border-white/10">
                                    {userData?.multiplier || 1}x Multiplier
                                </span>
                                {userRank && (
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/70 border border-white/10">
                                        #{userRank} Global
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="space-y-3">
                        {[
                            { label: 'Fair Score', value: userData?.fairScore || 0, icon: Star, suffix: '' },
                            { label: 'Trading Volume', value: `$${(userData?.tradingVolume || 0).toLocaleString()}`, icon: TrendingUp, suffix: '' },
                            { label: 'Multiplier', value: `${userData?.multiplier || 1}x`, icon: Zap, suffix: '' },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-center justify-between p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#f3f4f6] border border-[#e5e7eb] rounded-lg flex items-center justify-center">
                                        <Icon size={14} className="text-[#6b7280]" />
                                    </div>
                                    <span className="text-[11px] font-black text-[#6b7280] uppercase tracking-widest">{label}</span>
                                </div>
                                <span className="text-sm font-black font-mono text-[#09090b]">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Wallet address */}
                <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-xl">
                    <div>
                        <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mb-0.5">Linked Wallet</p>
                        <p className="text-xs font-mono text-[#09090b] truncate max-w-[300px]">
                            {userData?.walletAddress || user?.walletAddress || 'Not connected'}
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            await navigator.clipboard.writeText(userData?.walletAddress || user?.walletAddress || '')
                            setCopied(true); setTimeout(() => setCopied(false), 2000)
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-black text-[#6b7280] hover:text-[#09090b] uppercase tracking-widest transition-colors"
                    >
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>

                {/* Leaderboard */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] font-black text-[#6b7280] uppercase tracking-[0.2em]">Leaderboard</p>
                        <div className="flex gap-1.5 flex-wrap">
                            {['all', 'RP1', 'RP2', 'RP3', 'RP4', 'RP5'].map(tier => (
                                <button
                                    key={tier}
                                    onClick={() => setSelectedTier(tier)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedTier === tier
                                        ? 'bg-[#09090b] text-white'
                                        : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
                                        }`}
                                >
                                    {tier === 'all' ? 'All' : tier}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                        {/* thead */}
                        <div className="grid grid-cols-[30px_1fr_auto] sm:grid-cols-[40px_1fr_auto_auto] gap-2 sm:gap-4 px-4 sm:px-5 py-3 border-b border-[#f3f4f6] bg-[#fafafa]">
                            <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest">#</span>
                            <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest">User</span>
                            <span className="hidden sm:block text-[9px] font-black text-[#9ca3af] uppercase tracking-widest text-right">Tier</span>
                            <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest text-right">Points</span>
                        </div>

                        {leaderboardLoading ? (
                            <div className="flex justify-center p-12">
                                <svg className="w-5 h-5 animate-spin text-[#9ca3af]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="p-12 text-center text-sm text-[#9ca3af]">No users in this tier</div>
                        ) : (
                            <div className="divide-y divide-[#f9fafb]">
                                {leaderboard.slice(0, 20).map(u => {
                                    const isMe = u.email === email
                                    const tc = TIER_COLORS[u.reputationTier] || TIER_COLORS.RP1
                                    return (
                                        <div
                                            key={u._id}
                                            className={`grid grid-cols-[30px_1fr_auto] sm:grid-cols-[40px_1fr_auto_auto] gap-2 sm:gap-4 items-center px-4 sm:px-5 py-3.5 transition-colors ${isMe ? 'bg-[#fafafa] border-l-2 border-[#09090b]' : 'hover:bg-[#fafafa]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center">
                                                {RANK_MEDAL[u.rank]
                                                    ? <span className="text-base sm:text-lg leading-none">{RANK_MEDAL[u.rank]}</span>
                                                    : <span className="text-[10px] sm:text-[11px] font-black text-[#9ca3af]">#{u.rank}</span>
                                                }
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className={`text-xs sm:text-sm font-bold truncate ${isMe ? 'text-[#09090b]' : 'text-[#09090b]'}`}>
                                                    {isMe ? 'You' : u.email.split('@')[0]}
                                                    {isMe && <span className="ml-1 sm:ml-2 text-[8px] font-black bg-[#09090b] text-white px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-widest">Me</span>}
                                                </p>
                                                <p className="text-[9px] sm:text-[10px] text-[#9ca3af] font-medium">{u.multiplier}x mult</p>
                                            </div>
                                            <span className={`hidden sm:inline-block px-1.5 sm:px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${tc.bg} ${tc.text} ${tc.border}`}>
                                                {u.reputationTier || 'RP1'}
                                            </span>
                                            <div className="text-right">
                                                <p className="text-xs sm:text-sm font-black font-mono text-[#09090b]">{u.points.toLocaleString()}</p>
                                                <p className="text-[8px] sm:text-[9px] text-[#9ca3af] font-medium">pts</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Check-in history note */}
                {userData?.lastDailyCheckIn && (
                    <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-[#e5e7eb] rounded-xl">
                        <div className="flex items-center gap-3">
                            <Calendar size={14} className="text-[#6b7280]" />
                            <span className="text-[11px] font-black text-[#9ca3af] uppercase tracking-widest">Last Check-in</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-[#09090b]">
                            {new Date(userData.lastDailyCheckIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={() => { localStorage.removeItem(STORAGE_KEY); setStep('email'); setUserData(null); setEmail(''); setOtp(['', '', '', '', '', '']) }}
                    className="text-[10px] font-black text-[#9ca3af] hover:text-[#09090b] uppercase tracking-widest transition-colors"
                >
                    Sign out of ZeroAlpha
                </button>

            </div>
        </div>
    )
}
