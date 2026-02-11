import { Home, Settings, LayoutGrid, LogOut, Shield, Trophy } from 'lucide-react'
import logo from '../../assets/0.jpg'
import { usePrivy } from '@privy-io/react-auth'

interface SidebarProps {
    activeSection: string
    onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
    const { logout } = usePrivy()

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'zeroalpha', label: 'ZeroAlpha', icon: Trophy },
        { id: 'portfolio', label: 'Portfolio', icon: LayoutGrid },
        { id: 'settings', label: 'Settings', icon: Settings },
    ]

    return (
        <div className="hidden md:flex w-72 bg-white dark:bg-[#0a0a0b] h-screen flex-col border-r border-gray-100 dark:border-white/5 relative z-[60]">
            {/* Brand Section */}
            <div className="p-8 pb-12">
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-white/5 rounded-lg flex items-center justify-center border border-gray-300 dark:border-white/10 shadow-none">
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Zero Mobile</h1>
                        <div className="flex items-center gap-1.5">
                            <Shield size={10} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Secure Node</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-4">Main Menu</p>
                <ul className="space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeSection === item.id

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onSectionChange(item.id)}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${isActive
                                        ? 'bg-gray-200 dark:bg-white/5 text-gray-900 dark:text-white shadow-none'
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.02]'
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full" />
                                    )}
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`transition-colors ${isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-400'}`}
                                    />
                                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Bottom Profile/Actions */}
            <div className="p-6">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-6 py-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl text-red-400 transition-all duration-300 group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">Sign Out</span>
                </button>
            </div>
        </div>
    )
}
