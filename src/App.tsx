import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import FeedPage from './pages/FeedPage'
import FindPlayersPage from './pages/FindPlayersPage'
import ThreadsPage from './pages/ThreadsPage'
import ProfilePage from './pages/ProfilePage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/find-players" element={<FindPlayersPage />} />
        <Route path="/threads" element={<ThreadsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

export default App
