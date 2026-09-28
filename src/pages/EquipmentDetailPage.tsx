import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { equipmentApi } from '@/services/equipment'
import type { Equipment } from '@/types/equipment'
import type { Panne } from '@/types/panne'
import type { Intervention } from '@/types/intervention'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates'
import DeviceDetailHeader from '@/components/equipment/DeviceDetailHeader'
import NavigationTabs from '@/components/equipment/NavigationTabs'
import ManufacturerSpecsCard from '@/components/equipment/ManufacturerSpecsCard'
import MaintenanceContractCard from '@/components/equipment/MaintenanceContractCard'
import ClinicalLocationCard from '@/components/equipment/ClinicalLocationCard'
import MetrologyStatusCard from '@/components/equipment/MetrologyStatusCard'
import ReliabilityKpiGrid from '@/components/equipment/ReliabilityKpiGrid'
import AuditTimeline from '@/components/equipment/AuditTimeline'
import { panneApi } from '@/services/panne'
import { interventionApi } from '@/services/intervention'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Link } from 'react-router-dom'
import { AlertTriangle, Wrench, Calendar } from 'lucide-react'

const TABS = [
  { key: 'infos', label: 'Informations générales' },
  { key: 'historique', label: 'Historique & Traçabilité' },
  { key: 'pannes', label: 'Pannes & Incidents', count: 0 },
  { key: 'interventions', label: 'Interventions réalisées', count: 0 },
  { key: 'preventive', label: 'Maintenance préventive' },
]

export default function EquipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [device, setDevice] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('infos')
  const [pannes, setPannes] = useState<Panne[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    const load = async () => {
      try {
        const eq = await equipmentApi.get(Number(id))
        setDevice(eq)
        setError('')
      } catch {
        setError('Équipement introuvable.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!device) return
    if (activeTab === 'pannes') {
      panneApi.list().then((data) => {
        setPannes(data.filter((p) => p.equipement === device.id))
      }).catch(() => {})
    }
    if (activeTab === 'interventions') {
      interventionApi.list().then((data) => {
        setInterventions(data.filter((i) => i.equipement === device.id))
      }).catch(() => {})
    }
  }, [activeTab, device])

  const handleReportFault = () => {
    navigate(`/failures/new?equipment=${device?.id}`)
  }

  if (loading) return <LoadingState />
  if (error || !device) return <ErrorState message={error || 'Équipement introuvable.'} onRetry={() => navigate('/equipment')} />

  const tabs = TABS.map(t => {
    if (t.key === 'pannes') return { ...t, count: pannes.length }
    if (t.key === 'interventions') return { ...t, count: interventions.length }
    return t
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title=""
        breadcrumbs={[
          { label: 'Inventaire', href: '/equipment' },
          { label: device.nom },
        ]}
      />

      <DeviceDetailHeader device={device} onReportFault={handleReportFault} />

      <NavigationTabs tabs={tabs} currentTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'infos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ManufacturerSpecsCard
              marque={device.marque}
              modele={device.modele}
              num_serie={device.num_serie}
              categorie={device.categorie}
              type_equipement={device.type_equipement}
            />
            <MaintenanceContractCard />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <ClinicalLocationCard equipment={device} />
            <MetrologyStatusCard />
            <ReliabilityKpiGrid />
          </div>
        </div>
      )}

      {activeTab === 'historique' && (
        <AuditTimeline />
      )}

      {activeTab === 'pannes' && (
        <div className="space-y-4">
          {pannes.length === 0 ? (
            <div className="card p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Aucune panne enregistrée pour cet équipement.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase" scope="col">Statut</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase" scope="col">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase" scope="col">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pannes.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3"><StatusBadge status={p.statut} /></td>
                      <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">{p.description_signalement}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{new Date(p.date_signalement).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3"><Link to={`/failures/${p.id}`} className="btn-ghost text-xs">Voir</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'interventions' && (
        <div className="space-y-4">
          {interventions.length === 0 ? (
            <div className="card p-8 text-center">
              <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Aucune intervention enregistrée pour cet équipement.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase" scope="col">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase" scope="col">Statut</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase" scope="col">Temps</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interventions.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-700">{i.type_intervention}</td>
                      <td className="px-4 py-3"><StatusBadge status={i.statut} /></td>
                      <td className="px-4 py-3 text-sm text-slate-500">{i.temps_passe_minutes ? `${i.temps_passe_minutes} min` : '—'}</td>
                      <td className="px-4 py-3"><Link to={`/interventions/${i.id}`} className="btn-ghost text-xs">Voir</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'preventive' && (
        <div className="card p-8 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Maintenance préventive non configurée pour cet équipement.</p>
        </div>
      )}
    </div>
  )
}
