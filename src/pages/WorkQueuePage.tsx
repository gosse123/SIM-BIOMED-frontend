import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/AuthContext'
import { workqueueApi, type WorkQueueStats, type WorkQueueItem } from '@/services/workqueue'
import { panneApi } from '@/services/panne'
import { equipmentApi } from '@/services/equipment'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/FeedbackStates'
import PageHeader from '@/components/ui/PageHeader'
import { toast } from '@/components/ui/toast'
import { getApiErrorMessage } from '@/utils/errors'
import QualifyModal from '@/components/panne/QualifyModal'
import CriticiteModal from '@/components/panne/CriticiteModal'
import DiagnosticModal from '@/components/panne/DiagnosticModal'
import TestResultModal from '@/components/panne/TestResultModal'
import ConfirmActionModal from '@/components/panne/ConfirmActionModal'
import QrScanner, { type QrEquipmentData } from '@/components/QrScanner'
import {
  AlertTriangle, PhoneCall, Clock, ShieldAlert, Users,
  Smartphone, ChevronRight, Play, Wrench,
  CheckCircle2, Package, Truck, UserCheck
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

// Repli hors-ligne si la réponse serveur ne porte pas les transitions
// (cache ancien) — la carte d'origine reste la source : `transitions_valides`.
const FALLBACK_TRANSITIONS: Record<string, string[]> = {
  SIGNALEE: ['QUALIFIEE'],
  QUALIFIEE: ['CRITICITE_EVALUEE'],
  CRITICITE_EVALUEE: ['EN_DIAGNOSTIC'],
  EN_DIAGNOSTIC: ['EN_INTERVENTION', 'EN_ATTENTE_PIECE', 'EN_ATTENTE_PRESTATAIRE'],
  EN_INTERVENTION: ['EN_TEST'],
  EN_TEST: ['CLOSE', 'EN_DIAGNOSTIC', 'EN_ATTENTE_PIECE', 'EN_ATTENTE_PRESTATAIRE'],
  EN_ATTENTE_PIECE: ['EN_INTERVENTION'],
  EN_ATTENTE_PRESTATAIRE: ['EN_INTERVENTION'],
}

function getTransitions(panne: WorkQueueItem): string[] {
  return panne.transitions_valides ?? FALLBACK_TRANSITIONS[panne.statut] ?? []
}

const initiales = (nom?: string | null) =>
  (nom || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0])
    .join('')
    .toUpperCase()

type ModalType = 'qualify' | 'criticite' | 'diagnostic' | 'test' | 'confirm' | null

type CriticiteFilter = 'ALL' | 'CRITIQUE' | 'ELEVE' | 'MOYEN' | 'FAIBLE'

const PAGE_SIZE = 6

export default function WorkQueuePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState<WorkQueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Filtres de la file (RB-PR-004 : file ordonnée et filtrable)
  const [criticiteFilter, setCriticiteFilter] = useState<CriticiteFilter>('ALL')
  const [affectationFilter, setAffectationFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [showScanner, setShowScanner] = useState(false)
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

  useEffect(() => { setPage(1) }, [criticiteFilter, affectationFilter])

  const executeTransition = useCallback(async (_id: number, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast('success', 'Transition effectuée avec succès')
      await fetchData()
    } catch (err) {
      toast('error', getApiErrorMessage(err, "Erreur lors de l'action."))
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
    if (filteredPannes.length > 0) {
      navigate(`/failures/${filteredPannes[0].id}`)
    }
  }

  // Prise en charge (RB-PR-004) : POST vide = affectation à l'utilisateur courant
  const handleAssign = async (panne: WorkQueueItem) => {
    try {
      await panneApi.affecter(panne.id)
      toast('success', 'Panne prise en charge')
      await fetchData()
    } catch (err) {
      toast('error', getApiErrorMessage(err, "Impossible de prendre en charge cette panne."))
    }
  }

  const handleScan = async (data: QrEquipmentData) => {
    setShowScanner(false)
    try {
      const found = await equipmentApi.list({ search: data.num_inventaire })
      if (found.length > 0) {
        navigate(`/equipment/${found[0].id}`)
      } else {
        toast('error', `Aucun équipement trouvé pour le n° ${data.num_inventaire}`)
      }
    } catch (err) {
      toast('error', getApiErrorMessage(err, 'Recherche impossible.'))
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

  // Filtres côté client (données MVP déjà chargées)
  const filteredPannes = sortedPannes.filter((p) => {
    if (criticiteFilter !== 'ALL' && p.niveau_criticite !== criticiteFilter) return false
    if (affectationFilter === 'MINE') return p.affecte_a === user?.id
    if (affectationFilter === 'NONE') return !p.affecte_a
    if (affectationFilter.startsWith('tech:')) return p.affecte_a === Number(affectationFilter.slice(5))
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredPannes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagePannes = filteredPannes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filteredPannes.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredPannes.length)

  const critiquesCount = stats.par_criticite.CRITIQUE ?? 0
  const techniciens = stats.techniciens ?? []
  const ageMoyen = stats.age_moyen_minutes

  const criticiteTabs: { key: CriticiteFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'Toutes', count: stats.total_ouvertes },
    { key: 'CRITIQUE', label: 'Critiques', count: stats.par_criticite.CRITIQUE ?? 0 },
    { key: 'ELEVE', label: 'Élevées', count: stats.par_criticite.ELEVE ?? 0 },
    { key: 'MOYEN', label: 'Moyennes', count: stats.par_criticite.MOYEN ?? 0 },
    { key: 'FAIBLE', label: 'Faibles', count: stats.par_criticite.FAIBLE ?? 0 },
  ]

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
                  <ShieldAlert className="w-3 h-3" /> {critiquesCount} panne{critiquesCount > 1 ? 's' : ''} critique{critiquesCount > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" /> Ouverture moyenne: {ageMoyen != null ? `${ageMoyen} min` : '—'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleCallNext} className="btn-danger shrink-0" disabled={filteredPannes.length === 0}>
            <PhoneCall className="w-4 h-4" /> Prendre la prochaine urgence
          </button>
        </div>
      </div>

      {/* Onglets criticité + filtre d'affectation */}
      <div className="flex flex-wrap items-center gap-2">
        {criticiteTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCriticiteFilter(tab.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              criticiteFilter === tab.key
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 font-mono ${
                criticiteFilter === tab.key ? 'text-sky-100' : 'text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
        <select
          value={affectationFilter}
          onChange={(e) => setAffectationFilter(e.target.value)}
          aria-label="Filtrer par affectation"
          className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="ALL">Toutes les affectations</option>
          <option value="MINE">Mes pannes</option>
          <option value="NONE">Non affectées</option>
          {techniciens.map((t) => (
            <option key={t.id} value={`tech:${t.id}`}>
              {t.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main queue - 3 cols */}
        <div className="lg:col-span-3 space-y-3">
          {filteredPannes.length === 0 ? (
            <EmptyState
              title="Aucune intervention en attente"
              description={
                criticiteFilter === 'ALL' && affectationFilter === 'ALL'
                  ? 'Toutes les pannes sont clôturées.'
                  : 'Aucune panne ne correspond à ces filtres.'
              }
            />
          ) : (
            pagePannes.map((panne) => {
              const transitions = getTransitions(panne)
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
                          {panne.service_nom && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {panne.service_nom}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{panne.description_signalement}</p>
                        {panne.cause_identifiee && (
                          <p className="text-xs text-sky-700 mt-1 line-clamp-1">Cause : {panne.cause_identifiee}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-slate-400">
                            Signalé par: {panne.signale_par_nom}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(panne.date_signalement).toLocaleDateString('fr-FR')}
                          </span>
                          {panne.affecte_a ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                panne.affecte_a === user?.id ? 'text-sky-700' : 'text-slate-500'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[9px] font-bold text-sky-700">
                                {initiales(panne.affecte_a_nom)}
                              </span>
                              {panne.affecte_a === user?.id ? 'Affecté à vous' : panne.affecte_a_nom}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAssign(panne)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                            >
                              <UserCheck className="w-3 h-3" /> Prendre en charge
                            </button>
                          )}
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

          {/* Pagination */}
          {filteredPannes.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>
                Affichage de {rangeStart}–{rangeEnd} sur {filteredPannes.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="btn-ghost text-xs px-2 py-1 disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="font-semibold text-slate-800 px-1">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="btn-ghost text-xs px-2 py-1 disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            </div>
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
              {techniciens.length === 0 && (
                <p className="text-xs text-slate-500">Aucun technicien actif.</p>
              )}
              {techniciens.map((tech) => (
                <div key={tech.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-xs font-bold text-sky-700 shrink-0">
                    {tech.initiales}
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
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {tech.interventions_en_cours} intervention{tech.interventions_en_cours > 1 ? 's' : ''} en cours
                    </p>
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
            <button onClick={() => setShowScanner(true)} className="btn-secondary text-xs w-full mt-3">
              <Smartphone className="w-4 h-4" /> Activer le scan
            </button>
            {showScanner && (
              <div className="mt-3">
                <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
              </div>
            )}
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
