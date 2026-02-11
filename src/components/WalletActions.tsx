interface WalletActionsProps {
  onFetchWallet: () => Promise<void>
  onRequestAirdrop: () => Promise<void>
  loading: boolean
}

export default function WalletActions({
  onFetchWallet,
  onRequestAirdrop,
  loading
}: WalletActionsProps) {
  return (
    <div className="flex gap-4 mt-4">
      <button
        onClick={onFetchWallet}
        disabled={loading}
        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : 'Get Wallet from Server'}
      </button>
      <button
        onClick={onRequestAirdrop}
        disabled={loading}
        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Requesting...' : 'Request Airdrop (2 SOL)'}
      </button>
    </div>
  )
}
