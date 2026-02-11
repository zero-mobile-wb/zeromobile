import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'

const BACKEND_URL = 'http://localhost:3000'

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
    bvn?: string // Added BVN field
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
    const { user } = usePrivy()
    const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([])
    const [hasCustomerAccount, setHasCustomerAccount] = useState(false)
    const [customerInfo, setCustomerInfo] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const userEmail = user?.email?.address

    const fetchAccounts = async () => {
        if (!userEmail) {
            console.log('[Banking] No user email available')
            return
        }

        setLoading(true)
        setError(null)

        try {
            console.log('[Banking] Fetching accounts for:', userEmail)
            const response = await fetch(`${BACKEND_URL}/api/afriex/accounts/${userEmail}`)
            const data = await response.json()

            if (response.ok) {
                setVirtualAccounts(data.accounts || [])
                setHasCustomerAccount(!!data.isCustomer)
                setCustomerInfo(data.customerInfo || null)
                console.log('[Banking] Accounts loaded:', data.accounts?.length || 0, 'Is Customer:', data.isCustomer)
            } else {
                // Don't throw error if accounts just don't exist yet, just set empty
                if (response.status === 404) {
                    setVirtualAccounts([])
                    setHasCustomerAccount(false)
                } else {
                    throw new Error(data.error || 'Failed to fetch accounts')
                }
            }
        } catch (err: any) {
            console.error('[Banking] Error fetching accounts:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const sendAuthOtp = async (email: string) => {
        console.log('[BankingContext] sendAuthOtp called with email:', email)
        setLoading(true)
        setError(null)
        try {
            console.log('[BankingContext] Fetching:', `${BACKEND_URL}/api/zero/auth/login`)
            const response = await fetch(`${BACKEND_URL}/api/zero/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const data = await response.json()
            console.log('[BankingContext] Response:', { ok: response.ok, status: response.status, data })
            if (!response.ok) throw new Error(data.error || 'Failed to send OTP')
            console.log('[BankingContext] OTP sent successfully')
        } catch (err: any) {
            console.error('[BankingContext] Error in sendAuthOtp:', err)
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const verifyAuthOtp = async (email: string, otp: string) => {
        console.log('[BankingContext] verifyAuthOtp called with:', { email, otp })
        console.log('[BankingContext] User wallet address:', user?.wallet?.address)
        setLoading(true)
        setError(null)
        try {
            const payload = {
                email,
                otp,
                walletAddress: user?.wallet?.address
            }
            console.log('[BankingContext] Sending verify request with payload:', payload)

            const response = await fetch(`${BACKEND_URL}/api/zero/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await response.json()
            console.log('[BankingContext] Verify response:', { ok: response.ok, status: response.status, data })

            if (response.ok) {
                console.log('[BankingContext] Verification successful!')

                if (data.warning) {
                    console.warn('[BankingContext] Warning during verification:', data.warning)
                    throw new Error(data.warning)
                }

                if (data.user?.virtualAccounts) {
                    setVirtualAccounts(data.user.virtualAccounts)
                }

                if (data.user?.afriexCustomerId) {
                    setHasCustomerAccount(true)
                }

                if (data.user?.personalInfo) {
                    setCustomerInfo(data.user.personalInfo)
                }

                await fetchAccounts()
                return data.user // Return user data for UI logic
            } else {
                console.error('[BankingContext] Verification failed:', data.error)
                throw new Error(data.error || 'Failed to verify OTP')
            }
        } catch (err: any) {
            console.error('[BankingContext] Error in verifyAuthOtp:', err)
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
            console.log('[BankingContext] Creating accounts with KYC data:', kycData)
            const response = await fetch(`${BACKEND_URL}/api/zero/auth/update-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kycData)
            })
            const data = await response.json()
            console.log('[BankingContext] Profile update response:', data)

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to create accounts')
            }

            // Update virtual accounts from response
            if (data.accounts) {
                setVirtualAccounts(data.accounts)
            }

            // Immediately update customer status if returned
            if (data.user?.afriexCustomerId) {
                setHasCustomerAccount(true)
            }
            if (data.user?.personalInfo) {
                setCustomerInfo(data.user.personalInfo)
            }

            // Refresh to ensure we have latest data
            await fetchAccounts()
        } catch (err: any) {
            console.error('[BankingContext] Error creating accounts:', err)
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
            console.log('[BankingContext] Creating virtual accounts only for:', userEmail)
            const response = await fetch(`${BACKEND_URL}/api/afriex/accounts/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            })
            const data = await response.json()
            console.log('[BankingContext] Account creation response:', data)

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to create accounts')
            }

            // Update virtual accounts from response
            if (data.accounts) {
                setVirtualAccounts(data.accounts)
            }

            await fetchAccounts()
        } catch (err: any) {
            console.error('[BankingContext] Error creating accounts:', err)
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const refreshBalances = async () => {
        await fetchAccounts()
    }

    // Fetch accounts when user email is available
    useEffect(() => {
        if (userEmail) {
            fetchAccounts()
        }
    }, [userEmail])

    return (
        <BankingContext.Provider
            value={{
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
            }}
        >
            {children}
        </BankingContext.Provider>
    )
}

export function useBanking() {
    const context = useContext(BankingContext)
    if (context === undefined) {
        throw new Error('useBanking must be used within a BankingProvider')
    }
    return context
}
