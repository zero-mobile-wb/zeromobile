import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'zero_auth_token'

export interface AuthUser {
    id: string
    email: string
    name?: string
    walletAddress?: string
    privateKey?: string
    virtualAccounts?: any[]
    afriexCustomerId?: string
    personalInfo?: any
    country?: string
}

interface AuthContextType {
    user: AuthUser | null
    token: string | null
    ready: boolean
    authenticated: boolean
    login: (email: string) => Promise<void>
    verify: (email: string, otp: string) => Promise<void>
    logout: () => void
    loading: boolean
    error: string | null
    clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [ready, setReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Restore session from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY)
        const savedUser = localStorage.getItem('zero_user')
        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser)
                setToken(savedToken)
                setUser(parsedUser)

                // Refresh data to get privateKey etc.
                console.log('[Auth] Restoring session for:', parsedUser.email)
                fetch(`${BACKEND_URL}/api/zero/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: parsedUser.email, otp: 'SESSION_RESTORE' })
                }).then(r => r.json()).then(data => {
                    if (data.user) {
                        console.log('[Auth] Session refreshed. PrivateKey exists:', !!data.user.privateKey)
                        const newUser = {
                            ...parsedUser,
                            privateKey: data.user.privateKey,
                            name: data.user.name,
                            country: data.user.country
                        }
                        setUser(newUser)
                        localStorage.setItem('zero_user', JSON.stringify(newUser))
                    }
                }).catch(err => console.error('[Auth] Refresh error:', err))

            } catch {
                localStorage.removeItem(TOKEN_KEY)
                localStorage.removeItem('zero_user')
            }
        }
        setReady(true)
    }, [])

    const login = async (email: string) => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${BACKEND_URL}/api/zero/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const verify = async (email: string, otp: string) => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${BACKEND_URL}/api/zero/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Verification failed')

            const authUser: AuthUser = {
                id: data.user?._id || data.user?.id || email,
                email: data.user?.email || email,
                name: data.user?.name || data.user?.personalInfo?.fullName,
                walletAddress: data.user?.walletAddress,
                privateKey: data.user?.privateKey,
                country: data.user?.country,
                virtualAccounts: data.user?.virtualAccounts,
                afriexCustomerId: data.user?.afriexCustomerId,
                personalInfo: data.user?.personalInfo,
            }

            const authToken = data.token || data.accessToken || 'authenticated'
            setUser(authUser)
            setToken(authToken)
            localStorage.setItem(TOKEN_KEY, authToken)
            localStorage.setItem('zero_user', JSON.stringify(authUser))
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('zero_user')
    }

    const clearError = () => setError(null)

    return (
        <AuthContext.Provider value={{
            user,
            token,
            ready,
            authenticated: !!user,
            login,
            verify,
            logout,
            loading,
            error,
            clearError,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
