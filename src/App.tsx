import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import FriendsPage from './pages/FriendsPage'
import FeedPage from './pages/FeedPage'
import FindPlayersPage from './pages/FindPlayersPage'
import ThreadsPage from './pages/ThreadsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Public routes inside AppShell (no auth required) */}
      <Route element={<AppShell />}>
        <Route path="/profile/:username" element={<ProfilePage />} />
      </Route>

      {/* Protected routes inside AppShell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/find-players" element={<FindPlayersPage />} />
        <Route path="/threads" element={<ThreadsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
