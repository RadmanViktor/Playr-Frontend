import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { StatusProvider } from './context/StatusContext.tsx'
import { NotificationPreferencesProvider } from './context/NotificationPreferencesContext.tsx'
import { NotificationProvider } from './context/NotificationContext.tsx'
import { ChatProvider } from './context/ChatContext.tsx'
import { CreatePostModalProvider } from './context/CreatePostModalContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StatusProvider>
          <NotificationPreferencesProvider>
            <NotificationProvider>
              <ChatProvider>
                <CreatePostModalProvider>
                  <App />
                </CreatePostModalProvider>
              </ChatProvider>
            </NotificationProvider>
          </NotificationPreferencesProvider>
        </StatusProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
