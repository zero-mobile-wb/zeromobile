import { useState, useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Mail, Lock, Trophy, Star, TrendingUp, Calendar, Loader2, LogOut } from 'lucide-react'

const BACKEND_URL = 'http://localhost:3000'
const STORAGE_KEY = 'zeroalpha_auth_email'

interface UserData {
    _id: string
    email: string
    walletAddress: string
    points: number
    fairScore: number
    reputationTier: string
    multiplier: number
    lastDailyCheckIn: string | null
    tradingVolume: number
}

interface LeaderboardUser {
    _id: string
    email: string
    walletAddress: string
    points: number
    fairScore: number
    reputationTier: string
    multiplier: number
    tradingVolume: number
    rank: number
}

export default function ZeroAlphaDashboard() {
    const { user } = usePrivy()
    const [step, setStep] = useState<'email' | 'otp' | 'dashboard'>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [userData, setUserData] = useState<UserData | null>(null)
    const [checkInLoading, setCheckInLoading] = useState(false)
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
    const [selectedTier, setSelectedTier] = useState<string>('all')
    const [leaderboardLoading, setLeaderboardLoading] = useState(false)
    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    // Check for existing session on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem(STORAGE_KEY)
        if (savedEmail) {
            setEmail(savedEmail)
            setStep('dashboard')
            fetchUserDataByEmail(savedEmail)
        }
    }, [])

    // Send OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch(`${BACKEND_URL}/api/zero/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP')
            }

            setStep('otp')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Verify OTP
    const handleVerifyOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setError('')
        setLoading(true)

        const otpCode = otp.join('')
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits')
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/zero/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    otp: otpCode,
                    walletAddress: user?.wallet?.address
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify OTP')
            }

            // Save email to localStorage
            localStorage.setItem(STORAGE_KEY, email)

            setUserData(data.user)
            setStep('dashboard')
            fetchUserData()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle OTP input change
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return // Only allow digits

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1) // Only take last character
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all 6 digits are entered
        if (index === 5 && value) {
            const fullOtp = [...newOtp]
            fullOtp[5] = value.slice(-1)
            if (fullOtp.every(digit => digit !== '')) {
                setOtp(fullOtp)
                setTimeout(() => handleVerifyOtp(), 100)
            }
        }
    }

    // Handle OTP backspace
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    // Fetch user data by email
    const fetchUserDataByEmail = async (emailToFetch: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/zero/user/${encodeURIComponent(emailToFetch)}`)
            const data = await response.json()

            if (response.ok) {
                setUserData(data)
            }
        } catch (err) {
            console.error('Failed to fetch user data:', err)
        }
    }

    // Fetch user data
    const fetchUserData = async () => {
        if (!email) return
        await fetchUserDataByEmail(email)
    }

    // Daily check-in
    const handleCheckIn = async () => {
        setCheckInLoading(true)
        setError('')

        try {
            const response = await fetch(`${BACKEND_URL}/api/zero/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Check-in failed')
            }

            // Update user data
            await fetchUserData()
            alert(data.message)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setCheckInLoading(false)
        }
    }

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem(STORAGE_KEY)
        setStep('email')
        setUserData(null)
        setEmail('')
        setOtp(['', '', '', '', '', ''])
    }

    // Fetch leaderboard data
    const fetchLeaderboard = async (tier: string = 'all') => {
        setLeaderboardLoading(true)
        try {
            const url = tier === 'all'
                ? `${BACKEND_URL}/api/zero/leaderboard`
                : `${BACKEND_URL}/api/zero/leaderboard?tier=${tier}`

            const response = await fetch(url)
            const data = await response.json()

            if (response.ok) {
                setLeaderboardData(data)
            }
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err)
        } finally {
            setLeaderboardLoading(false)
        }
    }

    // Fetch leaderboard on mount and when tier changes
    useEffect(() => {
        if (step === 'dashboard') {
            fetchLeaderboard(selectedTier)
        }
    }, [step, selectedTier])

    // Auto-refresh user data
    useEffect(() => {
        if (step === 'dashboard' && email) {
            const interval = setInterval(fetchUserData, 30000) // Refresh every 30s
            return () => clearInterval(interval)
        }
    }, [step, email])

    // Email Input View
    if (step === 'email') {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
                {/* Background Decorative Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

                <div className="w-full max-w-lg relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">ZeroAlpha</h1>
                        <p className="text-gray-400 text-base">
                            Enter your email to access your points dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSendOtp} className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-10 shadow-none dark:shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                        <div className="relative z-10">
                            <div className="mb-6">
                                <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-14 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-semibold text-base shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={22} />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <span>Send OTP</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    // OTP Verification View
    if (step === 'otp') {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
                {/* Background Decorative Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

                <div className="w-full max-w-md relative z-10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-black/5 dark:bg-white/5 p-1 rounded-2xl backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl mb-6">
                            <Lock className="text-blue-500" size={40} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Verify OTP</h1>
                        <p className="text-gray-400 mt-2 text-center text-sm">
                            Enter the code sent to {email}
                        </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-none dark:shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                        <div className="relative z-10">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center">Enter 6-Digit Code</label>
                                <div className="flex gap-2 justify-center">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { otpRefs.current[index] = el }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-12 h-14 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || otp.some(d => !d)}
                                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-semibold text-sm shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mb-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <span>Verify & Continue</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('email')
                                    setOtp(['', '', '', '', '', ''])
                                }}
                                className="w-full py-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                            >
                                ← Back to email
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    // Dashboard View
    return (
        <div className="max-w-[1600px] mx-auto px-0 md:px-1 pt-4 md:pt-6 pb-12">
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    {/* Hero Points Card */}
                    <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-3xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-none dark:shadow-2xl">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                                    <Trophy className="text-blue-500" size={20} />
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">ZeroAlpha Points</span>
                                </div>
                                <h2 className="text-5xl md:text-7xl font-mono font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-white dark:to-white/60 mb-2 tracking-tighter">
                                    {userData?.points?.toLocaleString() || 0}
                                </h2>
                                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                                    <span className="text-sm font-mono truncate max-w-[200px]">{email}</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                            <span className="text-[10px] font-bold text-purple-500 uppercase">
                                                {userData?.multiplier || 1}x Multiplier
                                            </span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <span className="text-[10px] font-bold text-green-500 uppercase">
                                                {userData?.reputationTier || 'RP1'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Grid */}
                            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleCheckIn}
                                    disabled={checkInLoading}
                                    className="flex flex-col items-center gap-2 p-4 bg-gray-200 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/5 hover:bg-gray-300 dark:hover:bg-white/10 transition-all duration-300 group disabled:opacity-30 active:scale-95 shadow-none"
                                >
                                    <div className={`w-10 h-10 flex items-center justify-center text-gray-900 dark:text-white group-hover:scale-110 transition-transform ${checkInLoading ? 'animate-spin' : ''}`}>
                                        {checkInLoading ? <Loader2 size={20} /> : <Calendar size={20} />}
                                    </div>
                                    <span className="text-xs font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">Check In</span>
                                </button>
                                <button
                                    onClick={() => fetchUserData()}
                                    className="flex flex-col items-center gap-2 p-4 bg-gray-200 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/5 hover:bg-gray-300 dark:hover:bg-white/10 transition-all duration-300 group active:scale-95 shadow-none"
                                >
                                    <div className="w-10 h-10 flex items-center justify-center text-gray-900 dark:text-white group-hover:scale-110 transition-transform">
                                        <TrendingUp size={20} />
                                    </div>
                                    <span className="text-xs font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">Refresh</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex flex-col items-center gap-2 p-4 bg-gray-200 dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/5 hover:bg-gray-300 dark:hover:bg-white/10 transition-all duration-300 group active:scale-95 shadow-none col-span-2"
                                >
                                    <div className="w-10 h-10 flex items-center justify-center text-gray-900 dark:text-white group-hover:scale-110 transition-transform">
                                        <LogOut size={20} />
                                    </div>
                                    <span className="text-xs font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Your Stats</h3>
                            {userData?.lastDailyCheckIn && (
                                <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-white/5">
                                    Last: {new Date(userData.lastDailyCheckIn).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden shadow-none dark:shadow-xl">
                            <div className="divide-y divide-gray-200 dark:divide-white/5">
                                {/* Fair Score */}
                                <div className="flex items-center justify-between p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                                            <Trophy className="text-green-500" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Fair Score</p>
                                            <p className="text-xs text-gray-500">Reputation metric</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{userData?.fairScore || 0}</p>
                                        <p className="text-xs text-gray-400">{userData?.reputationTier || 'RP1'}</p>
                                    </div>
                                </div>

                                {/* Multiplier */}
                                <div className="flex items-center justify-between p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                                            <TrendingUp className="text-purple-500" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Points Multiplier</p>
                                            <p className="text-xs text-gray-500">Based on Fair Score</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{userData?.multiplier || 1}x</p>
                                    </div>
                                </div>

                                {/* Trading Volume */}
                                <div className="flex items-center justify-between p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                                            <Star className="text-orange-500" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Trading Volume</p>
                                            <p className="text-xs text-gray-500">Total volume traded</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">${(userData?.tradingVolume || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Wallet */}
                                <div className="flex items-center justify-between p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                            <Mail className="text-blue-500" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Wallet Address</p>
                                            <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                                                {userData?.walletAddress || user?.wallet?.address || 'Not connected'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(userData?.walletAddress || user?.wallet?.address || '')}
                                        className="p-2 bg-gray-200 dark:bg-white/5 rounded-lg hover:bg-gray-300 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Leaderboard</h3>
                            <div className="flex gap-2">
                                {['all', 'RP1', 'RP2', 'RP3', 'RP4', 'RP5'].map((tier) => (
                                    <button
                                        key={tier}
                                        onClick={() => setSelectedTier(tier)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${selectedTier === tier
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        {tier === 'all' ? 'All' : tier}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden shadow-none dark:shadow-xl">
                            {leaderboardLoading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="animate-spin text-gray-400" size={32} />
                                </div>
                            ) : leaderboardData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                                    <Trophy size={48} className="mb-4 opacity-30" />
                                    <p className="text-sm">No users found in this tier</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-white/5">
                                    {leaderboardData.slice(0, 20).map((leaderUser) => (
                                        <div
                                            key={leaderUser._id}
                                            className={`flex items-center justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors ${leaderUser.email === email ? 'bg-blue-500/5 border-l-4 border-blue-500' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Rank */}
                                                <div className="w-8 text-center">
                                                    {leaderUser.rank <= 3 ? (
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${leaderUser.rank === 1 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                                                leaderUser.rank === 2 ? 'bg-gray-400/20 text-gray-600 dark:text-gray-400' :
                                                                    'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                                            }`}>
                                                            {leaderUser.rank}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-bold text-gray-500">#{leaderUser.rank}</span>
                                                    )}
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate">
                                                        {leaderUser.email === email ? 'You' : leaderUser.email.split('@')[0]}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-bold text-purple-500 uppercase">
                                                            {leaderUser.reputationTier || 'RP1'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {leaderUser.multiplier}x multiplier
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Points */}
                                                <div className="text-right">
                                                    <p className="font-black text-lg text-gray-900 dark:text-white">
                                                        {leaderUser.points.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">points</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-red-400">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
