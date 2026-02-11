import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets, useExportWallet } from '@privy-io/react-auth/solana'
import { User, Key, Copy, Mail, Wallet as WalletIcon, CheckCircle, AlertCircle, LogOut, ShieldCheck, ChevronRight, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
    const { user, logout } = usePrivy()
    const { wallets } = useWallets()
    const { exportWallet } = useExportWallet()
    const { theme, toggleTheme } = useTheme()

    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const solanaWallet = wallets[0]

    const handleExportPrivateKey = async () => {
        if (!solanaWallet) return
        setLoading(true)
        setError(null)
        try {
            await exportWallet({ address: solanaWallet.address })
        } catch (err: any) {
            console.error('Error exporting private key:', err)
            setError(err.message || 'Failed to export private key')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyAddress = () => {
        if (solanaWallet) {
            navigator.clipboard.writeText(solanaWallet.address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="w-full space-y-10 px-3 md:px-30 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2 uppercase">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Global Terminal Preferences</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white transition-all hover:bg-gray-200 dark:hover:bg-white/10 group"
                    >
                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                        <ShieldCheck size={14} className="text-green-500" />
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Secure Link</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Card */}
                <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-none dark:shadow-xl space-y-8">
                    <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
                        <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-white/10">
                            <User size={24} className="text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Identity</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Public Profile Details</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg"><Mail size={16} className="text-blue-500 dark:text-white" /></div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Contact</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{user?.email?.address || 'Anonymous'}</span>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                            </div>
                        </div>

                        {solanaWallet && (
                            <div className="bg-gray-200 dark:bg-white/[0.02] border border-gray-300 dark:border-white/5 rounded-2xl p-4 group">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/10 rounded-lg"><WalletIcon size={16} className="text-purple-500 dark:text-white" /></div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Primary Wallet</span>
                                        </div>
                                        <button onClick={handleCopyAddress} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors font-bold">
                                            {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] font-mono text-gray-600 dark:text-gray-400 break-all bg-gray-300 dark:bg-black/20 p-3 rounded-xl border border-gray-400 dark:border-white/5 shadow-inner">
                                        {solanaWallet.address}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-none dark:shadow-xl flex flex-col justify-between">
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
                            <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-white/10">
                                <Key size={24} className="text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Security</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Key Management</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl p-5">
                            <div className="flex items-start gap-4">
                                <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">Backup Requirement</h4>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-200/60 leading-relaxed font-medium">
                                        You are in control of your funds. Export your private key to ensure you never lose access.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                        <button
                            onClick={handleExportPrivateKey}
                            disabled={loading || !solanaWallet}
                            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 shadow-none dark:shadow-xl"
                        >
                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mx-auto" /> : 'Export Private Key'}
                        </button>
                        {error && <p className="mt-3 text-[10px] font-black text-red-500 uppercase tracking-widest text-center">{error}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-gray-100 dark:bg-red-500/5 backdrop-blur-3xl border border-gray-200 dark:border-red-100 dark:border-red-500/10 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mb-2 uppercase tracking-tighter">Sign Out</h3>
                    <p className="text-xs text-red-700 dark:text-red-200/50 font-bold uppercase tracking-widest max-w-md">Terminate session on this device</p>
                </div>
                <button onClick={logout} className="relative z-10 px-10 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-xl flex items-center gap-3">
                    <LogOut size={16} />
                    Terminal Exit
                </button>
            </div>
            <div className="h-20" />
        </div>
    )
}
