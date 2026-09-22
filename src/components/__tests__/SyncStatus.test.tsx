import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SyncStatus from '@/components/SyncStatus'

// Mock AuthContext
vi.mock('@/app/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { role: 'ADMINISTRATEUR', first_name: 'Admin', last_name: 'Test' },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}))

// Mock network and sync services
vi.mock('@/services/network', () => ({
  network: {
    isOnline: () => true,
    onChange: (cb: (online: boolean) => void) => {
      cb(true)
      return () => {}
    },
  },
}))

vi.mock('@/services/sync', () => ({
  syncEngine: {
    status: 'idle',
    pendingCount: 0,
    sync: vi.fn().mockResolvedValue({ synced: 0, errors: 0 }),
    onStatusChange: (cb: (status: string, count: number) => void) => {
      cb('idle', 0)
      return () => {}
    },
  },
}))

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  )
}

describe('SyncStatus', () => {
  it('renders nothing when idle and no pending', () => {
    const { container } = renderWithProviders(<SyncStatus />)
    expect(container.innerHTML).toBe('')
  })
})
