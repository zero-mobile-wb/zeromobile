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
            <div className="max-w-md mx-auto pt-4 md:pt-10">

                {/* Page header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black text-[#09090b] tracking-tight">Receive Tokens</h1>
                    <p className="text-sm text-[#6b7280] mt-1">Share your address to receive assets on Solana</p>
                </div>

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

            </div>
        </div>
    )
}
