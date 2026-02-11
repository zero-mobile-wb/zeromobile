interface WalletInfoProps {
  clientWallet: any
  serverWallet: any | null
}

export default function WalletInfo({ clientWallet, serverWallet }: WalletInfoProps) {
  return (
    <div className="space-y-4">
      {/* Client Wallet */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Solana Wallet (Client)</h2>
        <p className="text-sm text-gray-600 break-all">
          <strong>Address:</strong> {clientWallet.address}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Chain:</strong> Solana
        </p>
      </div>

      {/* Server Wallet Info */}
      {serverWallet && (
        <div className="p-4 bg-purple-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Wallet Info from Server</h2>
          <p className="text-sm text-gray-600 break-all">
            <strong>Address:</strong> {serverWallet.address}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Balance:</strong> {serverWallet.balance} SOL
          </p>
          <p className="text-sm text-gray-600">
            <strong>Network:</strong> {serverWallet.network}
          </p>
          <a
            href={serverWallet.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View on Solana Explorer →
          </a>
        </div>
      )}
    </div>
  )
}
