import { useAuth } from '../context/AuthContext'
import ReceivePage from './ReceivePage'

export default function ReceivePageWrapper() {
    const { user } = useAuth()
    return <ReceivePage walletAddress={user?.walletAddress || ''} />
}
