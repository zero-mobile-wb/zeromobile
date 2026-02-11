import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar, Navbar, BottomNav } from './layout'
import Settings from './Settings'

export default function DashboardLayout() {
    const location = useLocation()
    const navigate = useNavigate()

    // Determine active section from path
    // /dashboard -> 'dashboard'
    // /banking -> 'banking'
    // /portfolio -> 'portfolio'
    // /settings -> 'settings'
    const getActiveSection = (pathname: string) => {
        if (pathname === '/dashboard') return 'dashboard'
        if (pathname === '/zeroalpha') return 'zeroalpha'
        if (pathname === '/portfolio') return 'portfolio'
        if (pathname === '/settings') return 'settings'
        return 'dashboard'
    }

    const activeSection = getActiveSection(location.pathname)

    const handleSectionChange = (section: string) => {
        if (section === 'dashboard') navigate('/dashboard')
        else if (section === 'zeroalpha') navigate('/zeroalpha')
        else if (section === 'portfolio') navigate('/portfolio')
        else if (section === 'settings') navigate('/settings')
    }

    return (
        <div className="flex h-screen bg-white dark:bg-[#0a0a0b] text-gray-900 dark:text-white overflow-hidden transition-colors duration-300">
            {/* Sidebar - Hidden on mobile */}
            <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

                {/* Navbar */}
                <Navbar />

                {/* Content Area */}
                <main className="flex-1 px-0 md:px-1 pb-24 md:pb-8 relative z-10 overflow-y-auto">
                    <Outlet />
                </main>

                {/* Bottom Navigation - Mobile only */}
                <BottomNav activeSection={activeSection} setActiveSection={handleSectionChange} />
            </div>
        </div>
    )
}
