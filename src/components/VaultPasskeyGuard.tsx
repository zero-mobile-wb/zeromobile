import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VaultPasskeyGuard({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const { isWalletLocked, requiresPasskeySetup, setupPasskey, unlockWithPasskey, logout } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSetup, setShowSetup] = useState(false);

    useEffect(() => {
        if (requiresPasskeySetup && !isWalletLocked) {
            setShowSetup(true);
        } else {
            setShowSetup(false);
        }
    }, [requiresPasskeySetup, isWalletLocked]);

    const handleUnlock = async () => {
        try {
            setLoading(true);
            const success = await unlockWithPasskey();
            if (!success) {
                setError('Passkey unlock failed or was cancelled');
            }
        } catch (e) {
            setError('Error unlocking with passkey');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup = async () => {
        try {
            setLoading(true);
            await setupPasskey();
            setShowSetup(false);
        } catch (e) {
            console.error("Passkey setup error", e);
        } finally {
            setLoading(false);
        }
    };

    // If wallet is locked, explicitly block the UI
    if (isWalletLocked) {
        return (
            <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-neutral-800">
                <div className="max-w-sm w-full bg-neutral-900/50 border border-neutral-800/80 backdrop-blur-xl rounded-3xl p-6 text-center shadow-2xl">
                    <h2 className="text-xl font-semibold mb-1 font-['Inter'] tracking-tight">Unlock Vault</h2>
                    <p className="text-neutral-400 mb-6 text-xs leading-relaxed px-2">
                        Use your device's Passkey (Face ID/Touch ID) to unlock your secure session.
                    </p>

                    {error && <p className="text-red-400 mb-4 text-xs font-medium animate-pulse">{error}</p>}

                    <button
                        onClick={handleUnlock}
                        disabled={loading}
                        className="w-full bg-white text-black font-semibold py-3 rounded-2xl hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed mb-4 shadow-xl"
                    >
                        {loading ? 'Unlocking...' : 'Unlock with Passkey'}
                    </button>

                    <button
                        onClick={logout}
                        className="w-full py-2 text-xs font-medium text-neutral-500 hover:text-white transition-colors"
                    >
                        Forgot Passkey? Reset Session
                    </button>
                </div>
            </div>
        );
    }

    // If NOT locked, render the application routes
    return (
        <>
            {children}

            {/* Overlay a popup if they need to setup a Passkey but haven't yet */}
            {requiresPasskeySetup && showSetup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full bg-[#111111] border border-neutral-800 rounded-[2rem] p-8 text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
                        {/* Close Button / Remind Later */}
                        <button
                            onClick={() => setShowSetup(false)}
                            className="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center bg-neutral-800/50 rounded-full"
                        >
                            ✕
                        </button>

                        <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl border border-neutral-700">
                            🛡️
                        </div>
                        <h2 className="text-xl font-black tracking-tight mb-2 uppercase">Action Required</h2>
                        <p className="text-[#6b7280] text-xs mb-8 px-2 uppercase font-bold tracking-widest leading-relaxed">
                            For maximum security on web, please encrypt your session with a Passkey (Face ID/Touch ID).
                        </p>

                        <button
                            onClick={handleSetup}
                            disabled={loading}
                            className="w-full bg-white text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-xl mb-4 hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'Setting up...' : 'Setup Passkey'}
                        </button>
                        <button
                            onClick={() => setShowSetup(false)}
                            className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Remind me later
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
