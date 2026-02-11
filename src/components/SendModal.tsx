import { useState, useEffect, useRef } from 'react'
import { X, Send, AlertCircle, QrCode, Keyboard, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { useSignAndSendTransaction } from '@privy-io/react-auth/solana'
import { buildSendTransaction } from '../utils/getTransaction'
import bs58 from 'bs58'
import { Html5Qrcode } from 'html5-qrcode'
import { useTheme } from '../context/ThemeContext'

interface SendModalProps {
    isOpen: boolean
    onClose: () => void
    wallet: any
    token?: {
        mint: string
        symbol: string
        balance: number
        decimals: number
        logoURI?: string
    }
    onSuccess?: () => void
}

export default function SendModal({ isOpen, onClose, wallet, token, onSuccess }: SendModalProps) {
    const [recipientAddress, setRecipientAddress] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [signature, setSignature] = useState<string | null>(null)
    const [scanMode, setScanMode] = useState(false)
    const [scanning, setScanning] = useState(false)

    const scannerRef = useRef<Html5Qrcode | null>(null)
    const { signAndSendTransaction } = useSignAndSendTransaction()
    const { theme } = useTheme()

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error)
            }
        }
    }, [])

    const startScanner = async () => {
        setScanning(true)
        setScanMode(true)
        setError(null)

        try {
            const scanner = new Html5Qrcode("qr-reader")
            scannerRef.current = scanner

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    setRecipientAddress(decodedText)
                    stopScanner()
                },
                () => { }
            )
        } catch (err: any) {
            console.error("Scanner error:", err)
            setError("Failed to start camera. Please check permissions.")
            setScanMode(false)
            setScanning(false)
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
                scannerRef.current = null
            } catch (err) {
                console.error("Error stopping scanner:", err)
            }
        }
        setScanMode(false)
        setScanning(false)
    }

    if (!isOpen) return null

    const handleSend = async () => {
        if (!wallet || !token) return
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            if (!recipientAddress.trim()) throw new Error('Please enter a recipient address')
            if (!amount || parseFloat(amount) <= 0) throw new Error('Please enter a valid amount')
            if (parseFloat(amount) > token.balance) throw new Error('Insufficient balance')

            const result = await buildSendTransaction({
                fromWalletAddress: wallet.address,
                recipientAddress: recipientAddress.trim(),
                tokenMint: token.mint,
                amount: parseFloat(amount),
                decimals: token.decimals
            })

            if (!result.success) throw new Error(result.error || 'Failed to build transaction')

            const txResult = await signAndSendTransaction({
                transaction: result.transaction,
                wallet,
                chain: 'solana:mainnet'
            })

            const signatureString = bs58.encode(txResult.signature)
            setSuccess(true)
            setSignature(signatureString)
            setRecipientAddress('')
            setAmount('')

            setTimeout(() => {
                onSuccess?.()
                onClose()
            }, 3000)
        } catch (err: any) {
            console.error('Send error:', err)
            setError(err.message || 'Failed to send token')
        } finally {
            setLoading(false)
        }
    }

    const handleMaxAmount = () => {
        if (token) {
            const maxAmount = token.symbol === 'SOL' ? Math.max(0, token.balance - 0.001) : token.balance
            setAmount(maxAmount.toString())
        }
    }

    const handleClose = async () => {
        await stopScanner()
        onClose()
    }

    return (
        <div className="fixed inset-0 backdrop-blur-xl bg-black/40 dark:bg-black/60 flex items-center justify-center z-[110] p-4">
            <div className="bg-white dark:bg-[#0a0a0b] border border-gray-100 dark:border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/5 dark:bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full z-20"
                >
                    <X size={20} />
                </button>

                {success ? (
                    <div className="text-center py-12 relative z-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                            <CheckCircle2 size={40} className="text-green-500 dark:text-green-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Transaction Sent</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-10 max-w-[240px] mx-auto">Your transfer has been successfully broadcast to the Solana network.</p>
                        {signature && (
                            <a
                                href={`https://solscan.io/tx/${signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
                            >
                                <span>Explorer Result</span>
                                <ArrowUpRight size={14} />
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="relative z-10">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Transfer {token?.symbol}</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Available</span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                                    {token?.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token?.symbol}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Recipient Input */}
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Recipient</span>
                                    <button
                                        onClick={scanMode ? stopScanner : startScanner}
                                        className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-[0.1em]"
                                        type="button"
                                        disabled={loading}
                                    >
                                        {scanMode ? <Keyboard size={12} /> : <QrCode size={12} />}
                                        {scanMode ? 'Type Address' : 'Scan QR'}
                                    </button>
                                </div>

                                {scanMode ? (
                                    <div className="space-y-4">
                                        <div id="qr-reader" className="rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 bg-black shadow-inner"></div>
                                        <button
                                            onClick={stopScanner}
                                            className="w-full py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={recipientAddress}
                                        onChange={(e) => setRecipientAddress(e.target.value)}
                                        placeholder="Solana address or .sol domain"
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500/30 dark:focus:border-white/20 transition-all text-sm font-mono shadow-inner"
                                        disabled={loading}
                                    />
                                )}
                            </div>

                            {/* Amount Input */}
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Amount</span>
                                    <button
                                        onClick={handleMaxAmount}
                                        className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors uppercase tracking-widest"
                                        disabled={loading}
                                    >
                                        Use Max
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500/30 dark:focus:border-white/20 transition-all text-xl font-bold shadow-inner"
                                        disabled={loading}
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 font-bold text-sm pointer-events-none">
                                        {token?.symbol}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 rounded-2xl">
                                    <AlertCircle size={16} className="text-red-500 dark:text-red-400 shrink-0" />
                                    <p className="text-[11px] font-bold text-red-600 dark:text-red-300 uppercase tracking-tight">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={loading || !recipientAddress || !amount}
                                className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-base transition-all hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Confirm Transfer</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
