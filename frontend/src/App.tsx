import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/routes/ProtectedRoute'
import { LoginPage } from '@/routes/LoginPage'
import { SignupPage } from '@/routes/SignupPage'
import { DashboardPage } from '@/routes/DashboardPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App
