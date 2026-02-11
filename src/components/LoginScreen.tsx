import { useState, useEffect } from 'react'
import logo from '../assets/0.jpg'
import { useTheme } from '../context/ThemeContext'

interface LoginScreenProps {
    onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        setIsLoaded(true)
    }, [])

    const { theme } = useTheme()

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

            <div className={`w-full max-w-md transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Branding */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-black/5 dark:bg-white/5 p-1 rounded-2xl backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl mb-6 flex items-center justify-center">
                        <img
                            src={logo}
                            alt="Zero Mobile"
                            className="w-16 h-16 object-contain rounded-xl"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Zero Mobile</h1>
                    <p className="text-gray-400 mt-2 text-center text-sm">
                        The next generation of private digital assets.
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-gray-100 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-none dark:shadow-2xl relative overflow-hidden">

                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
                            <p className="text-gray-400 text-sm">Sign in to securely manage your wallet.</p>
                        </div>

                        <button
                            onClick={onLogin}
                            className="w-full py-4 px-6 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-semibold text-sm shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            <span>Login with Privy</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                        <span>Powered by</span>
                        <span className="text-gray-300 font-medium">Privy</span>
                        <span className="w-1 h-1 bg-gray-700 rounded-full" />
                        <span>Secure & Non-custodial</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
