import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isMobileNavMounted, setIsMobileNavMounted] = useState(false)
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(false)

  function openMobileNav() {
    setIsMobileNavMounted(true)
    setIsMobileNavOpen(true)
  }

  function closeMobileNav() {
    setIsMobileNavOpen(false)
  }

  // Trigger the slide-in transition on the next frame after mounting,
  // and unmount the drawer only after the slide-out transition finishes.
  useEffect(() => {
    if (!isMobileNavMounted) return
    if (isMobileNavOpen) {
      const raf = requestAnimationFrame(() => setIsMobileNavVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setIsMobileNavVisible(false)
    const timeoutId = setTimeout(() => setIsMobileNavMounted(false), 300)
    return () => clearTimeout(timeoutId)
  }, [isMobileNavMounted, isMobileNavOpen])

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {isMobileNavMounted && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out ${
              isMobileNavVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMobileNav}
            aria-hidden="true"
          />
          <Sidebar
            className={`relative z-10 h-full w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out ${
              isMobileNavVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
            onNavigate={closeMobileNav}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={openMobileNav} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
