import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import AuthPage from '@/pages/AuthPage'
import RouteFallback from '@/components/layout/RouteFallback'
import { ThemeProvider } from '@/store/ThemeContext'
import { AuthProvider, useAuth } from '@/store/AuthContext'
import { SettingsProvider } from '@/store/SettingsContext'
import { EventsProvider } from '@/store/EventsContext'
import { ToastProvider } from '@/store/ToastContext'
import { DialogProvider } from '@/store/DialogContext'

const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const AssistantPage = lazy(() => import('@/pages/AssistantPage'))
const MethodsPage = lazy(() => import('@/pages/MethodsPage'))
const WorksheetPage = lazy(() => import('@/pages/WorksheetPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))

const route = (label, Component) => (
  <Suspense fallback={<RouteFallback label={label} />}>
    <Component />
  </Suspense>
)

function Gate() {
  const { configured, loading, userId } = useAuth()

  if (configured && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <RouteFallback label="Signing you in" />
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
                <Route index element={<DashboardPage />} />
                <Route path="calendar" element={route('Loading calendar', CalendarPage)} />
                <Route path="assistant" element={route('Waking the assistant', AssistantPage)} />
                <Route path="methods" element={route('Loading methods', MethodsPage)} />
                <Route
                  path="methods/:methodId/worksheet"
                  element={route('Loading the sheet', WorksheetPage)}
                />
                <Route path="analytics" element={route('Crunching your week', AnalyticsPage)} />
                <Route path="*" element={<Navigate to="/" replace />} />
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
