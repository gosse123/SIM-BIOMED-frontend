import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/app/AuthContext'
import { canManageUsers, canViewIndicators } from '@/utils/permissions'
import { ROLE_LABELS } from '@/utils/permissions'
import type { User } from '@/types/auth'
import {
  LayoutDashboard,
  Wrench,
  AlertTriangle,
  Settings,
  Shield,
  BarChart3,
  ClipboardList,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Activity,
  Users,
  FileCheck,
} from 'lucide-react'
import SyncStatus from '@/components/SyncStatus'
import NotificationsBell from '@/components/NotificationsBell'
import { workqueueApi } from '@/services/workqueue'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  badge?: boolean
  show?: (user: User | null) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/workqueue', label: 'File de travail', icon: ClipboardList, badge: true },
  { to: '/equipment', label: 'Parc équipements', icon: Settings },
  { to: '/failures', label: 'Gestion des pannes', icon: AlertTriangle },
  { to: '/interventions', label: 'Interventions', icon: Wrench },
  { to: '/preventive', label: 'Maintenance préventive', icon: Shield },
  { to: '/demandes', label: 'Demandes d\'accès', icon: FileCheck, show: canManageUsers },
  { to: '/users', label: 'Gestion des utilisateurs', icon: Users, show: canManageUsers },
  { to: '/indicators', label: 'Indicateurs', icon: BarChart3, show: canViewIndicators },
]

export default function SidebarLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    workqueueApi
      .get()
      .then((d) => {
        if (!cancelled) setQueueCount(d.total_ouvertes)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-medical-primary flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <span className="block text-sm font-bold text-white tracking-tight truncate">SIM-BIOMED</span>
            <span className="block text-[10px] text-slate-400 truncate">Maintenance Biomédicale</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Navigation principale">
        {NAV_ITEMS.filter((item) => !item.show || item.show(user)).map((item) => {
          const Icon = item.icon
          const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-medical-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
              {(!collapsed || isMobile) && item.badge && queueCount > 0 && (
                <span
                  className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-critical-pulse"
                  aria-label={`${queueCount} panne${queueCount > 1 ? 's' : ''} ouverte${queueCount > 1 ? 's' : ''} dans la file de travail`}
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        {(!collapsed || isMobile) ? (
          <div className="flex items-center gap-3 px-2">
            <Link to="/profile" className="flex items-center gap-3 min-w-0 flex-1 group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate group-hover:text-sky-300 transition-colors">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.role ? ROLE_LABELS[user.role] : ''}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-app-bg">
      <a href="#main-content" className="skip-nav">Aller au contenu principal</a>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-nav shrink-0 transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[280px] h-full bg-nav shadow-modal animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent isMobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              aria-label={collapsed ? 'Développer la barre latérale' : 'Réduire la barre latérale'}
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
            </button>
            <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-500" aria-label="Fil d'Ariane">
              {NAV_ITEMS.find((n) => n.to === '/' && location.pathname === '/') && (
                <span className="text-slate-700 font-medium">Tableau de bord</span>
              )}
              {NAV_ITEMS.filter((n) => n.to !== '/' && (!n.show || n.show(user))).map((n) => {
                if (!location.pathname.startsWith(n.to)) return null
                return (
                  <span key={n.to} className="flex items-center gap-1.5">
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-700 font-medium">{n.label}</span>
                  </span>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Site Central — Hôpital Nord</span>
            </div>
            <NotificationsBell />
            <SyncStatus />
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-[1680px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
