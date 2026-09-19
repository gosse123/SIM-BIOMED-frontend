import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { equipmentApi } from '@/services/equipment'
import type { Equipment, Service, Localisation } from '@/types/equipment'

const STATUT_LABELS: Record<string, string> = {
  FONCTIONNEL: 'Fonctionnel',
  FONCTIONNEL_SOUS_SURVEILLANCE: 'Sous surveillance',
  EN_PANNE: 'En panne',
  EN_MAINTENANCE: 'En maintenance',
  EN_ATTENTE_PIECE_OU_PRESTATAIRE: 'En attente',
  HORS_SERVICE: 'Hors service',
  REFORME: 'Réformé',
}

const STATUT_BADGE: Record<string, string> = {
  FONCTIONNEL: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  FONCTIONNEL_SOUS_SURVEILLANCE: 'bg-amber-50 text-amber-800 border border-amber-200',
  EN_PANNE: 'bg-error-container text-on-error-container border border-error/20',
  EN_MAINTENANCE: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary/20',
  EN_ATTENTE_PIECE_OU_PRESTATAIRE: 'bg-surface-variant text-on-surface border border-outline-variant',
  HORS_SERVICE: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  REFORME: 'bg-surface-container-high text-outline border border-outline-variant',
}

export default function EquipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isCreate = !id || id === 'new'

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [locations, setLocations] = useState<Localisation[]>([])
  const [isLoading, setIsLoading] = useState(!isCreate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    num_inventaire: '',
    nom: '',
    type_equipement: '',
    categorie: '',
    marque: '',
    modele: '',
    num_serie: '',
    service: '',
    localisation: '',
    date_reception: '',
    date_installation: '',
    date_mise_service: '',
    etat_operationnel: 'FONCTIONNEL',
    niveau_criticite: 'MOYEN',
  })

  useEffect(() => {
    Promise.all([equipmentApi.listServices(), equipmentApi.listLocations()])
      .then(([s, l]) => { setServices(s); setLocations(l) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (id && id !== 'new') {
      equipmentApi.get(Number(id))
        .then((eq) => {
          setEquipment(eq)
          setForm({
            num_inventaire: eq.num_inventaire,
            nom: eq.nom,
            type_equipement: eq.type_equipement,
            categorie: eq.categorie,
            marque: eq.marque,
            modele: eq.modele,
            num_serie: eq.num_serie || '',
            service: String(eq.service),
            localisation: String(eq.localisation),
            date_reception: eq.date_reception || '',
            date_installation: eq.date_installation || '',
            date_mise_service: eq.date_mise_service || '',
            etat_operationnel: eq.etat_operationnel,
            niveau_criticite: eq.niveau_criticite,
          })
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        service: Number(form.service),
        localisation: Number(form.localisation),
      }
      if (isCreate) {
        const result = await equipmentApi.create(payload)
        navigate(`/equipment/${result.id}`)
      } else {
        await equipmentApi.update(Number(id), payload)
        navigate(`/equipment/${id}`)
      }
    } catch (err: any) {
      const msg = err?.response?.data
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Erreur lors de la sauvegarde.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="p-6 text-on-surface-variant">Chargement...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/equipment" className="hover:text-primary">Inventaire du parc</Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">{isCreate ? 'Nouvel équipement' : `#${id}`}</span>
      </div>

      <h1 className="text-xl font-bold text-on-surface">
        {isCreate ? 'Ajouter un équipement' : `Modifier ${equipment?.nom || ''}`}
      </h1>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-6">
        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Identification */}
        <div className="space-y-4">
          <h2 className="font-semibold text-on-surface border-b border-surface-container pb-2">Identification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">N° Inventaire *</label>
              <input name="num_inventaire" value={form.num_inventaire} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Nom *</label>
              <input name="nom" value={form.nom} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Type d'équipement *</label>
              <input name="type_equipement" value={form.type_equipement} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Catégorie *</label>
              <input name="categorie" value={form.categorie} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Marque *</label>
              <input name="marque" value={form.marque} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Modèle *</label>
              <input name="modele" value={form.modele} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">N° Série</label>
              <input name="num_serie" value={form.num_serie} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Affectation */}
        <div className="space-y-4">
          <h2 className="font-semibold text-on-surface border-b border-surface-container pb-2">Affectation & Localisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Service *</label>
              <select name="service" value={form.service} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required>
                <option value="">Sélectionner un service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Localisation *</label>
              <select name="localisation" value={form.localisation} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" required>
                <option value="">Sélectionner une localisation</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.batiment} - {l.salle}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <h2 className="font-semibold text-on-surface border-b border-surface-container pb-2">Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Réception</label>
              <input name="date_reception" type="date" value={form.date_reception} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Installation</label>
              <input name="date_installation" type="date" value={form.date_installation} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Mise en service</label>
              <input name="date_mise_service" type="date" value={form.date_mise_service} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Statut */}
        <div className="space-y-4">
          <h2 className="font-semibold text-on-surface border-b border-surface-container pb-2">État</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">État opérationnel</label>
              <select name="etat_operationnel" value={form.etat_operationnel} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary">
                <option value="FONCTIONNEL">Fonctionnel</option>
                <option value="FONCTIONNEL_SOUS_SURVEILLANCE">Fonctionnel sous surveillance</option>
                <option value="EN_PANNE">En panne</option>
                <option value="EN_MAINTENANCE">En maintenance</option>
                <option value="EN_ATTENTE_PIECE_OU_PRESTATAIRE">En attente</option>
                <option value="HORS_SERVICE">Hors service</option>
                <option value="REFORME">Réformé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Criticité</label>
              <select name="niveau_criticite" value={form.niveau_criticite} onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-outline rounded-lg bg-surface focus:ring-2 focus:ring-primary">
                <option value="FAIBLE">Faible</option>
                <option value="MOYEN">Moyen</option>
                <option value="ELEVE">Élevé</option>
                <option value="CRITIQUE">Critique</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-lg text-sm font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement...' : isCreate ? 'Créer l\'équipement' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  )
}
