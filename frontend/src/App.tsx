import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/routes/ProtectedRoute'
import { LoginPage } from '@/routes/LoginPage'
import { SignupPage } from '@/routes/SignupPage'
import { DashboardPage } from '@/routes/DashboardPage'
import { EventsPage } from '@/routes/EventsPage'
import { ChecklistsPage } from '@/routes/ChecklistsPage'
import { StatsPage } from '@/routes/StatsPage'
import { CalendarPage } from '@/routes/CalendarPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/checklists" element={<ChecklistsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Route>
    </Routes>
  )
}

export default App
