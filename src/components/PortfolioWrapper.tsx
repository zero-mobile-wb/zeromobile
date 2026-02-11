import { useWallets } from '@privy-io/react-auth/solana'
import Portfolio from './Portfolio'

export default function PortfolioWrapper() {
    const { wallets } = useWallets()
    const solanaWallet = wallets[0]

    if (!solanaWallet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <p className="text-gray-500">Please connect your wallet to view portfolio</p>
            </div>
        )
    }

    return <Portfolio address={solanaWallet.address} />
}
