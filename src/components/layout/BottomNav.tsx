import { Home, Send, ArrowDownToLine, Settings, LayoutGrid, Briefcase } from 'lucide-react'

interface BottomNavProps {
    activeSection: string
    setActiveSection: (section: string) => void
}

export function BottomNav({ activeSection, setActiveSection }: BottomNavProps) {
    const navItems = [
        { id: 'dashboard', label: 'Wallet', icon: Home },
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
        { id: 'assets', label: 'Assets', icon: LayoutGrid },
        { id: 'settings', label: 'Settings', icon: Settings },
    ]

    return (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100]">
            <div className="bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden mx-auto max-w-lg">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeSection === item.id

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute top-0 w-8 h-1 bg-black dark:bg-white rounded-full shadow-[0_0_12px_rgba(0,0,0,0.4)] dark:shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
                                )}
                                <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[10px] mt-1 font-bold tracking-tighter uppercase transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
