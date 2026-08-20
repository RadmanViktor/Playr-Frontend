import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0e14] text-[#39ff14]">
      <h1 className="text-xl">{`Welcome, ${user?.username ?? ''}_`}</h1>
      <button
        onClick={logout}
        className="border border-[#39ff14] px-4 py-2 uppercase tracking-wide hover:shadow-[0_0_8px_#39ff14]"
      >
        [ Logout ]
      </button>
    </div>
  )
}
