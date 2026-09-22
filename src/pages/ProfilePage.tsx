import { useAuth } from '@/app/AuthContext'
import { ROLE_LABELS } from '@/utils/permissions'
import { Shield, User, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1>Mon profil</h1>
        <p className="text-sm text-slate-500 mt-1">Informations de votre compte utilisateur.</p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center">
            <User className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
            </h2>
            <p className="text-sm text-slate-500">{user.email || user.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Identifiant</label>
            <p className="text-sm text-slate-900 font-mono">{user.username}</p>
          </div>
          <div>
            <label className="input-label">Rôle</label>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-600" />
              <span className="text-sm text-slate-900">{ROLE_LABELS[user.role] || user.role}</span>
            </div>
          </div>
          {user.first_name && (
            <div>
              <label className="input-label">Prénom</label>
              <p className="text-sm text-slate-900">{user.first_name}</p>
            </div>
          )}
          {user.last_name && (
            <div>
              <label className="input-label">Nom</label>
              <p className="text-sm text-slate-900">{user.last_name}</p>
            </div>
          )}
          {user.email && (
            <div>
              <label className="input-label">Email</label>
              <p className="text-sm text-slate-900">{user.email}</p>
            </div>
          )}
        </div>
      </div>

      <button onClick={logout} className="btn-danger">
        <LogOut className="w-4 h-4" /> Se déconnecter
      </button>
    </div>
  )
}
