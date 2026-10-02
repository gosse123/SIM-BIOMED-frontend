import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/app/AuthContext'
import { panneApi } from '@/services/panne'
import type { Panne } from '@/types/panne'
import type { User } from '@/types/auth'
import { canCloseFailure, canDiagnoseFailure, canQualifyFailure } from '@/utils/permissions'
import { StatusBadge, CriticalityBadge } from '@/components/ui/StatusBadge'
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates'
import { ConfirmDialog } from '@/components/ui/Modal'
import { toast } from '@/components/ui/toast'
import { getApiErrorMessage } from '@/utils/errors'
import { userDisplayName } from '@/utils/user'
import PageHeader from '@/components/ui/PageHeader'
import QualifyModal from '@/components/panne/QualifyModal'
import CriticiteModal from '@/components/panne/CriticiteModal'
import DiagnosticModal from '@/components/panne/DiagnosticModal'
import TestResultModal from '@/components/panne/TestResultModal'

type ModalType = 'QUALIFIEE' | 'CRITICITE_EVALUEE' | 'EN_DIAGNOSTIC' | 'EN_INTERVENTION' | 'EN_ATTENTE_PIECE' | 'EN_ATTENTE_PRESTATAIRE' | 'EN_TEST' | 'CLOSE' | null

const TRANSITION_ACCESS: Record<Exclude<ModalType, null>, (user: User | null) => boolean> = {
  QUALIFIEE: canQualifyFailure,
  CRITICITE_EVALUEE: canQualifyFailure,
  EN_DIAGNOSTIC: canDiagnoseFailure,
  EN_INTERVENTION: canDiagnoseFailure,
  EN_ATTENTE_PIECE: canQualifyFailure,
  EN_ATTENTE_PRESTATAIRE: canQualifyFailure,
  EN_TEST: canDiagnoseFailure,
  CLOSE: canCloseFailure,
}

export default function PanneDetailPage() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [panne, setPanne] = useState<Panne | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)

  const loadPanne = async (panneId: number) => {
    setIsLoading(true)
    try {
      const data = await panneApi.get(panneId)
      setPanne(data)
      setError('')
    } catch {
      setError('Panne introuvable.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { if (id) loadPanne(Number(id)) }, [id])

  const executeAction = async (fn: () => Promise<unknown>) => {
    setActionLoading(true)
    try {
      await fn()
      if (id) await loadPanne(Number(id))
      toast('success', 'Action effectuée avec succès')
    } catch (err) {
      toast('error', getApiErrorMessage(err, "Erreur lors de l'action."))
    } finally {
      setActionLoading(false)
    }
  }

  const closeModal = () => { setModal(null) }

  if (isLoading) return <LoadingState />
  if (error || !panne) return <ErrorState message={error || 'Panne introuvable.'} onRetry={() => loadPanne(Number(id))} />

  const allowedTransitions = (panne.transitions_valides ?? []).filter(
    (t) => TRANSITION_ACCESS[t as Exclude<ModalType, null>]?.(currentUser) ?? true,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Panne #${panne.id}`}
        breadcrumbs={[
          { label: 'Pannes', href: '/failures' },
          { label: `#${panne.id}` },
        ]}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={panne.statut} size="md" />
            {panne.niveau_criticite && <CriticalityBadge level={panne.niveau_criticite} />}
          </div>
        }
      />

      {/* Actions */}
      {allowedTransitions.length > 0 && (
        <div className="card p-4">
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.map((t) => (
              <button
                key={t}
                disabled={actionLoading}
                onClick={() => setModal(t as ModalType)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  t === 'CLOSE' ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : t === 'EN_INTERVENTION' ? 'bg-sky-600 text-white hover:bg-sky-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-3">
          <h2>Signalement</h2>
          <p className="text-sm text-slate-700">{panne.description_signalement}</p>
          <p className="text-xs text-slate-500 mt-2">
            Par {userDisplayName(panne.signale_par_detail)}
            {' • '}{new Date(panne.date_signalement).toLocaleDateString('fr-FR')}
          </p>
        </div>

        {panne.date_qualification && (
          <div className="card p-6 space-y-3">
            <h2>Qualification</h2>
            <p className="text-sm text-slate-700">{panne.observation_qualification}</p>
            {panne.critere_urgence && <p className="text-xs text-slate-500">Urgence : {panne.critere_urgence}</p>}
            <p className="text-xs text-slate-500">
              Le {new Date(panne.date_qualification).toLocaleDateString('fr-FR')} par {userDisplayName(panne.qualifiee_par_detail)}
            </p>
          </div>
        )}

        {panne.date_diagnostic && (
          <div className="card p-6 space-y-3">
            <h2>Diagnostic</h2>
            <p className="text-sm text-slate-700">{panne.description_diagnostic}</p>
            <p className="text-sm font-semibold text-slate-900">Cause : {panne.cause_identifiee}</p>
          </div>
        )}

        {panne.date_cloture && (
          <div className="card p-6 space-y-3">
            <h2>Clôture</h2>
            <p className="text-sm text-slate-700">{panne.commentaire_cloture}</p>
            <p className="text-xs text-slate-500">Résultat test : {panne.resultat_test}</p>
          </div>
        )}
      </div>

      {/* Shared modals */}
      <QualifyModal
        isOpen={modal === 'QUALIFIEE'}
        onClose={closeModal}
        onConfirm={(data) => { executeAction(() => panneApi.qualify(panne.id, data)); closeModal() }}

      />
      <CriticiteModal
        isOpen={modal === 'CRITICITE_EVALUEE'}
        onClose={closeModal}
        onConfirm={(data) => { executeAction(() => panneApi.evaluateCriticite(panne.id, data)); closeModal() }}

      />
      <DiagnosticModal
        isOpen={modal === 'EN_DIAGNOSTIC'}
        onClose={closeModal}
        onConfirm={(data) => { executeAction(() => panneApi.diagnose(panne.id, data)); closeModal() }}

      />
      <TestResultModal
        isOpen={modal === 'EN_TEST'}
        onClose={closeModal}
        onConfirm={(data) => { executeAction(() => panneApi.startTest(panne.id, data)); closeModal() }}

      />
      <ConfirmDialog
        isOpen={modal === 'EN_INTERVENTION'}
        onClose={closeModal}
        title="Démarrer l'intervention"
        message="Voulez-vous démarrer l'intervention sur cette panne ?"
        confirmLabel="Démarrer"
        onConfirm={() => { executeAction(() => panneApi.startIntervention(panne.id)); closeModal() }}
      />
      <ConfirmDialog
        isOpen={modal === 'EN_ATTENTE_PIECE'}
        onClose={closeModal}
        title="Attente de pièce"
        message="Marquer cette panne en attente de pièce ?"
        confirmLabel="Confirmer"
        onConfirm={() => { executeAction(() => panneApi.waitPiece(panne.id)); closeModal() }}
      />
      <ConfirmDialog
        isOpen={modal === 'EN_ATTENTE_PRESTATAIRE'}
        onClose={closeModal}
        title="Attente prestataire"
        message="Marquer cette panne en attente de prestataire ?"
        confirmLabel="Confirmer"
        onConfirm={() => { executeAction(() => panneApi.waitPrestataire(panne.id)); closeModal() }}
      />
      <ConfirmDialog
        isOpen={modal === 'CLOSE'}
        onClose={closeModal}
        title="Clôturer la panne"
        message="Voulez-vous clôturer cette panne ?"
        confirmLabel="Clôturer"
        variant="danger"
        onConfirm={() => { executeAction(() => panneApi.close(panne.id, {})); closeModal() }}
      />
    </div>
  )
}
