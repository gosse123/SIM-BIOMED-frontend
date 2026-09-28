import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { equipmentApi } from '@/services/equipment'
import type { Equipment, Service, Localisation, StatutOperationnel, Criticite } from '@/types/equipment'
import QrScanner, { type QrEquipmentData } from '@/components/QrScanner'
import PageHeader from '@/components/ui/PageHeader'
import { StatusBadge, CriticalityBadge } from '@/components/ui/StatusBadge'
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates'
import { toast } from '@/components/ui/toast'
import { getApiErrorMessage } from '@/utils/errors'
import { QrCode, Save } from 'lucide-react'

export default function EquipmentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isCreate = !id || id === 'new'

  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [locations, setLocations] = useState<Localisation[]>([])
  const [isLoading, setIsLoading] = useState(!isCreate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showQrScanner, setShowQrScanner] = useState(false)

  const [form, setForm] = useState({
    num_inventaire: '',
    nom: '',
    type_equipement: '',
    categorie: '',
    marque: '',
    modele: '',
    num_serie: '',
    service_nom: '',
    localisation_text: '',
    date_reception: '',
    date_installation: '',
    date_mise_service: '',
    etat_operationnel: 'FONCTIONNEL' as StatutOperationnel,
    niveau_criticite: 'MOYEN' as Criticite,
  })

  const handleQrScan = (data: QrEquipmentData) => {
    setForm((prev) => ({
      ...prev,
      num_inventaire: data.num_inventaire || prev.num_inventaire,
      nom: data.nom || prev.nom,
      marque: data.marque || prev.marque,
      modele: data.modele || prev.modele,
      type_equipement: data.type_equipement || prev.type_equipement,
      service_nom: data.service_nom || prev.service_nom,
      localisation_text: data.localisation_nom || prev.localisation_text,
    }))
    setShowQrScanner(false)
  }

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
            service_nom: eq.service_detail?.nom || eq.service_nom || '',
            localisation_text: eq.localisation_detail ? `${eq.localisation_detail.batiment} - ${eq.localisation_detail.salle}` : eq.localisation_str || '',
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
      // Try to match service/location text to existing IDs
      const matchedService = services.find(s => s.nom.toLowerCase() === form.service_nom.toLowerCase())
      const matchedLocation = locations.find(l => `${l.batiment} - ${l.salle}`.toLowerCase() === form.localisation_text.toLowerCase())

      const payload: Partial<Equipment> = {
        num_inventaire: form.num_inventaire,
        nom: form.nom,
        type_equipement: form.type_equipement,
        categorie: form.categorie,
        marque: form.marque,
        modele: form.modele,
        num_serie: form.num_serie,
        service: matchedService?.id,
        localisation: matchedLocation?.id,
        date_reception: form.date_reception || undefined,
        date_installation: form.date_installation || undefined,
        date_mise_service: form.date_mise_service || undefined,
        etat_operationnel: form.etat_operationnel,
        niveau_criticite: form.niveau_criticite,
      }
      if (isCreate) {
        const result = await equipmentApi.create(payload)
        toast('success', 'Équipement créé avec succès')
        navigate(`/equipment/${result.id}`)
      } else {
        await equipmentApi.update(Number(id), payload)
        toast('success', 'Modifications enregistrées')
        navigate(`/equipment/${id}`)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la sauvegarde.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <LoadingState />
  if (!isCreate && !equipment) return <ErrorState message="Équipement introuvable." onRetry={() => navigate('/equipment')} />

  return (
    <div className="space-y-6">
      {showQrScanner && <QrScanner onScan={handleQrScan} onClose={() => setShowQrScanner(false)} />}

      <PageHeader
        title={isCreate ? 'Ajouter un équipement' : `Modifier ${equipment?.nom || ''}`}
        breadcrumbs={[
          { label: 'Inventaire', href: '/equipment' },
          { label: isCreate ? 'Nouveau' : `#${id}` },
        ]}
        action={
          !isCreate && equipment ? (
            <div className="flex items-center gap-3">
              <StatusBadge status={equipment.etat_operationnel} size="md" />
              <CriticalityBadge level={equipment.niveau_criticite} />
            </div>
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
        )}

        <div className="flex items-center justify-between">
          <h2>Identification</h2>
          <button type="button" onClick={() => setShowQrScanner(true)} className="btn-secondary text-xs">
            <QrCode className="w-4 h-4" /> Scanner QR
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="num_inventaire" className="input-label">N° Inventaire *</label>
            <input id="num_inventaire" name="num_inventaire" value={form.num_inventaire} onChange={handleChange} className="input mono" required />
          </div>
          <div>
            <label htmlFor="nom" className="input-label">Nom *</label>
            <input id="nom" name="nom" value={form.nom} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label htmlFor="type_equipement" className="input-label">Type d'équipement *</label>
            <input id="type_equipement" name="type_equipement" value={form.type_equipement} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label htmlFor="categorie" className="input-label">Catégorie *</label>
            <input id="categorie" name="categorie" value={form.categorie} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label htmlFor="marque" className="input-label">Marque *</label>
            <input id="marque" name="marque" value={form.marque} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label htmlFor="modele" className="input-label">Modèle *</label>
            <input id="modele" name="modele" value={form.modele} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label htmlFor="num_serie" className="input-label">N° Série</label>
            <input id="num_serie" name="num_serie" value={form.num_serie} onChange={handleChange} className="input mono" />
          </div>
        </div>

        <h2>Affectation & Localisation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="service_nom" className="input-label">Service *</label>
            <input
              id="service_nom"
              name="service_nom"
              value={form.service_nom}
              onChange={handleChange}
              className="input"
              placeholder="Ex: Réanimation, Imagerie, Chirurgie..."
              required
              list="services-list"
            />
            <datalist id="services-list">
              {services.map(s => <option key={s.id} value={s.nom} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="localisation_text" className="input-label">Localisation *</label>
            <input
              id="localisation_text"
              name="localisation_text"
              value={form.localisation_text}
              onChange={handleChange}
              className="input"
              placeholder="Ex: Bâtiment A, Salle 201"
              required
              list="locations-list"
            />
            <datalist id="locations-list">
              {locations.map(l => <option key={l.id} value={`${l.batiment} - ${l.salle}`} />)}
            </datalist>
          </div>
        </div>

        <h2>État</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="etat_operationnel" className="input-label">État opérationnel</label>
            <select id="etat_operationnel" name="etat_operationnel" value={form.etat_operationnel} onChange={handleChange} className="input">
              <option value="FONCTIONNEL">Fonctionnel</option>
              <option value="FONCTIONNEL_SOUS_SURVEILLANCE">Sous surveillance</option>
              <option value="EN_PANNE">En panne</option>
              <option value="EN_MAINTENANCE">En maintenance</option>
              <option value="EN_ATTENTE_PIECE_OU_PRESTATAIRE">En attente</option>
              <option value="HORS_SERVICE">Hors service</option>
              <option value="REFORME">Réformé</option>
            </select>
          </div>
          <div>
            <label htmlFor="niveau_criticite" className="input-label">Criticité</label>
            <select id="niveau_criticite" name="niveau_criticite" value={form.niveau_criticite} onChange={handleChange} className="input">
              <option value="FAIBLE">Faible</option>
              <option value="MOYEN">Moyen</option>
              <option value="ELEVE">Élevé</option>
              <option value="CRITIQUE">Critique</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Enregistrement...' : isCreate ? "Créer l'équipement" : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
