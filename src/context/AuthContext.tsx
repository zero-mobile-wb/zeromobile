import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import CryptoJS from 'crypto-js'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'zero_auth_token'
const VAULT_KEY = 'zero_vault'

export interface AuthUser {
    id: string
    email: string
    name?: string
    walletAddress?: string
    privateKey?: string // Temporarily in RAM
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

    // Vault API
    isWalletLocked: boolean
    requiresPasskeySetup: boolean
    unlockWithPasskey: () => Promise<boolean>
    lockWallet: () => void
    setupPasskey: (keyToEncrypt?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [ready, setReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [isWalletLocked, setIsWalletLocked] = useState(false)
    const [requiresPasskeySetup, setRequiresPasskeySetup] = useState(false)

    const storeUserSafely = (u: AuthUser) => {
        const safeUser = { ...u }
        delete safeUser.privateKey
        localStorage.setItem('zero_user', JSON.stringify(safeUser))
    }

    // Restore session from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY)
        const savedUser = localStorage.getItem('zero_user')
        const cleanBackend = BACKEND_URL.replace(/\/+$/, '')

        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser)
                setToken(savedToken)
                setUser(parsedUser)

                const vaultData = localStorage.getItem(VAULT_KEY)
                if (vaultData) {
                    setIsWalletLocked(true)
                    setRequiresPasskeySetup(false)
                } else {
                    setRequiresPasskeySetup(false)
                }

                console.log('[Auth] Restoring session for:', parsedUser.email)
                fetch(`${cleanBackend}/api/zero/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: parsedUser.email, otp: 'SESSION_RESTORE' })
                }).then(r => r.json()).then(data => {
                    if (data.user) {
                        const newUser = {
                            ...parsedUser,
                            name: data.user.name,
                            country: data.user.country
                        }

                        if (data.user.privateKey && !vaultData) {
                            newUser.privateKey = data.user.privateKey
                            setRequiresPasskeySetup(true)
                        } else if (vaultData) {
                            setIsWalletLocked(true)
                        }

                        setUser(newUser)
                        storeUserSafely(newUser)
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
        const cleanBackend = BACKEND_URL.replace(/\/+$/, '')
        try {
            const res = await fetch(`${cleanBackend}/api/zero/auth/login`, {
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
        const cleanBackend = BACKEND_URL.replace(/\/+$/, '')
        try {
            const res = await fetch(`${cleanBackend}/api/zero/auth/verify`, {
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
            storeUserSafely(authUser)

            if (authUser.privateKey) {
                const vaultData = localStorage.getItem(VAULT_KEY)
                if (vaultData) {
                    setIsWalletLocked(true)
                    setRequiresPasskeySetup(false)
                    setUser(prev => prev ? { ...prev, privateKey: undefined } : null)
                } else {
                    setRequiresPasskeySetup(true)
                    setIsWalletLocked(false)
                }
            } else {
                setRequiresPasskeySetup(false)
                setIsWalletLocked(false)
            }

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
        setIsWalletLocked(false)
        setRequiresPasskeySetup(false)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('zero_user')
        localStorage.removeItem(VAULT_KEY)
    }

    const encodeBuffer = (buffer: ArrayBuffer | Uint8Array) => {
        const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        return btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const setupPasskey = async (keyToEncrypt?: string) => {
        // Fallback to a mock payload if the user has no private key yet so they can still test the UI flow
        const targetKey = keyToEncrypt || user?.privateKey || "mock_shard_3_payload_for_passkey_demo";

        try {
            const userId = new Uint8Array(16);
            crypto.getRandomValues(userId);

            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // 32-byte salt for PRF
            const salt = new Uint8Array(32);
            crypto.getRandomValues(salt);

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "Zero Alpha", id: window.location.hostname },
                    user: {
                        id: userId,
                        name: user?.email || "user@zero.finance",
                        displayName: user?.name || "Zero Vault User",
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                    authenticatorSelection: {
                        // Removed authenticatorAttachment: "platform" to allow mobile phones and YubiKeys on Linux desktops
                        userVerification: "required",
                        residentKey: "preferred",
                    },
                    timeout: 60000,
                    extensions: {
                        prf: {
                            eval: { first: salt }
                        }
                    }
                }
            }) as any;

            if (!credential) throw new Error("Passkey setup failed");

            // Extract PRF result or fallback to hashing the rawId
            let symmetricKey = "";
            const prfResults = credential.getClientExtensionResults?.()?.prf;
            if (prfResults?.results?.first) {
                const prfKey = new Uint8Array(prfResults.results.first);
                symmetricKey = Array.from(prfKey).map(b => b.toString(16).padStart(2, '0')).join('');
            } else {
                symmetricKey = encodeBuffer(credential.rawId) + "fallback"; // basic fallback ID
            }

            const cipherText = CryptoJS.AES.encrypt(targetKey, symmetricKey).toString();

            // We store the encrypted text, the credential ID (so we can ask for it during get), and salt
            const vaultData = {
                cipherText,
                credentialId: encodeBuffer(credential.rawId),
                salt: encodeBuffer(salt)
            };

            localStorage.setItem(VAULT_KEY, JSON.stringify(vaultData));
            setRequiresPasskeySetup(false);
            setIsWalletLocked(false);

            if (targetKey !== "mock_shard_3_payload_for_passkey_demo") {
                setUser(prev => prev ? { ...prev, privateKey: targetKey } : null);
            }
        } catch (err: any) {
            console.error("Setup Passkey Error:", err);
            throw err;
        }
    }

    const unlockWithPasskey = async (): Promise<boolean> => {
        const vaultStr = localStorage.getItem(VAULT_KEY);
        if (!vaultStr) return false;

        try {
            const vaultData = JSON.parse(vaultStr);
            if (!vaultData.cipherText || !vaultData.credentialId) return false;

            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            let saltBuffer: Uint8Array | undefined;
            if (vaultData.salt) {
                const binaryStr = atob(vaultData.salt.replace(/-/g, '+').replace(/_/g, '/'));
                saltBuffer = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    saltBuffer[i] = binaryStr.charCodeAt(i);
                }
            }

            const getOptions: any = {
                publicKey: {
                    challenge,
                    rpId: window.location.hostname,
                    userVerification: "required",
                    timeout: 60000,
                }
            };

            if (saltBuffer) {
                getOptions.publicKey.extensions = {
                    prf: {
                        eval: { first: saltBuffer }
                    }
                };
            }

            const assertion = await navigator.credentials.get(getOptions) as any;
            if (!assertion) return false;

            let symmetricKey = "";
            const prfResults = assertion.getClientExtensionResults?.()?.prf;
            if (prfResults?.results?.first) {
                const prfKey = new Uint8Array(prfResults.results.first);
                symmetricKey = Array.from(prfKey).map(b => b.toString(16).padStart(2, '0')).join('');
            } else {
                symmetricKey = encodeBuffer(assertion.rawId) + "fallback";
            }

            const bytes = CryptoJS.AES.decrypt(vaultData.cipherText, symmetricKey);
            const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedKey) return false;

            if (decryptedKey !== "mock_shard_3_payload_for_passkey_demo") {
                setUser(prev => prev ? { ...prev, privateKey: decryptedKey } : null);
            }

            setIsWalletLocked(false);
            return true;
        } catch (e) {
            console.error("Unlock Error:", e);
            return false;
        }
    }

    const lockWallet = () => {
        setIsWalletLocked(true);
        if (user) {
            setUser({ ...user, privateKey: undefined });
        }
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
            isWalletLocked,
            requiresPasskeySetup,
            unlockWithPasskey,
            lockWallet,
            setupPasskey
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
