import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './AuthContext'
import { ToastContainer } from '@/components/ui/Toast'
import SidebarLayout from '@/layouts/SidebarLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import EquipmentListPage from '@/pages/EquipmentListPage'
import EquipmentDetailPage from '@/pages/EquipmentDetailPage'
import EquipmentFormPage from '@/pages/EquipmentFormPage'
import PannesListPage from '@/pages/PannesListPage'
import ReportPannePage from '@/pages/ReportPannePage'
import PanneDetailPage from '@/pages/PanneDetailPage'
import InterventionsListPage from '@/pages/InterventionsListPage'
import InterventionFormPage from '@/pages/InterventionFormPage'
import InterventionDetailPage from '@/pages/InterventionDetailPage'
import WorkQueuePage from '@/pages/WorkQueuePage'
import PreventivePage from '@/pages/PreventivePage'
import IndicateursPage from '@/pages/IndicateursPage'
import ProfilePage from '@/pages/ProfilePage'
import UsersPage from '@/pages/UsersPage'
import DemandesPage from '@/pages/DemandesPage'
import CompleteProfilePage from '@/pages/CompleteProfilePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Redirect to profile completion if needed
  if (user && !user.profil_complete) {
    return <Navigate to="/complete-profile" replace />
  }
  return <>{children}</>
}

function CompleteProfileRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.profil_complete) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/complete-profile" element={<CompleteProfileRoute><CompleteProfilePage /></CompleteProfileRoute>} />

      <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/equipment" element={<EquipmentListPage />} />
        <Route path="/equipment/new" element={<EquipmentFormPage />} />
        <Route path="/equipment/:id/edit" element={<EquipmentFormPage />} />
        <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
        <Route path="/failures" element={<PannesListPage />} />
        <Route path="/failures/new" element={<ReportPannePage />} />
        <Route path="/failures/:id" element={<PanneDetailPage />} />
        <Route path="/interventions" element={<InterventionsListPage />} />
        <Route path="/interventions/new" element={<InterventionFormPage />} />
        <Route path="/interventions/:id" element={<InterventionDetailPage />} />
        <Route path="/workqueue" element={<WorkQueuePage />} />
        <Route path="/preventive" element={<PreventivePage />} />
        <Route path="/indicators" element={<IndicateursPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/demandes" element={<DemandesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
