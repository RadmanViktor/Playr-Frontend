import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ConfirmEmailPage from './pages/ConfirmEmailPage'
import HomePage from './pages/HomePage'
import FriendsPage from './pages/FriendsPage'
import FeedPage from './pages/FeedPage'
import PostDetailPage from './pages/PostDetailPage'
import FindPlayersPage from './pages/FindPlayersPage'
import ChatsPage from './pages/ChatsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage'
import SteamAccountSettingsPage from './pages/settings/SteamAccountSettingsPage'
import ProfileSettingsPage from './pages/settings/ProfileSettingsPage'
import OnboardingPage from './pages/OnboardingPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowIncompleteOnboarding>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

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
        <Route path="/posts/:postId" element={<PostDetailPage />} />
        <Route path="/find-players" element={<FindPlayersPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        <Route path="/settings/steam" element={<SteamAccountSettingsPage />} />
        <Route path="/settings/profile" element={<ProfileSettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
