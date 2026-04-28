import { useAuth } from '../context/AuthContext'
import Portfolio from './Portfolio'

export default function PortfolioWrapper() {
    const { user } = useAuth()
    const walletAddress = user?.walletAddress

    if (!walletAddress) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <p className="text-gray-500">No wallet linked to your account yet.</p>
            </div>
        )
    }

    return <Portfolio address={walletAddress} />
}
