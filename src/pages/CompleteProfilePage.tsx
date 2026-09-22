import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/AuthContext'
import { profileApi } from '@/services/api'
import { Building2, CreditCard, Briefcase, CheckCircle2, Lock } from 'lucide-react'

export default function CompleteProfilePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [etablissements, setEtablissements] = useState<Array<{ id: number; nom: string }>>([])
  const [matricule, setMatricule] = useState('')
  const [etablissementId, setEtablissementId] = useState<number | ''>('')
  const [service, setService] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const [profileData, etabs] = await Promise.all([
          profileApi.checkComplete(),
          profileApi.getEtablissements(),
        ])
        setEtablissements(etabs)
        if (profileData.profil_complete) {
          navigate('/', { replace: true })
          return
        }
        if (etabs.length === 1) {
          setEtablissementId(etabs[0].id)
        }
      } catch {
        // silent
      } finally {
        setFetching(false)
      }
    }
    checkProfile()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matricule.trim() || !etablissementId || !newPassword) return
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await profileApi.complete({
        matricule: matricule.trim(),
        etablissement: etablissementId as number,
        service: service.trim() || undefined,
        new_password: newPassword,
      })
      // Update local user state
      if (result.user) {
        window.location.href = '/'
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la complétion du profil.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="w-8 h-8 border-2 border-medical-primary/30 border-t-medical-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-medical-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-medical-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Complétez votre profil
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Dernière étape avant d'accéder à SIM-BIOMED. Veuillez renseigner vos informations d'affectation.
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="matricule" className="input-label flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Matricule hospitalier *
              </label>
              <input
                id="matricule"
                type="text"
                className="input-field"
                placeholder="Ex: MAT-001"
                required
                autoFocus
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="etablissement" className="input-label flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Établissement *
              </label>
              {etablissements.length === 1 ? (
                <div className="input-field bg-slate-50 text-slate-700">{etablissements[0].nom}</div>
              ) : (
                <select
                  id="etablissement"
                  className="input-field"
                  required
                  value={etablissementId}
                  onChange={(e) => setEtablissementId(Number(e.target.value))}
                >
                  <option value="">Sélectionner un établissement</option>
                  {etablissements.map((e) => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="service" className="input-label flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Service d'affectation
              </label>
              <input
                id="service"
                type="text"
                className="input-field"
                placeholder="Ex: Cardiologie, Imagerie..."
                value={service}
                onChange={(e) => setService(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                Vous devez changer votre mot de passe temporaire avant de continuer.
              </p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="new_password" className="input-label flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Nouveau mot de passe *
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    className="input-field"
                    placeholder="Minimum 8 caractères"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirm_password" className="input-label flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Confirmer le mot de passe *
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    className="input-field"
                    placeholder="Retapez le mot de passe"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !matricule.trim() || !etablissementId || !newPassword || newPassword !== confirmPassword}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                'Valider et accéder à SIM-BIOMED'
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
