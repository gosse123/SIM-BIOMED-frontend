import { useState, useEffect, useCallback } from 'react'
import { demandesApi } from '@/services/api'
import type { DemandeAcces } from '@/types/demandes'
import { ROLE_LABELS } from '@/utils/permissions'
import PageHeader from '@/components/ui/PageHeader'
import SearchInput from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/FeedbackStates'
import {
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Filter,
} from 'lucide-react'

const STATUT_CONFIG = {
  EN_ATTENTE: { label: 'En attente', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  APPROUVEE: { label: 'Approuvée', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  REFUSEE: { label: 'Refusée', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
} as const

function DemandeRow({
  demande,
  onApprove,
  onReject,
}: {
  demande: DemandeAcces
  onApprove: (d: DemandeAcces) => void
  onReject: (d: DemandeAcces) => void
}) {
  const config = STATUT_CONFIG[demande.statut]
  const Icon = config.icon

  return (
    <div className={`px-5 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${!demande.date_traitement ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className="text-sm font-semibold text-slate-900">{demande.nom_complet}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.bg} ${config.color} ${config.border} border`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{demande.email}</span>
            <span className="text-slate-300">·</span>
            <span className="font-medium text-slate-600">{ROLE_LABELS[demande.role_souhaite as keyof typeof ROLE_LABELS] || demande.role_souhaite}</span>
            {demande.service && (
              <>
                <span className="text-slate-300">·</span>
                <span>{demande.service}</span>
              </>
            )}
          </div>
          {demande.justification && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{demande.justification}</p>
          )}
          {demande.motif_rejet && (
            <p className="text-xs text-red-500 mt-1 italic">Motif : {demande.motif_rejet}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-1.5">
            Soumise le {new Date(demande.date_creation).toLocaleDateString('fr-FR')}
            {demande.traite_par_username && ` · Traité par ${demande.traite_par_username}`}
          </p>
        </div>

        {demande.statut === 'EN_ATTENTE' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onReject(demande)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Rejeter"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => onApprove(demande)}
              className="p-2 rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
              title="Approuver"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DemandesPage() {
  const [demandes, setDemandes] = useState<DemandeAcces[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [rejectTarget, setRejectTarget] = useState<DemandeAcces | null>(null)
  const [rejectMotif, setRejectMotif] = useState('')

  const fetchDemandes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await demandesApi.list(filterStatut || undefined)
      setDemandes(data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [filterStatut])

  useEffect(() => { fetchDemandes() }, [fetchDemandes])

  const handleApprove = async (d: DemandeAcces) => {
    try {
      await demandesApi.approve(d.id)
      fetchDemandes()
    } catch { /* silent */ }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      await demandesApi.reject(rejectTarget.id, rejectMotif)
      setRejectTarget(null)
      setRejectMotif('')
      fetchDemandes()
    } catch { /* silent */ }
  }

  const filtered = demandes.filter((d) => {
    const q = search.toLowerCase()
    return (
      d.nom_complet.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q)
    )
  })

  const enAttente = demandes.filter((d) => d.statut === 'EN_ATTENTE').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes d'accès"
        description={`${enAttente} demande${enAttente !== 1 ? 's' : ''} en attente`}
      />

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom ou email..." />
          </div>
          <div className="relative">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="input-field text-sm pr-8 appearance-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="APPROUVEE">Approuvées</option>
              <option value="REFUSEE">Refusées</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucune demande"
            description={search ? 'Aucune demande ne correspond à votre recherche.' : 'Aucune demande d\'accès pour le moment.'}
          />
        ) : (
          <div>
            {filtered.map((d) => (
              <DemandeRow
                key={d.id}
                demande={d}
                onApprove={handleApprove}
                onReject={setRejectTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Rejeter la demande</h2>
              <button onClick={() => { setRejectTarget(null); setRejectMotif('') }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Rejeter la demande de <strong>{rejectTarget.nom_complet}</strong> ({rejectTarget.email}) ?
            </p>
            <div>
              <label className="input-label">Motif du rejet (optionnel)</label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="Expliquez le motif du rejet..."
                value={rejectMotif}
                onChange={(e) => setRejectMotif(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRejectTarget(null); setRejectMotif('') }} className="btn-secondary">Annuler</button>
              <button onClick={handleReject} className="btn-danger">Rejeter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
