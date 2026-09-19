import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { panneApi } from '@/services/panne'
import { equipmentApi } from '@/services/equipment'
import type { Equipment } from '@/types/equipment'

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
      .then((data) => setEquipmentList(data.results || data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await panneApi.report({
        equipement: Number(selectedEquipment),
        description_signalement: description,
      })
      navigate(`/failures/${result.id}`)
    } catch {
      setError("Erreur lors du signalement. Vérifiez les champs.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-sm text-on-surface-variant mb-2">
        <Link to="/failures" className="hover:text-primary">Pannes</Link>
        <span className="mx-2">/</span>
        <span className="text-on-surface font-semibold">Signaler une panne</span>
      </div>

      <div className="bg-error/5 border-l-4 border-error p-4 rounded-r-lg">
        <p className="text-xs text-on-surface font-medium">
          <strong className="font-semibold text-error">Signalement de panne :</strong>{' '}
          L'état initial sera <strong>SIGNALEE</strong>. La qualification est ensuite requise avant toute autre action.
        </p>
      </div>

      <h1 className="text-2xl font-bold text-on-surface">Signaler une panne</h1>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-4">
        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">Équipement défectueux *</label>
          {isLoading ? (
            <div className="text-sm text-on-surface-variant">Chargement...</div>
          ) : equipmentList.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">Aucun équipement enregistré</p>
              <p className="text-amber-700">
                Vous devez d'abord ajouter des équipements au parc avant de pouvoir signaler une panne.
              </p>
              <Link to="/equipment" className="inline-block mt-2 text-amber-900 font-semibold underline hover:text-amber-950">
                → Aller à la gestion du parc
              </Link>
            </div>
          ) : (
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Sélectionner un équipement</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nom} ({eq.num_inventaire})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1">
            Description de la panne *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary"
            placeholder="Décrivez le problème observé..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-lg text-sm font-bold text-on-error bg-error hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Signaler la panne'}
        </button>
      </form>
    </div>
  )
}
