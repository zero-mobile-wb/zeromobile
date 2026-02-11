import { User, Sun, Moon } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { useTheme } from '../../context/ThemeContext'
import logo from '../../assets/0.jpg'

export function Navbar() {
    const { user } = usePrivy()

    // Get user display identifier (email or wallet)
    const userIdentifier = user?.email?.address ||
        (user?.wallet?.address ? `${user.wallet.address.slice(0, 4)}...${user.wallet.address.slice(-4)}` : 'User')

    const { theme, toggleTheme } = useTheme()

    return (
        <div className="bg-white dark:bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 h-20 flex items-center justify-between px-6 md:px-8 relative z-50">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-gray-300 dark:border-white/10 shadow-none overflow-hidden">
                        <img src={logo} alt="Zero Mobile" className="w-full h-full object-cover" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-0.5">Workspace</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Zero Mobile Dashboard</span>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-300 dark:border-white/10 shadow-none"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <div className="flex flex-col text-right hidden sm:flex">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{userIdentifier}</p>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-tight">Mainnet-Beta</p>
                </div>

                <button className="relative group">
                    <div className="absolute inset-0 bg-blue-500/10 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-2xl flex items-center justify-center relative z-10 transition-transform active:scale-95 shadow-none">
                        <User size={20} className="text-gray-600 dark:text-gray-300" />
                    </div>
                </button>
            </div>
        </div>
    )
}
