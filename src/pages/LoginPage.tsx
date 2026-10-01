import { useState, useEffect } from 'react'
import { useAuth } from '@/app/AuthContext'
import { useNavigate } from 'react-router-dom'
import { demandesApi, WAKE_EVENT } from '@/services/api'
import { getApiErrorMessage, isServerUnavailable } from '@/utils/errors'
import { Activity, Wifi, Eye, EyeOff, KeyRound, UserPlus, CheckCircle2, ArrowLeft } from 'lucide-react'

const ROLES = [
  { value: 'TECHNICIEN', label: 'Technicien biomédical' },
  { value: 'PERSONNEL_SOIGNANT', label: 'Personnel soignant' },
  { value: 'DIRECTION', label: 'Direction' },
]

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'connexion' | 'demande'>('connexion')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [demandeSent, setDemandeSent] = useState(false)
  const [demandeLoading, setDemandeLoading] = useState(false)
  const [demandeError, setDemandeError] = useState('')
  const [demandeData, setDemandeData] = useState({
    nom_complet: '',
    email: '',
    role_souhaite: '',
    service: '',
    justification: '',
  })
  const { login } = useAuth()
  const navigate = useNavigate()
  const [waking, setWaking] = useState(false)

  useEffect(() => {
    const onWake = () => setWaking(true)
    window.addEventListener(WAKE_EVENT, onWake)
    return () => window.removeEventListener(WAKE_EVENT, onWake)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setWaking(false)
    setIsLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: unknown) {
      setWaking(false)
      if (isServerUnavailable(err)) {
        setError(
          'Le serveur est en cours de démarrage (hébergement gratuit, ~1 min après inactivité). Vos identifiants sont conservés, réessayez dans un instant.',
        )
      } else {
        setError(getApiErrorMessage(err, 'Identifiants incorrects. Vérifiez votre login et mot de passe.'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemande = async (e: React.FormEvent) => {
    e.preventDefault()
    setDemandeError('')
    setDemandeLoading(true)
    try {
      await demandesApi.submit(demandeData)
      setDemandeSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la soumission.'
      setDemandeError(msg)
    } finally {
      setDemandeLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-app-bg">
      {/* Left panel - Branding */}
      <aside className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden" style={{ backgroundColor: '#0b1329' }}>
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,100 L100,100 L120,100 L140,20 L160,180 L180,60 L200,140 L220,100 L400,100 L420,100 L440,20 L460,180 L480,60 L500,140 L520,100 L800,100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white"
              style={{ animation: 'ecgPulse 3s ease-in-out infinite' }}
            />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-12">
            <div className="w-12 h-12 rounded-xl bg-medical-primary flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="block text-2xl font-black tracking-tight">SIM-BIOMED</span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 mt-1 uppercase">
                v2.4 HDS — Système Intelligent de Maintenance Biomédicale
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-8">
            Des équipements en bon état,{' '}
            <span className="text-medical-primary">des soins de meilleure qualité.</span>
          </h1>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white">142 équipements</span> sous supervision
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-semibold text-white">92.3%</span> de disponibilité
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6">
            <span className="badge bg-white/10 text-white border-white/20 text-[10px]">HDS</span>
            <span className="badge bg-white/10 text-white border-white/20 text-[10px]">RGPD Santé</span>
            <span className="badge bg-white/10 text-white border-white/20 text-[10px]">ISO 13485</span>
          </div>
        </div>
      </aside>

      {/* Right panel - Auth form */}
      <main className="flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-medical-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="block text-xl font-black tracking-tight text-slate-900">SIM-BIOMED</span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                v2.4 HDS — Maintenance Biomédicale
              </span>
            </div>
          </div>

          {/* Tab switch */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setActiveTab('connexion'); setError(''); setDemandeError('') }}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ease-out ${
                activeTab === 'connexion'
                  ? 'border-medical-primary text-medical-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <KeyRound className="w-4 h-4 inline mr-1.5" /> Connexion
            </button>
            <button
              onClick={() => { setActiveTab('demande'); setError(''); setDemandeError('') }}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ease-out ${
                activeTab === 'demande'
                  ? 'border-medical-primary text-medical-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1.5" /> Demande d'accès
            </button>
          </div>

          {activeTab === 'connexion' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Se connecter</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Accédez à votre espace de supervision biomédicale.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {waking && isLoading && !error && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm" role="status">
                    Réveil du serveur en cours… Cela peut prendre jusqu'à une minute après une période d'inactivité.
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="input-label">Identifiant</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                    placeholder="Votre identifiant"
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="password" className="input-label">Mot de passe</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pr-10"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  className="btn-primary w-full mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {waking ? 'Réveil du serveur…' : 'Connexion...'}
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {demandeSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                    Demande envoyée
                  </h2>
                  <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                    Votre demande d'accès a bien été transmise. L'administrateur l'examinera
                    et vous recevrez une notification une fois votre compte activé.
                  </p>
                  <button
                    onClick={() => { setActiveTab('connexion'); setDemandeSent(false) }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-medical-primary hover:text-sky-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Demander un accès</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Soumettez votre demande. L'administrateur la validera avant activation.
                    </p>
                  </div>

                  <form onSubmit={handleDemande} className="space-y-4">
                    {demandeError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                        {demandeError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="demande-nom" className="input-label">Nom complet *</label>
                      <input
                        id="demande-nom"
                        type="text"
                        className="input"
                        placeholder="Jean Dupont"
                        required
                        value={demandeData.nom_complet}
                        onChange={(e) => setDemandeData({ ...demandeData, nom_complet: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="demande-email" className="input-label">Email professionnel *</label>
                      <input
                        id="demande-email"
                        type="email"
                        className="input"
                        placeholder="j.dupont@hopital.fr"
                        required
                        value={demandeData.email}
                        onChange={(e) => setDemandeData({ ...demandeData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="demande-role" className="input-label">Rôle souhaité *</label>
                      <select
                        id="demande-role"
                        className="input"
                        required
                        value={demandeData.role_souhaite}
                        onChange={(e) => setDemandeData({ ...demandeData, role_souhaite: e.target.value })}
                      >
                        <option value="">Sélectionner un rôle</option>
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="demande-service" className="input-label">Service d'affectation</label>
                      <input
                        id="demande-service"
                        type="text"
                        className="input"
                        placeholder="Ex: Cardiologie, Radiologie..."
                        value={demandeData.service}
                        onChange={(e) => setDemandeData({ ...demandeData, service: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="demande-justif" className="input-label">Justification *</label>
                      <textarea
                        id="demande-justif"
                        rows={3}
                        className="input"
                        placeholder="Décrivez votre besoin d'accès..."
                        required
                        value={demandeData.justification}
                        onChange={(e) => setDemandeData({ ...demandeData, justification: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={demandeLoading || !demandeData.nom_complet || !demandeData.email || !demandeData.role_souhaite || !demandeData.justification}
                      className="btn-primary w-full"
                    >
                      {demandeLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Envoi en cours...
                        </span>
                      ) : (
                        'Soumettre la demande'
                      )}
                    </button>
                  </form>
                </>
              )}
            </>
          )}

          <p className="text-xs text-slate-400 mt-8 text-center">
            Accès réservé au personnel habilité des services biomédicaux.
          </p>
        </div>
      </main>
    </div>
  )
}
