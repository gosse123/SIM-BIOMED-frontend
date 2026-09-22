import { useState, useEffect, useCallback, useRef } from 'react'
import { usersApi } from '@/services/api'
import type { User } from '@/types/auth'
import { ROLE_LABELS, ROLE_COLORS } from '@/utils/permissions'
import { isAdmin } from '@/utils/permissions'
import { useAuth } from '@/app/AuthContext'
import PageHeader from '@/components/ui/PageHeader'
import SearchInput from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/FeedbackStates'
import {
  UserPlus,
  Shield,
  UserX,
  ChevronDown,
  X,
  Check,
  Users,
  ArrowRight,
} from 'lucide-react'

const AVAILABLE_ROLES = [
  { value: 'TECHNICIEN', label: 'Technicien biomédical', desc: 'Diagnostic, réparation, tests' },
  { value: 'PERSONNEL_SOIGNANT', label: 'Personnel soignant', desc: 'Signalement de pannes' },
  { value: 'DIRECTION', label: 'Direction', desc: 'Indicateurs et rapports' },
  { value: 'RESPONSABLE_BIOMEDICAL', label: 'Responsable biomédical', desc: 'Gestion complète du parc' },
] as const

function UserRow({
  user: u,
  isCurrentUser,
  onDeactivate,
  onChangeRole,
}: {
  user: User
  isCurrentUser: boolean
  onDeactivate: (u: User) => void
  onChangeRole: (u: User, role: string) => void
}) {
  const [roleOpen, setRoleOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sm font-bold text-sky-700 shrink-0">
            {u.first_name?.[0]}{u.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
            </p>
            <p className="text-xs text-slate-500 truncate">{u.username}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => !isCurrentUser && setRoleOpen(!roleOpen)}
            disabled={isCurrentUser}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${ROLE_COLORS[u.role]} ${isCurrentUser ? 'cursor-default' : 'hover:shadow-sm cursor-pointer'}`}
          >
            <Shield className="w-3 h-3" />
            {ROLE_LABELS[u.role]}
            {!isCurrentUser && <ChevronDown className={`w-3 h-3 transition-transform ${roleOpen ? 'rotate-180' : ''}`} />}
          </button>
          {roleOpen && (
            <div className="absolute z-20 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-in fade-in slide-in-from-top-1">
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { onChangeRole(u, key); setRoleOpen(false) }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2.5 transition-colors ${u.role === key ? 'font-semibold text-medical-primary bg-sky-50/50' : 'text-slate-700'}`}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                  {u.role === key && <Check className="w-3.5 h-3.5 ml-auto text-medical-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {u.is_active ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-500">{u.email || '—'}</td>
      <td className="px-5 py-3.5 text-right">
        {!isCurrentUser && u.is_active && (
          <button
            onClick={() => onDeactivate(u)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Désactiver"
          >
            <UserX className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  )
}

function CreateUserPanel({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [createData, setCreateData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'TECHNICIEN' as string,
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }))

  const fieldError = (field: string): string | null => {
    if (!touched[field]) return null
    switch (field) {
      case 'username':
        if (!createData.username.trim()) return 'Identifiant requis'
        if (createData.username.length < 3) return 'Minimum 3 caractères'
        return null
      case 'email':
        if (!createData.email.trim()) return 'Email requis'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createData.email)) return 'Email invalide'
        return null
      case 'password':
        if (!createData.password) return 'Mot de passe requis'
        if (createData.password.length < 8) return 'Minimum 8 caractères'
        return null
      case 'first_name':
        if (!createData.first_name.trim()) return 'Prénom requis'
        return null
      case 'last_name':
        if (!createData.last_name.trim()) return 'Nom requis'
        return null
      default:
        return null
    }
  }

  const hasErrors = ['username', 'email', 'password', 'first_name', 'last_name'].some((f) => fieldError(f))
  const isFormValid = createData.username.trim() && createData.email.trim() && createData.password.length >= 8 && createData.first_name.trim() && createData.last_name.trim()

  const handleCreate = async () => {
    setTouched({ username: true, email: true, password: true, first_name: true, last_name: true })
    if (hasErrors || !isFormValid) return

    setCreating(true)
    setError('')
    try {
      await usersApi.create(createData)
      onCreated()
      setCreateData({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'TECHNICIEN' })
      setTouched({})
      onClose()
    } catch {
      setError('Erreur lors de la création. Vérifiez les informations.')
    } finally {
      setCreating(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 flex flex-col bg-white shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-medical-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-medical-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Nouvel utilisateur</h2>
              <p className="text-xs text-slate-500">Créer un compte et attribuer un rôle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto shrink-0"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="space-y-6">
            {/* Section: Identité */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Identité</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Prénom *</label>
                  <input
                    className={`input-field ${fieldError('first_name') ? 'border-red-300 focus:ring-red-500' : ''}`}
                    value={createData.first_name}
                    onChange={(e) => setCreateData({ ...createData, first_name: e.target.value })}
                    onBlur={() => markTouched('first_name')}
                    placeholder="Jean"
                  />
                  {fieldError('first_name') && <p className="text-xs text-red-500 mt-1">{fieldError('first_name')}</p>}
                </div>
                <div>
                  <label className="input-label">Nom *</label>
                  <input
                    className={`input-field ${fieldError('last_name') ? 'border-red-300 focus:ring-red-500' : ''}`}
                    value={createData.last_name}
                    onChange={(e) => setCreateData({ ...createData, last_name: e.target.value })}
                    onBlur={() => markTouched('last_name')}
                    placeholder="Dupont"
                  />
                  {fieldError('last_name') && <p className="text-xs text-red-500 mt-1">{fieldError('last_name')}</p>}
                </div>
              </div>
            </div>

            {/* Section: Accès */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Accès</h3>
              <div className="space-y-3">
                <div>
                  <label className="input-label">Identifiant *</label>
                  <input
                    className={`input-field ${fieldError('username') ? 'border-red-300 focus:ring-red-500' : ''}`}
                    value={createData.username}
                    onChange={(e) => setCreateData({ ...createData, username: e.target.value })}
                    onBlur={() => markTouched('username')}
                    placeholder="jdupont"
                    autoComplete="username"
                  />
                  {fieldError('username') && <p className="text-xs text-red-500 mt-1">{fieldError('username')}</p>}
                </div>
                <div>
                  <label className="input-label">Email *</label>
                  <input
                    type="email"
                    className={`input-field ${fieldError('email') ? 'border-red-300 focus:ring-red-500' : ''}`}
                    value={createData.email}
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                    onBlur={() => markTouched('email')}
                    placeholder="j.dupont@hopital.fr"
                    autoComplete="email"
                  />
                  {fieldError('email') && <p className="text-xs text-red-500 mt-1">{fieldError('email')}</p>}
                </div>
                <div>
                  <label className="input-label">Mot de passe *</label>
                  <input
                    type="password"
                    className={`input-field ${fieldError('password') ? 'border-red-300 focus:ring-red-500' : ''}`}
                    value={createData.password}
                    onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                    onBlur={() => markTouched('password')}
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                  />
                  {fieldError('password') && <p className="text-xs text-red-500 mt-1">{fieldError('password')}</p>}
                  {touched.password && !fieldError('password') && createData.password && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mot de passe valide
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Rôle */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Rôle</h3>
              <div className="grid grid-cols-1 gap-2">
                {AVAILABLE_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setCreateData({ ...createData, role: role.value })}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      createData.role === role.value
                        ? 'border-medical-primary bg-sky-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      createData.role === role.value ? 'bg-medical-primary/10' : 'bg-slate-100'
                    }`}>
                      <Shield className={`w-4 h-4 ${createData.role === role.value ? 'text-medical-primary' : 'text-slate-500'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${createData.role === role.value ? 'text-medical-primary' : 'text-slate-900'}`}>
                        {role.label}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{role.desc}</p>
                    </div>
                    {createData.role === role.value && (
                      <div className="w-5 h-5 rounded-full bg-medical-primary flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Un email de bienvenue sera envoyé avec le mot de passe temporaire.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="btn-secondary text-sm">
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !isFormValid}
                className="btn-primary text-sm"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Créer l'utilisateur
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await usersApi.list()
      setUsers(data)
    } catch {
      setError('Erreur lors du chargement des utilisateurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    try {
      await usersApi.deactivate(deactivateTarget.id)
      setDeactivateTarget(null)
      fetchUsers()
    } catch {
      setError('Erreur lors de la désactivation.')
    }
  }

  const handleChangeRole = async (u: User, role: string) => {
    try {
      await usersApi.setRole(u.id, role)
      fetchUsers()
    } catch {
      setError('Erreur lors du changement de rôle.')
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.username.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  })

  if (!isAdmin(currentUser)) {
    return (
      <div className="space-y-6">
        <EmptyState title="Accès refusé" description="Seul un administrateur peut gérer les utilisateurs." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        description={`${users.length} utilisateur${users.length !== 1 ? 's' : ''} enregistré${users.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" /> Nouvel utilisateur
          </button>
        }
      />

      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un utilisateur..." />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-sm text-red-700 flex items-center gap-2">
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td colSpan={5} className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-slate-100 rounded w-28 animate-pulse" />
                          <div className="h-3 bg-slate-50 rounded w-20 animate-pulse" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {search ? 'Aucun résultat' : 'Aucun utilisateur'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {search ? 'Essayez une autre recherche.' : 'Commencez par ajouter un utilisateur.'}
                        </p>
                      </div>
                      {!search && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm mt-1">
                          <UserPlus className="w-4 h-4" /> Ajouter un utilisateur
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isCurrentUser={u.id === currentUser?.id}
                    onDeactivate={setDeactivateTarget}
                    onChangeRole={handleChangeRole}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Panel */}
      <CreateUserPanel
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchUsers}
      />

      {/* Deactivate Confirm Modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Désactiver l'utilisateur</h2>
            <p className="text-sm text-slate-600">
              Voulez-vous vraiment désactiver <strong>{deactivateTarget.username}</strong> ? Cette personne ne pourra plus se connecter.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeactivateTarget(null)} className="btn-secondary">Annuler</button>
              <button onClick={handleDeactivate} className="btn-danger">Désactiver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
