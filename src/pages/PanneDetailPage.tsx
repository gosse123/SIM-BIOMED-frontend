import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { panneApi } from '@/services/panne'
import type { Panne } from '@/types/panne'
import { STATUT_PANNE_LABELS, STATUT_PANNE_COLORS } from '@/types/panne'

export default function PanneDetailPage() {
  const { id } = useParams()
  const [panne, setPanne] = useState<Panne | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showQualifyForm, setShowQualifyForm] = useState(false)
  const [showCriticiteForm, setShowCriticiteForm] = useState(false)
  const [showDiagnosticForm, setShowDiagnosticForm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (id) loadPanne(Number(id))
  }, [id])

  const loadPanne = async (panneId: number) => {
    setIsLoading(true)
    try {
      const data = await panneApi.get(panneId)
      setPanne(data)
    } catch (error) {
      console.error('Erreur chargement panne:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const executeAction = async (fn: () => Promise<void>) => {
    setActionLoading(true)
    try {
      await fn()
      if (id) await loadPanne(Number(id))
    } catch (error: any) {
      alert(error?.response?.data?.detail || error?.response?.data || 'Erreur lors de l\'action.')
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) return <div className="p-6 text-on-surface-variant">Chargement...</div>
  if (!panne) return <div className="p-6 text-error">Panne introuvable.</div>

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="text-sm text-on-surface-variant mb-2">
        <Link to="/failures" className="hover:text-primary">Pannes</Link>
        <span className="mx-2">/</span>
        <span className="text-on-surface font-semibold">Panne #{panne.id}</span>
      </div>

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_PANNE_COLORS[panne.statut]}`}>
                {STATUT_PANNE_LABELS[panne.statut]}
              </span>
              {panne.niveau_criticite && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-xs font-semibold">
                  Criticité : {panne.niveau_criticite}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-on-surface">
              {panne.equipement_detail?.nom || `Équipement #${panne.equipement}`}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {panne.equipement_num} • Signalée le {new Date(panne.date_signalement).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {panne.transitions_valides?.includes('QUALIFIEE') && (
              <button onClick={() => setShowQualifyForm(true)} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-semibold text-sm border border-amber-200 hover:bg-amber-200 transition">
                Qualifier
              </button>
            )}
            {panne.transitions_valides?.includes('CRITICITE_EVALUEE') && (
              <button onClick={() => setShowCriticiteForm(true)} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-orange-100 text-orange-800 font-semibold text-sm border border-orange-200 hover:bg-orange-200 transition">
                Évaluer criticité
              </button>
            )}
            {panne.transitions_valides?.includes('EN_DIAGNOSTIC') && (
              <button onClick={() => setShowDiagnosticForm(true)} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-primary-fixed text-on-primary-fixed-variant font-semibold text-sm border border-primary/20 hover:bg-primary/10 transition">
                Diagnostiquer
              </button>
            )}
            {panne.transitions_valides?.includes('EN_INTERVENTION') && (
              <button onClick={() => executeAction(() => panneApi.startIntervention(panne.id))} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition">
                Intervention
              </button>
            )}
            {panne.transitions_valides?.includes('EN_ATTENTE_PIECE') && (
              <button onClick={() => executeAction(() => panneApi.waitPiece(panne.id))} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-surface-variant text-on-surface font-semibold text-sm border border-outline-variant hover:bg-surface-container-high transition">
                Attente pièce
              </button>
            )}
            {panne.transitions_valides?.includes('EN_ATTENTE_PRESTATAIRE') && (
              <button onClick={() => executeAction(() => panneApi.waitPrestataire(panne.id))} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-surface-variant text-on-surface font-semibold text-sm border border-outline-variant hover:bg-surface-container-high transition">
                Attente prestataire
              </button>
            )}
            {panne.transitions_valides?.includes('EN_TEST') && (
              <button onClick={() => setShowCloseForm(true)} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-teal-100 text-teal-800 font-semibold text-sm border border-teal-200 hover:bg-teal-200 transition">
                Lancer test
              </button>
            )}
            {panne.transitions_valides?.includes('CLOSE') && (
              <button onClick={() => executeAction(() => panneApi.close(panne.id, {}))} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition">
                Clôturer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Signalement */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="font-semibold text-on-surface border-b border-surface-container pb-2">Signalement</h2>
        <div className="text-sm text-on-surface">{panne.description_signalement}</div>
        <div className="text-xs text-on-surface-variant mt-2">
          Par {panne.signale_par_detail?.first_name} {panne.signale_par_detail?.last_name}
        </div>
      </div>

      {/* Qualification */}
      {panne.date_qualification && (
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-on-surface border-b border-surface-container pb-2">Qualification</h2>
          <div className="text-sm text-on-surface">{panne.observation_qualification}</div>
          {panne.critere_urgence && <div className="text-xs text-on-surface-variant">Urgence : {panne.critere_urgence}</div>}
          <div className="text-xs text-on-surface-variant">
            Le {new Date(panne.date_qualification).toLocaleDateString('fr-FR')} par {panne.qualifiee_par_detail?.first_name}
          </div>
        </div>
      )}

      {/* Diagnostic */}
      {panne.date_diagnostic && (
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-on-surface border-b border-surface-container pb-2">Diagnostic</h2>
          <div className="text-sm text-on-surface">{panne.description_diagnostic}</div>
          <div className="text-sm text-on-surface-variant">Cause : <strong>{panne.cause_identifiee}</strong></div>
        </div>
      )}

      {/* Clôture */}
      {panne.date_cloture && (
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-on-surface border-b border-surface-container pb-2">Clôture</h2>
          <div className="text-sm text-on-surface">{panne.commentaire_cloture}</div>
          <div className="text-xs text-on-surface-variant">Résultat test : {panne.resultat_test}</div>
        </div>
      )}

      {/* Formulaires modaux */}
      {showQualifyForm && (
        <Modal onClose={() => setShowQualifyForm(false)} title="Qualifier la panne">
          <QualifyForm panne={panne} loading={actionLoading} onSubmit={async (data) => {
            await executeAction(() => panneApi.qualify(panne.id, data))
            setShowQualifyForm(false)
          }} />
        </Modal>
      )}
      {showCriticiteForm && (
        <Modal onClose={() => setShowCriticiteForm(false)} title="Évaluer la criticité">
          <CriticiteForm panne={panne} loading={actionLoading} onSubmit={async (data) => {
            await executeAction(() => panneApi.evaluateCriticite(panne.id, data))
            setShowCriticiteForm(false)
          }} />
        </Modal>
      )}
      {showDiagnosticForm && (
        <Modal onClose={() => setShowDiagnosticForm(false)} title="Diagnostiquer la panne">
          <DiagnosticForm panne={panne} loading={actionLoading} onSubmit={async (data) => {
            await executeAction(() => panneApi.diagnose(panne.id, data))
            setShowDiagnosticForm(false)
          }} />
        </Modal>
      )}
      {showCloseForm && (
        <Modal onClose={() => setShowCloseForm(false)} title="Lancer le test">
          <TestForm panne={panne} loading={actionLoading} onSubmit={async (data) => {
            await executeAction(() => panneApi.startTest(panne.id, data))
            setShowCloseForm(false)
          }} />
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-lg shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error text-lg">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function QualifyForm({ panne, loading, onSubmit }: { panne: Panne; loading: boolean; onSubmit: (data: any) => void }) {
  const [obs, setObs] = useState('')
  const [urgence, setUrgence] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ observation_qualification: obs, critere_urgence: urgence }) }} className="space-y-3">
      <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} placeholder="Observation de qualification *" className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
      <input value={urgence} onChange={(e) => setUrgence(e.target.value)} placeholder="Critère d'urgence" className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">Qualifier</button>
    </form>
  )
}

function CriticiteForm({ panne, loading, onSubmit }: { panne: Panne; loading: boolean; onSubmit: (data: any) => void }) {
  const [impact, setImpact] = useState('')
  const [criticite, setCriticite] = useState('MOYEN')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ critere_impact: impact, niveau_criticite: criticite }) }} className="space-y-3">
      <input value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="Critère d'impact *" className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
      <select value={criticite} onChange={(e) => setCriticite(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary">
        <option value="FAIBLE">Faible</option>
        <option value="MOYEN">Moyen</option>
        <option value="ELEVE">Élevé</option>
        <option value="CRITIQUE">Critique</option>
      </select>
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">Évaluer criticité</button>
    </form>
  )
}

function DiagnosticForm({ panne, loading, onSubmit }: { panne: Panne; loading: boolean; onSubmit: (data: any) => void }) {
  const [desc, setDesc] = useState('')
  const [cause, setCause] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ description_diagnostic: desc, cause_identifiee: cause }) }} className="space-y-3">
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Description du diagnostic *" className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
      <textarea value={cause} onChange={(e) => setCause(e.target.value)} rows={2} placeholder="Cause identifiée *" className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container disabled:opacity-50">Diagnostiquer</button>
    </form>
  )
}

function TestForm({ panne, loading, onSubmit }: { panne: Panne; loading: boolean; onSubmit: (data: any) => void }) {
  const [resultat, setResultat] = useState('CONFORME')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ resultat_test: resultat }) }} className="space-y-3">
      <select value={resultat} onChange={(e) => setResultat(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary">
        <option value="CONFORME">Conforme</option>
        <option value="SOUS_SURVEILLANCE">Sous surveillance</option>
        <option value="NON_CONFORME">Non conforme</option>
        <option value="TOUJOURS_EN_PANNE">Toujours en panne</option>
      </select>
      <button type="submit" disabled={loading} className="w-full py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">Enregistrer le résultat du test</button>
    </form>
  )
}
