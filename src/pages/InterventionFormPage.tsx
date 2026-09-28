import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { interventionApi } from '@/services/intervention'
import { equipmentApi } from '@/services/equipment'
import { panneApi } from '@/services/panne'
import type { Equipment } from '@/types/equipment'
import type { Panne } from '@/types/panne'
import type { TypeIntervention } from '@/types/intervention'
import { TYPE_INTERVENTION_LABELS } from '@/types/intervention'
import { LoadingState } from '@/components/ui/FeedbackStates'
import PageHeader from '@/components/ui/PageHeader'
import { toast } from '@/components/ui/toast'
import { getApiErrorMessage } from '@/utils/errors'
import { Wrench, ShieldAlert } from 'lucide-react'

export default function InterventionFormPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [pannes, setPannes] = useState<Panne[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [selectedPanne, setSelectedPanne] = useState('')
  const [typeIntervention, setTypeIntervention] = useState<TypeIntervention>('CORRECTIVE')
  const [description, setDescription] = useState('')
  const [pieces, setPieces] = useState('')
  const [horsService, setHorsService] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const equipmentParam = searchParams.get('equipment')
    if (equipmentParam) setSelectedEquipment(equipmentParam)
  }, [searchParams])

  useEffect(() => {
    Promise.all([equipmentApi.list(), panneApi.list()])
      .then(([equipment, panneData]) => {
        setEquipmentList(Array.isArray(equipment) ? equipment : [])
        setPannes(Array.isArray(panneData) ? panneData : [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const openPannes = pannes.filter(
    (p) => p.statut !== 'CLOSE' && (!selectedEquipment || p.equipement === Number(selectedEquipment)),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await interventionApi.create({
        equipement: Number(selectedEquipment),
        panne: selectedPanne ? Number(selectedPanne) : undefined,
        type_intervention: typeIntervention,
        description,
        pieces_utilisees: pieces || undefined,
        hors_service_total: horsService,
      })
      if ((result as unknown as Record<string, unknown>)._offline) {
        toast('info', "Intervention enregistrée hors-ligne. Elle sera synchronisée dès la reconnexion.")
        navigate('/interventions')
      } else {
        toast('success', 'Intervention créée avec succès')
        navigate(`/interventions/${result.id}`)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors de la création de l'intervention."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Nouvelle intervention"
        breadcrumbs={[{ label: 'Interventions', href: '/interventions' }, { label: 'Nouvelle' }]}
      />

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Équipement */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Équipement concerné</h2>
            <p className="text-xs text-slate-500 mt-0.5">L'intervention est enregistrée sur cet appareil (RB-IN-001).</p>
          </div>

          {equipmentList.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-amber-800 mb-1">Aucun équipement enregistré</p>
              <p className="text-amber-700">Ajoutez des équipements au parc avant de planifier une intervention.</p>
              <Link to="/equipment" className="text-amber-900 font-semibold underline hover:text-amber-950 mt-2 inline-block">
                → Gestion du parc
              </Link>
            </div>
          ) : (
            <div>
              <label htmlFor="equipment" className="input-label">Équipement *</label>
              <select
                id="equipment"
                value={selectedEquipment}
                onChange={(e) => {
                  setSelectedEquipment(e.target.value)
                  setSelectedPanne('')
                }}
                className="input"
                required
              >
                <option value="">Sélectionner un équipement</option>
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.nom} ({eq.num_inventaire})</option>
                ))}
              </select>
            </div>
          )}

          {selectedEquipment && (
            <div>
              <label htmlFor="panne" className="input-label">Panne liée (optionnel)</label>
              <select
                id="panne"
                value={selectedPanne}
                onChange={(e) => setSelectedPanne(e.target.value)}
                className="input"
                disabled={openPannes.length === 0}
              >
                <option value="">
                  {openPannes.length === 0 ? 'Aucune panne ouverte pour cet équipement' : 'Aucune (intervention hors signalement)'}
                </option>
                {openPannes.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} — {(p.description_signalement || 'Signalement sans description').slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Nature */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Nature de l'intervention</h2>
            <p className="text-xs text-slate-500 mt-0.5">Type, actions réalisées et pièces consommées (RB-IN-002, RB-IN-003).</p>
          </div>

          <div>
            <label htmlFor="type" className="input-label">Type *</label>
            <select
              id="type"
              value={typeIntervention}
              onChange={(e) => setTypeIntervention(e.target.value as TypeIntervention)}
              className="input"
              required
            >
              {(Object.entries(TYPE_INTERVENTION_LABELS) as [TypeIntervention, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="input-label">Description des actions *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input"
              placeholder="Décrivez les actions effectuées ou prévues sur l'équipement..."
              required
            />
          </div>

          <div>
            <label htmlFor="pieces" className="input-label">Pièces consommées</label>
            <textarea
              id="pieces"
              value={pieces}
              onChange={(e) => setPieces(e.target.value)}
              rows={2}
              className="input"
              placeholder="Références et quantités : ex. filtre F-220 × 1, fusible 5A × 2"
            />
            <p className="text-xs text-slate-500 mt-1">Toute pièce remplacée doit être tracée (RB-IN-003).</p>
          </div>
        </div>

        {/* Immobilisation */}
        <div className="pt-4 border-t border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={horsService}
              onChange={(e) => setHorsService(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              <span className="text-sm font-medium text-slate-800">Mettre l'équipement hors service</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Immobilisation totale dès la création de l'intervention (RB-CL-002).
              </span>
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Link to="/interventions" className="btn-ghost text-xs">Annuler</Link>
          <button
            type="submit"
            disabled={isSubmitting || !selectedEquipment || !description}
            className="btn-primary"
          >
            <Wrench className="w-4 h-4" />
            {isSubmitting ? 'Création...' : "Créer l'intervention"}
          </button>
        </div>
      </form>

      <div className="flex items-start gap-2 text-xs text-slate-500">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          L'intervention démarre au statut <strong className="text-slate-700">Planifiée</strong> : elle devra être
          démarrée depuis sa fiche avant d'être terminée.
        </p>
      </div>
    </div>
  )
}
