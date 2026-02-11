import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTheme } from '../context/ThemeContext'

interface ReceiveModalProps {
    isOpen: boolean
    onClose: () => void
    walletAddress: string
}

export default function ReceiveModal({ isOpen, onClose, walletAddress }: ReceiveModalProps) {
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(walletAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="fixed inset-0 backdrop-blur-xl bg-black/40 dark:bg-black/60 flex items-center justify-center z-[110] p-4">
            <div className="bg-white dark:bg-[#0a0a0b] border border-gray-200 dark:border-white/10 rounded-3xl shadow-none dark:shadow-2xl max-w-md w-full p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Background Glow */}
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-600/5 dark:bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="mb-8 relative z-10">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Receive Assets</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Scan QR code or copy address to receive tokens.
                    </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-8 relative z-10">
                    <div className="bg-gray-100 dark:bg-white p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-none">
                        <QRCodeSVG
                            value={walletAddress}
                            size={200}
                            level="H"
                            includeMargin={false}
                            fgColor="#000000"
                        />
                    </div>
                </div>

                {/* Wallet Address Label */}
                <div className="mb-8 relative z-10">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Public Address</span>
                        {copied && (
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-widest animate-pulse">Copied!</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 px-5 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-mono text-xs text-blue-600 dark:text-blue-400 break-all leading-relaxed shadow-inner">
                            {walletAddress}
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:scale-90 shadow-xl"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>

                {/* Network Info */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 relative z-10">
                    <div className="w-1.5 h-1.5 bg-amber-600 dark:bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-200/70 leading-relaxed font-medium">
                        <strong>Important:</strong> Only send SOL or Solana-based (SPL) tokens to this address. Sending other assets will result in permanent loss of funds.
                    </p>
                </div>

                {/* Done Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-8 px-6 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-bold text-sm"
                >
                    Done
                </button>
            </div>
        </div>
    )
}
