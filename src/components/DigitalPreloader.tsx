import { useState, useEffect } from 'react'
import logo from '../assets/0.jpg'
import { useTheme } from '../context/ThemeContext'

export default function DigitalPreloader() {
    const [scale, setScale] = useState(0.5)

    useEffect(() => {
        // Pulsing and rotating animation
        const interval = setInterval(() => {
            setScale((prev: number) => {
                // Oscillate between 0.9 and 1.1
                if (prev >= 1.1) return 0.9
                return prev + 0.02
            })
        }, 50)

        return () => clearInterval(interval)
    }, [])

    const { theme } = useTheme()

    return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a0a0b] transition-colors duration-300">
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <img
                    src={logo}
                    alt="Loading..."
                    style={{ transform: `scale(${scale})` }}
                    className="w-32 h-32 md:w-40 md:h-40 object-contain transition-transform duration-75 ease-in-out rounded-2xl relative z-10"
                />
            </div>
        </div>
    )
}
