interface UserInfoProps {
  user: any
  walletCount: number
}

export default function UserInfo({ user, walletCount }: UserInfoProps) {
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h2 className="text-xl font-semibold mb-2">User Info</h2>
      <p className="text-sm text-gray-600">User ID: {user?.id}</p>
      <p className="text-sm text-gray-600">
        Wallets: {walletCount} connected
      </p>
    </div>
  )
}
