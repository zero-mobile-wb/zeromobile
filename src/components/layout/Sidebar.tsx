import { Home, Settings, LayoutGrid, LogOut, Shield, Trophy, Send, QrCode } from 'lucide-react'
import logo from '../../assets/icon.png'
import { useAuth } from '../../context/AuthContext'

interface SidebarProps {
    activeSection: string
    onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
    const { logout } = useAuth()

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'send', label: 'Send', icon: Send },
        { id: 'receive', label: 'Receive', icon: QrCode },
        { id: 'zeroalpha', label: 'ZeroAlpha', icon: Trophy },
        { id: 'portfolio', label: 'Portfolio', icon: LayoutGrid },
        { id: 'settings', label: 'Settings', icon: Settings },
    ]

    return (
        <div className="hidden md:flex w-72 bg-white h-screen flex-col border-r border-[#e5e7eb] relative z-[60]">
            {/* Brand Section */}
            <div className="p-8 pb-10">
                <div className="flex items-center gap-3.5 group cursor-pointer">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-[#e5e7eb] shadow-sm">
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-[#09090b] tracking-tight leading-none mb-1">Zero</h1>
                        <div className="flex items-center gap-1.5">
                            <Shield size={10} className="text-[#09090b]" />
                            <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Secure Node</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Navigation */}
            <nav className="flex-1 px-5 space-y-2">
                <p className="px-3 text-[10px] font-bold text-[#9ca3af] dark:text-[rgba(255,255,255,0.3)] uppercase tracking-[0.18em] mb-4">Main Menu</p>
                <ul className="space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeSection === item.id

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onSectionChange(item.id)}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive
                                        ? 'bg-[#09090b] text-white shadow-md shadow-black/5'
                                        : 'text-[#6b7280] hover:text-[#09090b] hover:bg-[#f9fafb]'
                                        }`}
                                >
                                    <Icon
                                        size={20}
                                        strokeWidth={isActive ? 2.5 : 2}
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
                    className="w-full flex items-center gap-3 px-6 py-4 bg-white hover:bg-[#fafafa] border border-[#e5e7eb] rounded-2xl text-[#ef4444] transition-all duration-300 group shadow-sm"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold tracking-tight">Sign Out</span>
                </button>
            </div>
        </div>
    )
}

