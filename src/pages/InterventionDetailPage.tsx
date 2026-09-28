import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { interventionApi } from '@/services/intervention'
import type { Intervention } from '@/types/intervention'
import { TYPE_INTERVENTION_LABELS, STATUT_INTERVENTION_LABELS } from '@/types/intervention'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates'
import { ConfirmDialog } from '@/components/ui/Modal'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { toast } from '@/components/ui/toast'
import { getApiErrorMessage } from '@/utils/errors'
import { Play, CheckCircle2, Calendar, User, Wrench, Link2 } from 'lucide-react'

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default function InterventionDetailPage() {
  const { id } = useParams()
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showStart, setShowStart] = useState(false)
  const [showFinish, setShowFinish] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [finishTemps, setFinishTemps] = useState('')
  const [finishPieces, setFinishPieces] = useState('')
  const [finishRepare, setFinishRepare] = useState(false)

  const loadIntervention = async (interventionId: number) => {
    setIsLoading(true)
    try {
      const data = await interventionApi.get(interventionId)
      if (!data || !data.id) throw new Error('not found')
      setIntervention(data)
      setError('')
    } catch {
      setError('Intervention introuvable.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { if (id) loadIntervention(Number(id)) }, [id])

  const executeAction = async (fn: () => Promise<unknown>) => {
    setActionLoading(true)
    try {
      await fn()
      if (id) await loadIntervention(Number(id))
      toast('success', 'Action effectuée avec succès')
    } catch (err) {
      toast('error', getApiErrorMessage(err, "Erreur lors de l'action."))
    } finally {
      setActionLoading(false)
    }
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    await executeAction(() =>
      interventionApi.finish(Number(id), {
        temps_passe_minutes: Number(finishTemps),
        pieces_utilisees: finishPieces || undefined,
        repare_totalement: finishRepare,
      }),
    )
    setShowFinish(false)
  }

  if (isLoading) return <LoadingState />
  if (error || !intervention) return <ErrorState message={error || 'Intervention introuvable.'} onRetry={() => loadIntervention(Number(id))} />

  const isPlanifiee = intervention.statut === 'PLANIFIEE'
  const isEnCours = intervention.statut === 'EN_COURS'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Intervention #${intervention.id}`}
        breadcrumbs={[
          { label: 'Interventions', href: '/interventions' },
          { label: `#${intervention.id}` },
        ]}
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600">
              {TYPE_INTERVENTION_LABELS[intervention.type_intervention]}
            </span>
            <StatusBadge status={intervention.statut} size="md" />
          </div>
        }
      />

      {/* Action principale */}
      {(isPlanifiee || isEnCours) && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {isPlanifiee
                ? "Intervention planifiée : démarrez-la au début de l'intervention sur le terrain."
                : 'Intervention en cours : renseignez le temps passé et les pièces à la fin.'}
            </p>
            <div className="flex items-center gap-2">
              {isPlanifiee && (
                <button onClick={() => setShowStart(true)} disabled={actionLoading} className="btn-primary text-xs">
                  <Play className="w-4 h-4" /> Démarrer
                </button>
              )}
              {isEnCours && (
                <button onClick={() => setShowFinish(true)} disabled={actionLoading} className="btn-primary text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Terminer
                </button>
              )}
              <button
                onClick={() => setShowCancel(true)}
                disabled={actionLoading}
                className="btn-ghost text-xs text-red-600 hover:text-red-700"
              >
                Annuler l'intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {intervention.statut === 'TERMINEE' && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
          <p className="text-xs text-emerald-800">
            <strong className="font-semibold">Intervention terminée</strong> le {formatDateTime(intervention.date_fin)}.
            {intervention.panne_id && ' La panne liée reste ouverte jusqu’à son test de clôture (RB-CL-001).'}
          </p>
        </div>
      )}

      {intervention.statut === 'ANNULEE' && (
        <div className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded-r-lg">
          <p className="text-xs text-slate-600">Intervention annulée — aucune action possible.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            <h2>Actions réalisées</h2>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{intervention.description}</p>

          {intervention.pieces_utilisees && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Pièces consommées</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{intervention.pieces_utilisees}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="block text-xs text-slate-500">Temps passé</span>
              <span className="font-medium text-slate-900">
                {intervention.temps_passe_minutes ? `${intervention.temps_passe_minutes} min` : '—'}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Type</span>
              <span className="font-medium text-slate-900">{TYPE_INTERVENTION_LABELS[intervention.type_intervention]}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Statut</span>
              <span className="font-medium text-slate-900">{STATUT_INTERVENTION_LABELS[intervention.statut]}</span>
            </div>
          </div>
        </div>

        {/* Suivi */}
        <div className="space-y-6">
          <div className="card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <h2>Suivi</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Créée le</dt>
                <dd className="text-slate-800 text-right">{formatDateTime(intervention.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Démarrée le</dt>
                <dd className="text-slate-800 text-right">{formatDateTime(intervention.date_debut)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Terminée le</dt>
                <dd className="text-slate-800 text-right">{formatDateTime(intervention.date_fin)}</dd>
              </div>
            </dl>
            {intervention.realisee_par_nom && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-sm text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                {intervention.realisee_par_nom}
              </div>
            )}
          </div>

          <div className="card p-6 space-y-3">
            <h2>Équipement</h2>
            <Link
              to={`/equipment/${intervention.equipement}`}
              className="flex items-center justify-between gap-2 text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              {intervention.equipement_nom || `Équipement #${intervention.equipement}`}
              <span className="text-xs text-slate-400">→ fiche</span>
            </Link>
            {intervention.panne_id && (
              <Link
                to={`/failures/${intervention.panne_id}`}
                className="flex items-center gap-2 pt-3 border-t border-slate-100 text-sm text-slate-600 hover:text-slate-900"
              >
                <Link2 className="w-4 h-4 text-slate-400" />
                Panne #{intervention.panne_id}
              </Link>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showStart}
        onClose={() => setShowStart(false)}
        title="Démarrer l'intervention"
        message="Le chronomètre démarre à la validation. Confirmer le début de l'intervention ?"
        confirmLabel="Démarrer"
        onConfirm={() => { executeAction(() => interventionApi.start(Number(id))); setShowStart(false) }}
      />

      <ConfirmDialog
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        title="Annuler l'intervention"
        message={
          isEnCours
            ? "L'intervention est en cours : elle sera marquée Annulée et l'équipement retourne en panne si une panne est liée. Cette action est définitive."
            : "L'intervention planifiée sera marquée Annulée. Cette action est définitive."
        }
        confirmLabel="Annuler l'intervention"
        onConfirm={() => { executeAction(() => interventionApi.cancel(Number(id))); setShowCancel(false) }}
      />

      <Modal isOpen={showFinish} onClose={() => setShowFinish(false)} title="Terminer l'intervention">
        <form onSubmit={handleFinish} className="space-y-4">
          <div>
            <label htmlFor="finish-temps" className="input-label">Temps passé (minutes) *</label>
            <input
              id="finish-temps"
              type="number"
              min={0}
              value={finishTemps}
              onChange={(e) => setFinishTemps(e.target.value)}
              className="input"
              placeholder="ex. 45"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="finish-pieces" className="input-label">Pièces consommées</label>
            <textarea
              id="finish-pieces"
              value={finishPieces}
              onChange={(e) => setFinishPieces(e.target.value)}
              rows={2}
              className="input"
              placeholder="Références et quantités remplacées..."
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={finishRepare}
              onChange={(e) => setFinishRepare(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              <span className="text-sm font-medium text-slate-800">Réparation totale — remettre l'équipement en service</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                L'équipement repasse Fonctionnel. Une panne liée reste ouverte jusqu'à son test de clôture (RB-CL-001).
              </span>
            </span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowFinish(false)} className="btn-ghost text-xs">Annuler</button>
            <button type="submit" disabled={actionLoading || finishTemps === ''} className="btn-primary text-xs">
              {actionLoading ? 'Enregistrement...' : 'Terminer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
