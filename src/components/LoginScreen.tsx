import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import icon from '../assets/icon.png'
import hero from '../assets/hero.png'

export default function LoginScreen() {
    const { login, verify, loading, error, clearError, authenticated } = useAuth()
    const navigate = useNavigate()

    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [localError, setLocalError] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => { setMounted(true) }, [])
    useEffect(() => { if (authenticated) navigate('/dashboard') }, [authenticated])

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null); clearError()
        if (!email.trim()) { setLocalError('Please enter your email'); return }
        try { await login(email.trim().toLowerCase()); setStep('otp') }
        catch (err: any) { setLocalError(err.message) }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null); clearError()
        if (!otp.trim()) { setLocalError('Please enter the OTP'); return }
        try { setSuccess(true); await verify(email.trim().toLowerCase(), otp.trim()) }
        catch (err: any) { setSuccess(false); setLocalError(err.message) }
    }

    const displayError = localError || error

    return (
        <div className="flex h-screen overflow-hidden bg-white">

            {/* ══════════ LEFT 50% — Black Background with Hero image ══════════ */}
            <div className="hidden lg:block w-1/2 p-6" style={{ background: '#09090b' }}>
                <div
                    className={`relative w-full h-full overflow-hidden transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'}`}
                    style={{ borderRadius: 28 }}
                >
                    <img
                        src={hero}
                        alt="Zero Dashboard"
                        className="w-full h-full object-cover"
                    />
                    {/* Bottom overlay */}
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 45%, transparent 70%)' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-10">
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                            Zero Finance
                        </p>
                        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: 10 }}>
                            Your Solana wallet,<br />beautifully simple.
                        </h2>
                    </div>
                </div>
            </div>

            {/* ══════════ RIGHT 50% — White form panel ══════════ */}
            <div
                className={`flex-1 lg:w-1/2 flex flex-col items-center justify-center px-8 md:px-14 bg-white transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
                <div className="w-full" style={{ maxWidth: 380 }}>

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-10">
                        <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <img src={icon} alt="Zero" className="w-full h-full object-cover" />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#09090b', letterSpacing: '-0.01em' }}>Zero</span>
                    </div>

                    {step === 'email' ? (
                        <>
                            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 8 }}>
                                Get started
                            </h1>
                            <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, marginBottom: 32, lineHeight: 1.6 }}>
                                Sign in with your email to access your wallet.
                            </p>

                            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setLocalError(null) }}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        autoFocus
                                        className="w-full h-14 px-5 bg-[#fafafa] border border-gray-200 rounded-2xl outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all text-sm font-semibold text-black shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>

                                {displayError && (
                                    <p className="text-[13px] text-red-500 font-medium px-1">⚠ {displayError}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 mt-2 bg-[#09090b] text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                >
                                    {loading
                                        ? <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                        : 'Continue'
                                    }
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setStep('email'); setOtp(''); setLocalError(null); clearError() }}
                                style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                ← Back
                            </button>
                            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 8 }}>
                                Check your inbox
                            </h1>
                            <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, marginBottom: 32, lineHeight: 1.6 }}>
                                We sent a 6-digit code to <strong style={{ color: '#111827', fontWeight: 700 }}>{email}</strong>
                            </p>

                            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={otp}
                                        onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setLocalError(null) }}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        autoFocus
                                        className="w-full h-14 px-5 bg-[#fafafa] border border-gray-200 rounded-2xl outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all text-sm font-bold text-black tracking-[0.3em] text-center shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                    />
                                </div>

                                {displayError && <p className="text-[13px] text-red-500 font-medium px-1">⚠ {displayError}</p>}
                                {success && !displayError && <p className="text-[13px] text-emerald-500 font-semibold px-1">✓ Verified — redirecting…</p>}

                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 4}
                                    className="w-full h-14 mt-2 bg-[#09090b] text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                >
                                    {loading
                                        ? <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                        : 'Verify & Enter'
                                    }
                                </button>

                                <button type="button" onClick={handleSendOtp} disabled={loading}
                                    className="pt-2 text-[13px] text-gray-500 hover:text-gray-900 font-semibold transition-colors bg-transparent border-none cursor-pointer text-center w-full"
                                    style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Didn't receive it? Resend
                                </button>
                            </form>
                        </>
                    )}

                    <p style={{ marginTop: 40, fontSize: 12, color: '#9ca3af', fontWeight: 500, lineHeight: 1.6 }}>
                        By continuing you agree to Zero's{' '}
                        <span style={{ color: '#4b5563', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Terms</span>
                        {' & '}
                        <span style={{ color: '#4b5563', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Privacy Policy</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
