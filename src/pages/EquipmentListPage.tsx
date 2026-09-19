import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { equipmentApi } from '@/services/equipment'
import type { Equipment } from '@/types/equipment'

const STATUT_COLORS: Record<string, string> = {
  FONCTIONNEL: 'bg-tertiary/10 text-tertiary border border-tertiary/30',
  FONCTIONNEL_SOUS_SURVEILLANCE: 'bg-secondary-container text-on-secondary-fixed border border-secondary-container',
  EN_PANNE: 'bg-error-container text-on-error-container border border-error-container',
  EN_MAINTENANCE: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary-fixed',
  EN_ATTENTE_PIECE_OU_PRESTATAIRE: 'bg-surface-variant text-on-surface border border-surface-variant',
  HORS_SERVICE: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  REFORME: 'bg-surface-container-high text-outline border border-outline-variant',
}

const STATUT_LABELS: Record<string, string> = {
  FONCTIONNEL: 'Fonctionnel',
  FONCTIONNEL_SOUS_SURVEILLANCE: 'Sous surveillance',
  EN_PANNE: 'En panne',
  EN_MAINTENANCE: 'En maintenance',
  EN_ATTENTE_PIECE_OU_PRESTATAIRE: 'En attente',
  HORS_SERVICE: 'Hors service',
  REFORME: 'Réformé',
}

const CRITICITE_COLORS: Record<string, string> = {
  CRITIQUE: 'bg-error-container text-on-error-container',
  ELEVE: 'bg-surface-variant text-on-surface',
  MOYEN: 'bg-surface-container text-on-surface',
  FAIBLE: 'bg-surface-container-high text-secondary',
}

export default function EquipmentListPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCriticality, setFilterCriticality] = useState('')

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    setIsLoading(true)
    try {
      const data = await equipmentApi.list()
      setEquipment(data.results || data)
    } catch (error) {
      console.error('Erreur chargement équipements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = equipment.filter((eq) => {
    const matchSearch = !search || eq.nom.toLowerCase().includes(search.toLowerCase()) ||
      eq.num_inventaire.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || eq.etat_operationnel === filterStatus
    const matchCrit = !filterCriticality || eq.niveau_criticite === filterCriticality
    return matchSearch && matchStatus && matchCrit
  })

  return (
    <div className="p-6 space-y-6 max-w-[1680px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Gestion du parc biomédical</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {equipment.length} dispositifs répertoriés
          </p>
        </div>
        <Link
          to="/equipment/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition shadow-sm"
        >
          Ajouter un équipement
        </Link>
      </div>

      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les statuts</option>
            <option value="FONCTIONNEL">Fonctionnel</option>
            <option value="FONCTIONNEL_SOUS_SURVEILLANCE">Sous surveillance</option>
            <option value="EN_PANNE">En panne</option>
            <option value="EN_MAINTENANCE">En maintenance</option>
            <option value="REFORME">Réformé</option>
          </select>
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Toutes les criticités</option>
            <option value="CRITIQUE">Critique</option>
            <option value="ELEVE">Élevé</option>
            <option value="MOYEN">Moyen</option>
            <option value="FAIBLE">Faible</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">Chargement...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Équipement</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Criticité</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filtered.map((eq) => (
                <tr key={eq.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-on-surface text-sm">{eq.nom}</div>
                    <div className="text-xs text-on-surface-variant font-mono mt-0.5">
                      {eq.num_inventaire} • {eq.marque}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface">
                    {eq.service_nom || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_COLORS[eq.etat_operationnel] || ''}`}>
                      {STATUT_LABELS[eq.etat_operationnel] || eq.etat_operationnel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${CRITICITE_COLORS[eq.niveau_criticite] || ''}`}>
                      {eq.niveau_criticite}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/equipment/${eq.id}`}
                      className="text-primary hover:text-primary-container text-sm font-semibold"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
