import { useState, useMemo } from 'react'
import {
    Send, Lock, Globe, AlertCircle, CheckCircle2,
    ArrowUpRight, ChevronDown, Info, Zap, Shield, Eye, EyeOff
} from 'lucide-react'
import { buildSendTransaction } from '../utils/getTransaction'
import { CLOAK_PROGRAM_ID, NATIVE_SOL_MINT, createUtxo, createZeroUtxo, fullWithdraw, generateUtxoKeypair, getNkFromUtxoPrivateKey, transact } from '@cloak.dev/sdk';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Token { address: string; name: string; symbol: string; decimals: number; logoURI?: string }
interface TokenBalance {
    mint: string; balance: number; decimals: number; amount: string
    metadata?: Token; usdValue?: number
}

interface SendPageProps {
    balances: TokenBalance[]
    allTokens: Token[]
    walletAddress: string
    walletObject: any
    onSuccess?: () => void
}

export default function SendPage({ balances, allTokens, walletAddress, walletObject, onSuccess }: SendPageProps) {
    const [mode, setMode] = useState<'public' | 'private'>('public')
    const [selectedMint, setSelectedMint] = useState('So11111111111111111111111111111111111111112')
    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [signature, setSignature] = useState<string | null>(null)
    const [tokenDropOpen, setTokenDropOpen] = useState(false)

    const selectedBalance = balances.find(b => b.mint === selectedMint)
    const selectedToken = allTokens.find(t => t.address === selectedMint) || selectedBalance?.metadata

    // tokens to show in dropdown: owned first
    const dropdownTokens = useMemo(() => {
        const owned = balances.map(b => ({
            mint: b.mint,
            symbol: b.metadata?.symbol || b.mint.slice(0, 6),
            name: b.metadata?.name || 'Unknown',
            logo: b.metadata?.logoURI,
            balance: b.balance,
        }))
        return owned
    }, [balances])

    const handleMaxAmount = () => {
        if (!selectedBalance) return
        const max = selectedToken?.symbol === 'SOL'
            ? Math.max(0, selectedBalance.balance - 0.001)
            : selectedBalance.balance
        setAmount(max.toFixed(6))
    }

    const handlePublicSend = async () => {
        setLoading(true); setError(null); setSignature(null)
        try {
            if (!recipient.trim()) throw new Error('Enter a recipient address')
            if (!amount || parseFloat(amount) <= 0) throw new Error('Enter a valid amount')
            if (selectedBalance && parseFloat(amount) > selectedBalance.balance) throw new Error('Insufficient balance')

            const result = await buildSendTransaction({
                fromWalletAddress: walletAddress,
                recipientAddress: recipient.trim(),
                tokenMint: selectedMint,
                amount: parseFloat(amount),
                decimals: selectedBalance?.decimals || 9
            })
            if (!result.success) throw new Error(result.error || 'Failed to build transaction')

            const sendRes = await fetch(`${BACKEND_URL}/api/zero/wallet/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromAddress: walletAddress, transaction: Array.from(result.transaction) })
            })
            const sendData = await sendRes.json()
            if (!sendRes.ok) throw new Error(sendData.error || 'Send failed')
            setSignature(sendData.signature)
            setRecipient(''); setAmount('')
            onSuccess?.()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePrivateSend = async () => {
        setLoading(true); setError(null); setSignature(null)
        try {
            if (!recipient.trim()) throw new Error('Enter a recipient address')
            if (!amount || parseFloat(amount) <= 0) throw new Error('Enter a valid amount')
            if (!walletObject?.privateKey) throw new Error('Private key not available for local signing')

            const dec = selectedBalance?.decimals ?? 9
            const amountInBaseUnits = BigInt((parseFloat(amount) * Math.pow(10, dec)).toFixed(0))

            const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')

            // Reconstruct the keypair
            let secretBytes;
            if (typeof walletObject.privateKey === 'string') {
                if (walletObject.privateKey.includes(',')) {
                    secretBytes = Uint8Array.from(walletObject.privateKey.split(',').map(Number));
                } else if (walletObject.privateKey.length > 80) {
                    secretBytes = bs58.decode(walletObject.privateKey);
                } else {
                    secretBytes = Buffer.from(walletObject.privateKey, 'hex');
                }
            } else {
                secretBytes = Uint8Array.from(walletObject.privateKey);
            }
            const senderKeypair = Keypair.fromSecretKey(secretBytes);

            const SOL_MINT = 'So11111111111111111111111111111111111111112';
            const mintPubkey = selectedMint === SOL_MINT ? NATIVE_SOL_MINT : new PublicKey(selectedMint);
            const recipientWallet = new PublicKey(recipient.trim())

            // Cloak local shield loop
            const scanKeypair = await generateUtxoKeypair();
            const viewingKeyNk = getNkFromUtxoPrivateKey(scanKeypair.privateKey);
            const baseOptions = { connection, programId: CLOAK_PROGRAM_ID, walletPublicKey: senderKeypair.publicKey, depositorKeypair: senderKeypair, chainNoteViewingKeyNk: viewingKeyNk };

            const owner = await generateUtxoKeypair();
            const output = await createUtxo(amountInBaseUnits, owner, mintPubkey);

            const deposited = await transact({ inputUtxos: [await createZeroUtxo(mintPubkey)], outputUtxos: [output], externalAmount: amountInBaseUnits, depositor: senderKeypair.publicKey }, baseOptions);
            const txSignature: any = await fullWithdraw(deposited.outputUtxos, recipientWallet, { ...baseOptions, cachedMerkleTree: deposited.merkleTree });

            setSignature(txSignature?.signature || txSignature || 'ok')
            setRecipient(''); setAmount('')
            onSuccess?.()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSend = () => mode === 'public' ? handlePublicSend() : handlePrivateSend()

    return (
        <div className="h-full px-5 md:px-8 py-6 md:py-8 overflow-y-auto bg-white">
            <div className="max-w-md mx-auto pt-4 md:pt-10">

                {/* Page header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black text-[#09090b] tracking-tight">Send Tokens</h1>
                    <p className="text-sm text-[#6b7280] mt-1">Transfer assets on the Solana network</p>
                </div>

                <div className="space-y-5">

                    {/* Mode toggle */}
                    <div className="flex gap-2 p-1 bg-[#f3f4f6] rounded-xl w-fit">
                        {[
                            { id: 'public', label: 'Public', icon: Globe },
                            { id: 'private', label: 'Private', icon: Lock },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => { setMode(id as 'public' | 'private'); setError(null); setSignature(null) }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === id
                                    ? 'bg-[#09090b] text-white shadow-sm'
                                    : 'text-[#6b7280] hover:text-[#09090b]'
                                    }`}
                            >
                                <Icon size={12} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Token selector */}
                    <div>
                        <label className="block text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mb-2">
                            Token
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => setTokenDropOpen(p => !p)}
                                className="w-full flex items-center justify-between px-4 py-3.5 bg-[#fafafa] border border-[#e5e7eb] rounded-xl hover:border-[#09090b]/25 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] overflow-hidden flex items-center justify-center flex-shrink-0">
                                        {selectedToken?.logoURI
                                            ? <img src={selectedToken.logoURI} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                            : <span className="text-[9px] font-black text-[#6b7280]">{selectedToken?.symbol?.slice(0, 2) || '?'}</span>
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#09090b]">{selectedToken?.symbol || 'Select'}</p>
                                        <p className="text-[10px] text-[#9ca3af] font-medium">{selectedToken?.name || 'Token'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {selectedBalance && (
                                        <span className="text-xs font-bold text-[#6b7280]">
                                            {selectedBalance.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                        </span>
                                    )}
                                    <ChevronDown size={14} className={`text-[#9ca3af] transition-transform ${tokenDropOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {tokenDropOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg z-20 max-h-52 overflow-y-auto">
                                    {dropdownTokens.length === 0
                                        ? <p className="p-4 text-sm text-[#9ca3af] text-center">No tokens in wallet</p>
                                        : dropdownTokens.map(t => (
                                            <button
                                                key={t.mint}
                                                onClick={() => { setSelectedMint(t.mint); setTokenDropOpen(false); setAmount('') }}
                                                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#f9fafb] transition-colors text-left ${selectedMint === t.mint ? 'bg-[#f9fafb]' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] overflow-hidden flex items-center justify-center flex-shrink-0">
                                                        {t.logo
                                                            ? <img src={t.logo} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                                            : <span className="text-[9px] font-black text-[#6b7280]">{t.symbol.slice(0, 2)}</span>
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#09090b]">{t.symbol}</p>
                                                        <p className="text-[10px] text-[#9ca3af]">{t.name}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black font-mono text-[#09090b]">
                                                    {t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                </span>
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Network badge */}
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#9945ff]" />
                        <span className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest">
                            Solana Mainnet
                        </span>
                    </div>

                    {/* Recipient */}
                    <div>
                        <label className="block text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mb-2">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            value={recipient}
                            onChange={e => setRecipient(e.target.value)}
                            placeholder="Solana wallet address"
                            className="w-full px-4 py-3.5 bg-[#fafafa] border border-[#e5e7eb] rounded-xl text-sm font-mono text-[#09090b] placeholder-[#d1d5db] focus:outline-none focus:border-[#09090b]/25 transition-all"
                            disabled={loading}
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">Amount</label>
                            {selectedBalance && (
                                <button onClick={handleMaxAmount} className="text-[9px] font-black text-[#09090b] uppercase tracking-widest hover:opacity-70 transition-opacity">
                                    Max: {selectedBalance.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                inputMode="decimal"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3.5 bg-[#fafafa] border border-[#e5e7eb] rounded-xl text-xl font-black font-mono text-[#09090b] placeholder-[#d1d5db] focus:outline-none focus:border-[#09090b]/25 transition-all pr-20"
                                disabled={loading}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#9ca3af]">
                                {selectedToken?.symbol || 'TOKEN'}
                            </span>
                        </div>
                        {amount && selectedBalance?.usdValue && (
                            <p className="text-[10px] text-[#9ca3af] mt-1.5 px-1">
                                ≈ ${(parseFloat(amount) * (selectedBalance.usdValue / selectedBalance.balance)).toFixed(2)} USD
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Success */}
                    {signature && (
                        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                            <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[11px] font-black text-green-700 uppercase tracking-widest mb-1">Transfer Sent</p>
                                <a
                                    href={`https://solscan.io/tx/${signature}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-green-600 hover:underline flex items-center gap-1"
                                >
                                    View on Explorer <ArrowUpRight size={10} />
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={loading || !recipient || !amount || !selectedMint}
                        className="w-full py-4 rounded-xl bg-[#09090b] text-white text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-30 transition-all hover:bg-black/80 active:scale-[0.98] flex items-center justify-center gap-2.5"
                    >
                        {loading ? (
                            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Processing…</>
                        ) : (
                            <>{mode === 'private' ? <Lock size={14} /> : <Send size={14} />} {mode === 'private' ? 'Send Privately' : 'Send'}</>
                        )}
                    </button>

                    {/* Private mode info */}
                    {mode === 'private' && (
                        <div className="text-center mt-6">
                            <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
                                <Shield size={12} className="text-[#09090b]" /> Cloak Protocol Secured
                            </p>
                            <p className="text-[10px] text-[#9ca3af] leading-relaxed max-w-[280px] mx-auto">
                                Funds are routed through a zero-knowledge UTXO pool. Your public address is securely decoupled from the recipient.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
