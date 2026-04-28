import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Key, Copy, Mail, Globe, CheckCircle, AlertCircle, LogOut, Check } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Settings() {
    const { user, logout } = useAuth()

    const [copied, setCopied] = useState(false)
    const [name, setName] = useState('')
    const [country, setCountry] = useState('')
    const [saving, setSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPk, setShowPk] = useState(false)

    const walletAddress = user?.walletAddress || 'pending_sss'
    const [privateKey, setPrivateKey] = useState<string | null>(user?.privateKey || null)
    const [otp, setOtp] = useState('')
    const [requestingOtp, setRequestingOtp] = useState(false)
    const [verifyingOtp, setVerifyingOtp] = useState(false)
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [exportedKey, setExportedKey] = useState<string | null>(null)

    const handleRequestOtp = async () => {
        if (!user?.email) return
        setRequestingOtp(true)
        setError(null)
        try {
            const res = await fetch(`${BACKEND_URL}/api/zero/wallet/export/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            })
            if (!res.ok) throw new Error('Failed to request OTP')
            setShowOtpInput(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setRequestingOtp(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!user?.email || !otp) return
        setVerifyingOtp(true)
        setError(null)
        try {
            const res = await fetch(`${BACKEND_URL}/api/zero/wallet/export/full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, otp })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Verification failed')
            setExportedKey(data.privateKey)
            setShowOtpInput(false)
            setShowPk(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setVerifyingOtp(false)
        }
    }

    useEffect(() => {
        if (user) {
            setName(user.name || '')
            setCountry(user.country || '')
        }
    }, [user])

    const handleCopyAddress = () => {
        if (walletAddress && walletAddress !== 'pending_sss') {
            navigator.clipboard.writeText(walletAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSaveProfile = async () => {
        if (!user?.email) return
        setSaving(true)
        setError(null)
        setSaveSuccess(false)

        try {
            const res = await fetch(`${BACKEND_URL}/api/zero/user/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    name,
                    country
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update profile')

            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const hasChanges = (name !== (user?.name || '')) || (country !== (user?.country || ''))

    return (
        <div className="h-full px-5 md:px-8 py-6 md:py-10 overflow-y-auto bg-white">
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col gap-2 pb-6 border-b border-[#e5e7eb]">
                    <h1 className="text-4xl font-black text-black tracking-tighter uppercase">Settings</h1>
                    <p className="text-[#6b7280] text-[11px] font-black uppercase tracking-[0.2em]">Global Account Configuration</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Identity Details */}
                    <div className="bg-white border border-[#e5e7eb] rounded-3xl p-8 shadow-sm space-y-8 flex flex-col">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#fafafa] border border-[#e5e7eb] rounded-2xl flex items-center justify-center">
                                <User size={22} className="text-black" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-black tracking-tight uppercase leading-none">Identity</h2>
                                <p className="text-[10px] text-[#6b7280] font-bold uppercase tracking-widest mt-1">Public profile details</p>
                            </div>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.2em] mb-2.5 block">
                                    Contact Email
                                </label>
                                <div className="w-full bg-[#fafafa] border border-[#e5e7eb] rounded-2xl px-5 py-4 text-sm font-bold text-black/50 cursor-not-allowed">
                                    {user?.email || 'ANONYMOUS_SESSION'}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.2em] mb-2.5 block">
                                    Full Identity Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter full name"
                                    className="w-full bg-white border border-[#e5e7eb] focus:border-black outline-none rounded-2xl px-5 py-4 text-sm font-black text-black transition-all placeholder:text-black/20"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.2em] mb-2.5 block">
                                    Operation Region
                                </label>
                                <input
                                    type="text"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="Enter country"
                                    className="w-full bg-white border border-[#e5e7eb] focus:border-black outline-none rounded-2xl px-5 py-4 text-sm font-black text-black transition-all placeholder:text-black/20"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSaveProfile}
                                disabled={!hasChanges || saving}
                                className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
                                    ${hasChanges
                                        ? 'bg-black text-white hover:bg-black/90 active:scale-[0.98] shadow-md'
                                        : 'bg-[#fafafa] text-[#9ca3af] border border-[#e5e7eb] cursor-not-allowed'}`}
                            >
                                {saving ? <><Loader2 className="animate-spin" size={14} /> Synchronizing</> : saveSuccess ? <><Check size={14} /> Profile Synchronized</> : 'Sync Profile'}
                            </button>
                        </div>
                    </div>

                    {/* Security & Keys */}
                    <div className="bg-white border border-[#e5e7eb] rounded-3xl p-8 shadow-sm flex flex-col space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#fafafa] border border-[#e5e7eb] rounded-2xl flex items-center justify-center">
                                <Key size={22} className="text-black" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-black tracking-tight uppercase leading-none">Security</h2>
                                <p className="text-[10px] text-[#6b7280] font-bold uppercase tracking-widest mt-1">Key Management Protocol</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6">
                            <div className="bg-[#fafafa] border border-[#e5e7eb] p-5 rounded-2xl">
                                <div className="flex items-start gap-4">
                                    <AlertCircle size={18} className="text-black shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[11px] font-black text-black uppercase tracking-tight mb-1">Key Status: Secure</h4>
                                        <p className="text-[10px] text-[#6b7280] leading-relaxed font-bold uppercase tracking-tight">
                                            Your wallet uses a 2/3 Shard Security system. Decryption requires an authorized email confirmation.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Export Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-black text-[#6b7280] uppercase tracking-[0.2em]">Private Key Terminal</label>
                                    {!exportedKey && !showOtpInput && (
                                        <button
                                            onClick={handleRequestOtp}
                                            disabled={requestingOtp}
                                            className="text-[10px] font-black text-black hover:underline uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {requestingOtp ? 'Sending code...' : 'Request Export'}
                                        </button>
                                    )}
                                    {showOtpInput && (
                                        <button
                                            onClick={() => setShowOtpInput(false)}
                                            className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-widest"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>

                                {showOtpInput && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                        <p className="text-[10px] font-bold text-black uppercase tracking-tight">Enter 6-digit confirmation code:</p>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000 000"
                                                className="flex-1 bg-[#fafafa] border border-[#e5e7eb] rounded-xl px-5 py-3 text-lg font-mono font-black text-center tracking-[0.5em] focus:border-black outline-none"
                                            />
                                            <button
                                                onClick={handleVerifyOtp}
                                                disabled={otp.length < 6 || verifyingOtp}
                                                className="bg-black text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black/90 disabled:opacity-30"
                                            >
                                                {verifyingOtp ? <Loader2 className="animate-spin" size={14} /> : 'Unlock'}
                                            </button>
                                        </div>
                                        {error && <p className="text-[9px] font-bold text-red-500 uppercase">{error}</p>}
                                    </div>
                                )}

                                {exportedKey ? (
                                    <div className={`relative transition-all duration-500 rounded-2xl overflow-hidden ${showPk ? 'opacity-100 max-h-40' : 'opacity-40 max-h-12'}`}>
                                        <div className={`absolute inset-0 bg-black backdrop-blur-md z-10 flex items-center justify-center transition-opacity duration-500 ${showPk ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                            <div className="flex items-center gap-2">
                                                <Key size={12} className="text-white" />
                                                <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">SECURE_REVEAL_SYSTEM</span>
                                            </div>
                                        </div>
                                        <div className="bg-black text-white p-5 flex flex-col gap-3">
                                            <code className="text-[10px] font-mono break-all leading-relaxed tracking-tighter opacity-80">
                                                {exportedKey}
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(exportedKey)
                                                    setCopied(true)
                                                    setTimeout(() => setCopied(false), 2000)
                                                }}
                                                className="w-full bg-white text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-colors"
                                            >
                                                {copied ? 'Copied' : 'Copy Master Key'}
                                            </button>
                                        </div>
                                    </div>
                                ) : !showOtpInput && (
                                    <div className="bg-[#fafafa] border border-[#e5e7eb] rounded-2xl p-6 text-center">
                                        <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest opacity-50 leading-relaxed">
                                            Click "Request Export" to receive an authorization code via email.
                                        </p>
                                    </div>
                                )}

                                {showPk && (
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                        <AlertCircle size={10} /> Critical: Never share your private key.
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleCopyAddress}
                            disabled={!walletAddress || walletAddress === 'pending_sss'}
                            className="w-full group bg-white border border-black text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-black hover:text-white flex items-center justify-center gap-2"
                        >
                            {copied ? <><CheckCircle size={14} /> Synced</> : <><Copy size={14} className="group-hover:scale-110 transition-transform" /> Copy Public Address</>}
                        </button>
                    </div>
                </div>

                {/* Account Management footer */}
                <div className="pt-10 border-t border-[#e5e7eb] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="text-[11px] font-black text-[#6b7280] uppercase tracking-[0.2em] mb-1">Session Protocol</h3>
                        <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">Terminate all active connections to this node</p>
                    </div>
                    <button
                        onClick={logout}
                        className="px-10 py-4 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all active:scale-95 flex items-center gap-3"
                    >
                        <LogOut size={16} />
                        Exit Secure Terminal
                    </button>
                </div>
            </div>
            <div className="h-20" />
        </div>
    )
}

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
}
