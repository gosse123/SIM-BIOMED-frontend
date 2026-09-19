import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import SidebarLayout from '@/layouts/SidebarLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import EquipmentListPage from '@/pages/EquipmentListPage'
import EquipmentDetailPage from '@/pages/EquipmentDetailPage'
import PannesListPage from '@/pages/PannesListPage'
import ReportPannePage from '@/pages/ReportPannePage'
import PanneDetailPage from '@/pages/PanneDetailPage'
import InterventionsListPage from '@/pages/InterventionsListPage'
import WorkQueuePage from '@/pages/WorkQueuePage'
import PreventivePage from '@/pages/PreventivePage'
import IndicateursPage from '@/pages/IndicateursPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
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

      <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/equipment" element={<EquipmentListPage />} />
        <Route path="/equipment/new" element={<EquipmentDetailPage />} />
        <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
        <Route path="/failures" element={<PannesListPage />} />
        <Route path="/failures/new" element={<ReportPannePage />} />
        <Route path="/failures/:id" element={<PanneDetailPage />} />
        <Route path="/interventions" element={<InterventionsListPage />} />
        <Route path="/workqueue" element={<WorkQueuePage />} />
        <Route path="/preventive" element={<PreventivePage />} />
        <Route path="/indicators" element={<IndicateursPage />} />
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
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
