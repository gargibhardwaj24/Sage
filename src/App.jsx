import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import CalendarPage from '@/pages/CalendarPage'
import AuthPage from '@/pages/AuthPage'
import RouteFallback from '@/components/layout/RouteFallback'
import RoseLoader from '@/components/ui/RoseLoader'
import { ThemeProvider } from '@/store/ThemeContext'
import { AuthProvider, useAuth } from '@/store/AuthContext'
import { SettingsProvider } from '@/store/SettingsContext'
import { EventsProvider } from '@/store/EventsContext'
import { ToastProvider } from '@/store/ToastContext'
import { DialogProvider } from '@/store/DialogContext'
import { retryImport } from '@/lib/retryImport'

const DashboardPage = lazy(() => retryImport(() => import('@/pages/DashboardPage')))
const AssistantPage = lazy(() => retryImport(() => import('@/pages/AssistantPage')))
const MethodsPage = lazy(() => retryImport(() => import('@/pages/MethodsPage')))
const WorksheetPage = lazy(() => retryImport(() => import('@/pages/WorksheetPage')))
const AnalyticsPage = lazy(() => retryImport(() => import('@/pages/AnalyticsPage')))

const route = (label, Component) => (
  <Suspense fallback={<RouteFallback label={label} />}>
    <Component />
  </Suspense>
)

function Gate() {
  const { configured, loading, userId } = useAuth()

  if (configured && loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6">
        <RoseLoader size={110} />
        <p className="text-xs font-medium uppercase tracking-widest text-faint">
          Signing you in
        </p>
      </div>
    )
  }

  if (configured && !userId) return <AuthPage />

  return (
    <SettingsProvider>
      <EventsProvider>
        <ToastProvider>
          <DialogProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/calendar" replace />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="dashboard" element={route('Loading dashboard', DashboardPage)} />
                <Route path="assistant" element={route('Waking the assistant', AssistantPage)} />
                <Route path="methods" element={route('Loading methods', MethodsPage)} />
                <Route
                  path="methods/:methodId/worksheet"
                  element={route('Loading the sheet', WorksheetPage)}
                />
                <Route path="analytics" element={route('Crunching your week', AnalyticsPage)} />
                <Route path="*" element={<Navigate to="/calendar" replace />} />
              </Route>
            </Routes>
          </DialogProvider>
        </ToastProvider>
      </EventsProvider>
    </SettingsProvider>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
