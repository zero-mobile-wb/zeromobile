import { useState } from 'react'
import { Copy, Check, Shield, Info, Globe, AlertCircle, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface ReceivePageProps {
    walletAddress: string
}

export default function ReceivePage({ walletAddress }: ReceivePageProps) {
    const [copied, setCopied] = useState(false)
    const [copiedShort, setCopiedShort] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(walletAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const shortAddress = walletAddress
        ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-8)}`
        : ''

    return (
        <div className="h-full px-5 md:px-8 py-6 md:py-8 overflow-y-auto bg-white">
            <div className="max-w-7xl mx-auto">

                {/* Page header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-[#09090b] tracking-tight">Receive Tokens</h1>
                    <p className="text-sm text-[#6b7280] mt-1">Share your address to receive assets on Solana</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ══ LEFT: QR + Address ══ */}
                    <div className="space-y-5">

                        {/* Network badge */}
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9945ff]" />
                            <span className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest">
                                Solana Mainnet
                            </span>
                        </div>

                        {/* QR Card */}
                        <div className="p-6 bg-[#fafafa] border border-[#e5e7eb] rounded-xl flex flex-col items-center gap-5">
                            <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl shadow-sm">
                                {walletAddress ? (
                                    <QRCodeSVG
                                        value={walletAddress}
                                        size={200}
                                        level="H"
                                        includeMargin={false}
                                        fgColor="#09090b"
                                    />
                                ) : (
                                    <div className="w-[200px] h-[200px] bg-[#f3f4f6] rounded-lg flex items-center justify-center">
                                        <p className="text-xs text-[#9ca3af] font-medium">No wallet</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mb-1">Scan to receive</p>
                                <p className="text-xs font-mono text-[#6b7280]">{shortAddress}</p>
                            </div>
                        </div>

                        {/* Full address copy */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">
                                    Public Address
                                </label>
                                {copied && (
                                    <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Copied!</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 px-4 py-3.5 bg-[#fafafa] border border-[#e5e7eb] rounded-xl font-mono text-xs text-[#09090b] break-all leading-relaxed">
                                    {walletAddress || 'No wallet connected'}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#09090b] text-white rounded-xl hover:bg-black/80 transition-all active:scale-90"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                <strong>Solana only.</strong> Only send SOL or SPL tokens to this address. Sending EVM assets will result in permanent loss.
                            </p>
                        </div>
                    </div>

                    {/* ══ RIGHT: Info Panel ══ */}
                    <div className="space-y-5">

                        {/* How receiving works */}
                        <div className="p-6 bg-[#fafafa] border border-[#e5e7eb] rounded-xl">
                            <div className="flex items-center gap-2 mb-5">
                                <Info size={14} className="text-[#6b7280]" />
                                <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.18em]">How Receiving Works</p>
                            </div>
                            <div className="space-y-4">
                                {[
                                    {
                                        step: '01',
                                        title: 'Share Your Address',
                                        desc: 'Copy the Solana address above or let the sender scan your QR code. Your address is safe to share publicly.'
                                    },
                                    {
                                        step: '02',
                                        title: 'Sender Initiates Transfer',
                                        desc: 'The sender constructs a transaction targeting your public key. SOL transfers or SPL token transfers both work.'
                                    },
                                    {
                                        step: '03',
                                        title: 'Solana Confirms',
                                        desc: 'Validators confirm the transaction in ~400ms. Your balance updates automatically in the dashboard.'
                                    },
                                    {
                                        step: '04',
                                        title: 'Funds Available',
                                        desc: 'Tokens arrive in your wallet. For SPL tokens, an Associated Token Account (ATA) is auto-created if needed.'
                                    },
                                ].map(({ step, title, desc }) => (
                                    <div key={step} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#09090b] flex items-center justify-center">
                                            <span className="text-[9px] font-black text-white">{step}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#09090b] mb-0.5">{title}</p>
                                            <p className="text-[11px] text-[#6b7280] leading-relaxed">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Supported asset types */}
                        <div className="p-5 bg-[#fafafa] border border-[#e5e7eb] rounded-xl">
                            <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.18em] mb-4">Supported Assets</p>
                            <div className="space-y-2.5">
                                {[
                                    { label: 'SOL (Native)', tag: 'Supported', ok: true },
                                    { label: 'SPL Tokens (USDC, JUP, etc.)', tag: 'Supported', ok: true },
                                    { label: 'Compressed NFTs (cNFTs)', tag: 'Supported', ok: true },
                                    { label: 'EVM Tokens (ETH, USDC on Base)', tag: 'Not Supported', ok: false },
                                    { label: 'Bitcoin (BTC)', tag: 'Not Supported', ok: false },
                                ].map(({ label, tag, ok }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-[11px] text-[#6b7280] font-medium">{label}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${ok ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                            }`}>{tag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Network info */}
                        <div className="p-5 bg-[#fafafa] border border-[#e5e7eb] rounded-xl">
                            <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.18em] mb-4">Network Details</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Network', value: 'Solana Mainnet', icon: Globe },
                                    { label: 'Token Standard', value: 'SPL Token', icon: Download },
                                    { label: 'Avg. Finality', value: '~400ms', icon: Shield },
                                    { label: 'ATA Creation Fee', value: '~0.002 SOL', icon: Info },
                                ].map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="flex items-center gap-2.5 p-3 bg-white border border-[#e5e7eb] rounded-lg">
                                        <Icon size={12} className="text-[#9ca3af] flex-shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest">{label}</p>
                                            <p className="text-[11px] font-black text-[#09090b]">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
