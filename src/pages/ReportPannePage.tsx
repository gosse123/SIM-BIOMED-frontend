import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { panneApi } from '@/services/panne'
import { equipmentApi } from '@/services/equipment'
import type { Equipment } from '@/types/equipment'
import { LoadingState } from '@/components/ui/FeedbackStates'
import PageHeader from '@/components/ui/PageHeader'
import { toast } from '@/components/ui/Toast'
import { AlertTriangle, Save } from 'lucide-react'

export default function ReportPannePage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    equipmentApi.list()
      .then((data) => setEquipmentList(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await panneApi.report({ equipement: Number(selectedEquipment), description_signalement: description })
      if ((result as unknown as Record<string, unknown>)._offline) {
        toast('info', 'Panne enregistrée hors-ligne. Elle sera synchronisée dès la reconnexion.')
      } else {
        toast('success', 'Panne signalée avec succès')
      }
      navigate(`/failures/${result.id}`)
    } catch {
      setError("Erreur lors du signalement. Vérifiez les champs.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Signaler une panne"
        breadcrumbs={[{ label: 'Pannes', href: '/failures' }, { label: 'Signaler' }]}
      />

      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">
            <strong className="font-semibold">Signalement :</strong> L'état initial sera <strong>SIGNALEE</strong>. La qualification est requise avant toute autre action.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
        )}

        <div>
          <label htmlFor="equipment" className="input-label">Équipement défectueux *</label>
          {equipmentList.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-amber-800 mb-1">Aucun équipement enregistré</p>
              <p className="text-amber-700">Ajoutez des équipements au parc avant de signaler une panne.</p>
              <Link to="/equipment" className="text-amber-900 font-semibold underline hover:text-amber-950 mt-2 inline-block">
                → Gestion du parc
              </Link>
            </div>
          ) : (
            <select id="equipment" value={selectedEquipment} onChange={(e) => setSelectedEquipment(e.target.value)} className="input" required>
              <option value="">Sélectionner un équipement</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.nom} ({eq.num_inventaire})</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="description" className="input-label">Description de la panne *</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="input" placeholder="Décrivez le problème observé..." required />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button type="submit" disabled={isSubmitting || !selectedEquipment || !description} className="btn-danger">
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Envoi...' : 'Signaler la panne'}
          </button>
        </div>
      </form>
    </div>
  )
}
