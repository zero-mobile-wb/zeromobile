import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface VirtualAccount {
    currency: 'NGN' | 'USD' | 'GBP'
    accountNumber: string
    accountName: string
    bankName: string
    bankCode?: string
    afriexAccountId: string
    balance: number
    createdAt?: string
}

interface KYCData {
    email: string
    fullName: string
    phone: string
    dob: string
    address?: string
    city?: string
    state?: string
    countryCode?: string
    bvn?: string
}

interface BankingContextType {
    virtualAccounts: VirtualAccount[]
    loading: boolean
    error: string | null
    fetchAccounts: () => Promise<void>
    refreshBalances: () => Promise<void>
    sendAuthOtp: (email: string) => Promise<void>
    verifyAuthOtp: (email: string, otp: string) => Promise<void>
    createAccountsWithKYC: (kycData: KYCData) => Promise<void>
    createVirtualAccountsOnly: () => Promise<void>
    hasCustomerAccount: boolean
    customerInfo: any
}

const BankingContext = createContext<BankingContextType | undefined>(undefined)

export function BankingProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([])
    const [hasCustomerAccount, setHasCustomerAccount] = useState(false)
    const [customerInfo, setCustomerInfo] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const userEmail = user?.email

    const fetchAccounts = async () => {
        if (!userEmail) return
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${BACKEND_URL}/api/afriex/accounts/${userEmail}`)
            const data = await response.json()
            if (response.ok) {
                setVirtualAccounts(data.accounts || [])
                setHasCustomerAccount(!!data.isCustomer)
                setCustomerInfo(data.customerInfo || null)
            } else {
                if (response.status === 404) {
                    setVirtualAccounts([])
                    setHasCustomerAccount(false)
                } else {
                    throw new Error(data.error || 'Failed to fetch accounts')
                }
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const sendAuthOtp = async (email: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${BACKEND_URL}/api/zero/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to send OTP')
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const verifyAuthOtp = async (email: string, otp: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${BACKEND_URL}/api/zero/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            })
            const data = await response.json()

            if (response.ok) {
                if (data.warning) throw new Error(data.warning)
                if (data.user?.virtualAccounts) setVirtualAccounts(data.user.virtualAccounts)
                if (data.user?.afriexCustomerId) setHasCustomerAccount(true)
                if (data.user?.personalInfo) setCustomerInfo(data.user.personalInfo)
                await fetchAccounts()
                return data.user
            } else {
                throw new Error(data.error || 'Failed to verify OTP')
            }
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const createAccountsWithKYC = async (kycData: KYCData) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${BACKEND_URL}/api/zero/auth/update-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kycData)
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || data.message || 'Failed to create accounts')
            if (data.accounts) setVirtualAccounts(data.accounts)
            if (data.user?.afriexCustomerId) setHasCustomerAccount(true)
            if (data.user?.personalInfo) setCustomerInfo(data.user.personalInfo)
            await fetchAccounts()
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const createVirtualAccountsOnly = async () => {
        if (!userEmail) return
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${BACKEND_URL}/api/afriex/accounts/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || data.message || 'Failed to create accounts')
            if (data.accounts) setVirtualAccounts(data.accounts)
            await fetchAccounts()
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const refreshBalances = async () => {
        await fetchAccounts()
    }

    useEffect(() => {
        if (userEmail) fetchAccounts()
    }, [userEmail])

    return (
        <BankingContext.Provider value={{
            virtualAccounts,
            loading,
            error,
            fetchAccounts,
            refreshBalances,
            sendAuthOtp,
            verifyAuthOtp,
            createAccountsWithKYC,
            createVirtualAccountsOnly,
            hasCustomerAccount,
            customerInfo
        }}>
            {children}
        </BankingContext.Provider>
    )
}

export function useBanking() {
    const context = useContext(BankingContext)
    if (context === undefined) throw new Error('useBanking must be used within a BankingProvider')
    return context
}
