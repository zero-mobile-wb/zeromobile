import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import SendPage from './SendPage'

interface Token { address: string; name: string; symbol: string; decimals: number; logoURI?: string }
interface TokenBalance {
    mint: string; balance: number; decimals: number; amount: string
    metadata?: Token; usdValue?: number; pricePerToken?: number
}

const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=8b1f5488-b7ad-46c7-ae91-f42dd14a8f46'
const connection = new Connection(RPC_URL, 'confirmed')
const SOL_MINT = 'So11111111111111111111111111111111111111112'

export default function SendPageWrapper() {
    const { user } = useAuth()
    const walletAddress = user?.walletAddress || ''
    const [balances, setBalances] = useState<TokenBalance[]>([])
    const [allTokens, setAllTokens] = useState<Token[]>([])

    // Fetch token metadata
    useEffect(() => {
        fetch('https://tokens.jup.ag/tokens?tags=verified')
            .then(r => r.json())
            .then(data => setAllTokens(data))
            .catch(() => setAllTokens([{
                address: SOL_MINT, symbol: 'SOL', name: 'Solana', decimals: 9,
                logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
            }]))
    }, [])

    // Fetch user balances
    useEffect(() => {
        if (!walletAddress) return
        const fetchBalances = async () => {
            try {
                const pk = new PublicKey(walletAddress)
                const lamports = await connection.getBalance(pk)
                const solBal = lamports / LAMPORTS_PER_SOL
                const resp = await connection.getParsedTokenAccountsByOwner(pk, {
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
                })
                const splTokens = resp.value
                    .map(a => ({
                        mint: a.account.data.parsed.info.mint,
                        balance: a.account.data.parsed.info.tokenAmount.uiAmount,
                        decimals: a.account.data.parsed.info.tokenAmount.decimals,
                        amount: a.account.data.parsed.info.tokenAmount.amount,
                    }))
                    .filter(t => t.balance > 0)

                const all: TokenBalance[] = [
                    {
                        mint: SOL_MINT, balance: solBal, decimals: 9,
                        amount: (solBal * LAMPORTS_PER_SOL).toString(),
                        metadata: {
                            address: SOL_MINT, symbol: 'SOL', name: 'Solana', decimals: 9,
                            logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                        }
                    },
                    ...splTokens.map(t => ({
                        ...t,
                        metadata: allTokens.find(tk => tk.address === t.mint) || {
                            address: t.mint, symbol: t.mint.slice(0, 6), name: 'Unknown', decimals: t.decimals
                        }
                    }))
                ]
                setBalances(all)
            } catch (e) { console.error(e) }
        }
        fetchBalances()
    }, [walletAddress, allTokens])

    return (
        <SendPage
            balances={balances}
            allTokens={allTokens}
            walletAddress={walletAddress}
            walletObject={{ address: walletAddress }}
        />
    )
}
