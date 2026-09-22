import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { workqueueApi, type WorkQueueStats, type WorkQueueItem } from '@/services/workqueue'
import { panneApi } from '@/services/panne'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/FeedbackStates'
import PageHeader from '@/components/ui/PageHeader'
import { toast } from '@/components/ui/Toast'
import QualifyModal from '@/components/panne/QualifyModal'
import CriticiteModal from '@/components/panne/CriticiteModal'
import DiagnosticModal from '@/components/panne/DiagnosticModal'
import TestResultModal from '@/components/panne/TestResultModal'
import ConfirmActionModal from '@/components/panne/ConfirmActionModal'
import {
  AlertTriangle, PhoneCall, Clock, ShieldAlert, Users,
  Smartphone, ChevronRight, Play, Wrench,
  CheckCircle2, Package, Truck
} from 'lucide-react'

const CRITICITE_COLORS: Record<string, string> = {
  CRITIQUE: 'bg-red-500 text-white',
  ELEVE: 'bg-blue-600 text-white',
  MOYEN: 'bg-slate-500 text-white',
  FAIBLE: 'bg-slate-300 text-slate-700',
}

const CRITICITE_BORDER: Record<string, string> = {
  CRITIQUE: 'border-l-red-500',
  ELEVE: 'border-l-blue-600',
  MOYEN: 'border-l-slate-400',
  FAIBLE: 'border-l-slate-300',
}

const STATUT_LABELS: Record<string, string> = {
  SIGNALEE: 'Signalée',
  QUALIFIEE: 'Qualifiée',
  CRITICITE_EVALUEE: 'Criticité évaluée',
  EN_DIAGNOSTIC: 'En diagnostic',
  EN_INTERVENTION: 'En intervention',
  EN_TEST: 'En test',
  EN_ATTENTE_PIECE: 'Attente pièce',
  EN_ATTENTE_PRESTATAIRE: 'Attente prestataire',
  CLOSE: 'Clôturée',
}

const STATUT_COLORS: Record<string, string> = {
  SIGNALEE: 'bg-orange-100 text-orange-700 border border-orange-200',
  QUALIFIEE: 'bg-amber-100 text-amber-700 border border-amber-200',
  CRITICITE_EVALUEE: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  EN_DIAGNOSTIC: 'bg-sky-100 text-sky-700 border border-sky-200',
  EN_INTERVENTION: 'bg-blue-100 text-blue-700 border border-blue-200',
  EN_TEST: 'bg-purple-100 text-purple-700 border border-purple-200',
  EN_ATTENTE_PIECE: 'bg-amber-100 text-amber-700 border border-amber-200',
  EN_ATTENTE_PRESTATAIRE: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
}

// Transitions valides par statut (d'après le modèle backend)
function getTransitions(statut: string): string[] {
  const map: Record<string, string[]> = {
    SIGNALEE: ['QUALIFIEE'],
    QUALIFIEE: ['CRITICITE_EVALUEE', 'CLOSE'],
    CRITICITE_EVALUEE: ['EN_DIAGNOSTIC'],
    EN_DIAGNOSTIC: ['EN_INTERVENTION', 'EN_ATTENTE_PIECE', 'EN_ATTENTE_PRESTATAIRE'],
    EN_INTERVENTION: ['EN_TEST'],
    EN_TEST: ['CLOSE', 'EN_INTERVENTION', 'EN_ATTENTE_PIECE', 'EN_ATTENTE_PRESTATAIRE'],
    EN_ATTENTE_PIECE: ['EN_INTERVENTION'],
    EN_ATTENTE_PRESTATAIRE: ['EN_INTERVENTION'],
  }
  return map[statut] || []
}

const TECHNICIENS = [
  { nom: 'Ing. Léa Dubois', role: 'Responsable', charge: 95, avatar: 'LD' },
  { nom: 'Tech. Marc Vella', role: 'Technicien', charge: 60, avatar: 'MV' },
  { nom: 'Tech. Sarah Chen', role: 'Technicien', charge: 35, avatar: 'SC' },
]

type ModalType = 'qualify' | 'criticite' | 'diagnostic' | 'test' | 'confirm' | null

export default function WorkQueuePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<WorkQueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedPanne, setSelectedPanne] = useState<WorkQueueItem | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; action: () => void }>({ title: '', message: '', action: () => {} })

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await workqueueApi.get()
      setStats(data)
      setError('')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const executeTransition = useCallback(async (_id: number, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast('success', 'Transition effectuée avec succès')
      await fetchData()
    } catch (err: any) {
      toast('error', err?.response?.data?.detail || "Erreur lors de l'action.")
    } finally {
      setActiveModal(null)
      setSelectedPanne(null)
    }
  }, [])

  const openModal = (modal: ModalType, panne: WorkQueueItem) => {
    setSelectedPanne(panne)
    setActiveModal(modal)
  }

  const handleCallNext = () => {
    if (sortedPannes.length > 0) {
      navigate(`/failures/${sortedPannes[0].id}`)
    }
  }

  const handleSimpleTransition = (panne: WorkQueueItem, transition: string) => {
    const labels: Record<string, string> = {
      EN_INTERVENTION: "Démarrer l'intervention",
      EN_ATTENTE_PIECE: "Mettre en attente de pièce",
      EN_ATTENTE_PRESTATAIRE: "Mettre en attente de prestataire",
      CLOSE: 'Clôturer la panne',
    }
    setConfirmConfig({
      title: labels[transition] || transition,
      message: `Confirmer la transition vers "${STATUT_LABELS[transition] || transition}" ?`,
      action: () => {
        if (transition === 'EN_INTERVENTION') {
          executeTransition(panne.id, () => panneApi.startIntervention(panne.id))
        } else if (transition === 'EN_ATTENTE_PIECE') {
          executeTransition(panne.id, () => panneApi.waitPiece(panne.id))
        } else if (transition === 'EN_ATTENTE_PRESTATAIRE') {
          executeTransition(panne.id, () => panneApi.waitPrestataire(panne.id))
        } else if (transition === 'CLOSE') {
          executeTransition(panne.id, () => panneApi.close(panne.id, {}))
        }
      },
    })
    setActiveModal('confirm')
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={fetchData} />
  if (!stats) return null

  const sortedPannes = [...stats.pannes].sort((a, b) => {
    const order: Record<string, number> = { CRITIQUE: 0, ELEVE: 1, MOYEN: 2, FAIBLE: 3 }
    return (order[a.niveau_criticite] ?? 4) - (order[b.niveau_criticite] ?? 4)
  })

  return (
    <div className="space-y-6">
      <PageHeader title="File de travail" description="Régulation technique — interventions prioritaires" />

      {/* Urgency Banner */}
      <div className="card border-l-4 border-l-red-500 p-5 bg-red-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0 animate-critical-pulse">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">
                {stats.total_ouvertes} intervention{stats.total_ouvertes > 1 ? 's' : ''} en attente
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <ShieldAlert className="w-3 h-3" /> 2 DM vitaux bloqués
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" /> SLA moyen: 18 min (cible &lt; 30 min)
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleCallNext} className="btn-danger shrink-0" disabled={sortedPannes.length === 0}>
            <PhoneCall className="w-4 h-4" /> Prendre la prochaine urgence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main queue - 3 cols */}
        <div className="lg:col-span-3 space-y-3">
          {sortedPannes.length === 0 ? (
            <EmptyState title="Aucune intervention en attente" description="Toutes les pannes sont clôturées." />
          ) : (
            sortedPannes.map((panne) => {
              const transitions = getTransitions(panne.statut)
              return (
                <div
                  key={panne.id}
                  className={`card-hover border-l-4 p-4 ${CRITICITE_BORDER[panne.niveau_criticite] || 'border-l-slate-300'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${CRITICITE_COLORS[panne.niveau_criticite] || ''}`}>
                        {panne.niveau_criticite}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 truncate">{panne.equipement_nom}</p>
                          <span className="mono text-xs">{panne.equipement_num}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUT_COLORS[panne.statut] || ''}`}>
                            {STATUT_LABELS[panne.statut] || panne.statut}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{panne.description_signalement}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-400">
                            Signalé par: {panne.signale_par_nom}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(panne.date_signalement).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {transitions.includes('QUALIFIEE') && (
                        <button onClick={() => openModal('qualify', panne)} className="btn-primary text-[11px] px-2.5 py-1.5">
                          <CheckCircle2 className="w-3 h-3" /> Qualifier
                        </button>
                      )}
                      {transitions.includes('CRITICITE_EVALUEE') && (
                        <button onClick={() => openModal('criticite', panne)} className="btn-secondary text-[11px] px-2.5 py-1.5">
                          <AlertTriangle className="w-3 h-3" /> Criticité
                        </button>
                      )}
                      {transitions.includes('EN_DIAGNOSTIC') && (
                        <button onClick={() => openModal('diagnostic', panne)} className="btn-primary text-[11px] px-2.5 py-1.5">
                          <Wrench className="w-3 h-3" /> Diagnostiquer
                        </button>
                      )}
                      {transitions.includes('EN_INTERVENTION') && (
                        <button onClick={() => handleSimpleTransition(panne, 'EN_INTERVENTION')} className="btn-primary text-[11px] px-2.5 py-1.5">
                          <Play className="w-3 h-3" /> Intervention
                        </button>
                      )}
                      {transitions.includes('EN_ATTENTE_PIECE') && (
                        <button onClick={() => handleSimpleTransition(panne, 'EN_ATTENTE_PIECE')} className="btn-secondary text-[11px] px-2.5 py-1.5">
                          <Package className="w-3 h-3" /> Pièce
                        </button>
                      )}
                      {transitions.includes('EN_ATTENTE_PRESTATAIRE') && (
                        <button onClick={() => handleSimpleTransition(panne, 'EN_ATTENTE_PRESTATAIRE')} className="btn-secondary text-[11px] px-2.5 py-1.5">
                          <Truck className="w-3 h-3" /> Prestataire
                        </button>
                      )}
                      {transitions.includes('EN_TEST') && (
                        <button onClick={() => openModal('test', panne)} className="btn-primary text-[11px] px-2.5 py-1.5">
                          <Play className="w-3 h-3" /> Test
                        </button>
                      )}
                      {transitions.includes('CLOSE') && panne.statut === 'EN_TEST' && (
                        <button onClick={() => handleSimpleTransition(panne, 'CLOSE')} className="text-[11px] px-2.5 py-1.5 font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                          <CheckCircle2 className="w-3 h-3 inline" /> Clôturer
                        </button>
                      )}
                      <Link to={`/failures/${panne.id}`} className="btn-ghost text-[11px] px-2 py-1.5">
                        Détail <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* On-call roster - right sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-semibold text-slate-900">Garde biomédicale</h2>
            </div>
            <div className="space-y-3">
              {TECHNICIENS.map((tech) => (
                <div key={tech.nom} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-xs font-bold text-sky-700 shrink-0">
                    {tech.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{tech.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            tech.charge > 80 ? 'bg-red-500' : tech.charge > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${tech.charge}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{tech.charge}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-semibold text-slate-900">Scanner</h2>
            </div>
            <p className="text-xs text-slate-500">
              Scan DataMatrix / RFID au chevet pour prise en charge directe par terminal mobile.
            </p>
            <button className="btn-secondary text-xs w-full mt-3">
              <Smartphone className="w-4 h-4" /> Activer le scan
            </button>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Légende priorité</h2>
            <div className="space-y-2">
              {Object.entries(CRITICITE_COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs text-slate-600">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QualifyModal
        isOpen={activeModal === 'qualify'}
        onClose={() => { setActiveModal(null); setSelectedPanne(null) }}
        onConfirm={(data) => {
          if (selectedPanne) executeTransition(selectedPanne.id, () => panneApi.qualify(selectedPanne.id, data))
        }}

      />
      <CriticiteModal
        isOpen={activeModal === 'criticite'}
        onClose={() => { setActiveModal(null); setSelectedPanne(null) }}
        onConfirm={(data) => {
          if (selectedPanne) executeTransition(selectedPanne.id, () => panneApi.evaluateCriticite(selectedPanne.id, data))
        }}

      />
      <DiagnosticModal
        isOpen={activeModal === 'diagnostic'}
        onClose={() => { setActiveModal(null); setSelectedPanne(null) }}
        onConfirm={(data) => {
          if (selectedPanne) executeTransition(selectedPanne.id, () => panneApi.diagnose(selectedPanne.id, data))
        }}

      />
      <TestResultModal
        isOpen={activeModal === 'test'}
        onClose={() => { setActiveModal(null); setSelectedPanne(null) }}
        onConfirm={(data) => {
          if (selectedPanne) executeTransition(selectedPanne.id, () => panneApi.startTest(selectedPanne.id, data))
        }}

      />
      <ConfirmActionModal
        isOpen={activeModal === 'confirm'}
        onClose={() => { setActiveModal(null); setSelectedPanne(null) }}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel="Confirmer"
      />
    </div>
  )
}
