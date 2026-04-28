import { User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import logo from '../../assets/icon.png'

export function Navbar() {
    const { user } = useAuth()

    // Get user display identifier (email or wallet)
    const userIdentifier = user?.email ||
        (user?.walletAddress ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` : 'User')

    return (
        <div className="bg-white border-b border-[#e5e7eb] h-20 flex items-center justify-between px-8 relative z-50">
            <div className="flex items-center gap-3">
                {/* Empty left side to maintain structure, or we can just render nothing if we only want right side */}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex flex-col text-right hidden sm:flex">
                    <p className="text-sm font-bold text-black leading-tight">{userIdentifier}</p>
                    <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mt-0.5">Verified</p>
                </div>

                <Link to="/settings" className="w-10 h-10 bg-[#fafafa] border border-[#e5e7eb] rounded-xl flex items-center justify-center shadow-sm hover:bg-[#f3f4f6] transition-colors">
                    <User size={18} className="text-[#09090b]" />
                </Link>
            </div>
        </div>
    )
}

