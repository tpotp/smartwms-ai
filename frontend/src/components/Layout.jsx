import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../App'
import { getAlerts } from '../services/api'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/warehouses', label: 'Bodegas', icon: '🏭' },
  { path: '/products', label: 'Productos', icon: '📦' },
  { path: '/inventory', label: 'Inventario', icon: '📋' },
  { path: '/receipts', label: 'Recepciones', icon: '📥' },
  { path: '/orders', label: 'Órdenes', icon: '📝' },
  { path: '/picking', label: 'Picking', icon: '🎯' },
  { path: '/shipments', label: 'Despachos', icon: '🚚' },
  { path: '/alerts', label: 'Alertas', icon: '🔔' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  useEffect(() => {
    getAlerts(true).then((a) => setUnreadAlerts(a.length)).catch(() => {})
    const interval = setInterval(() => {
      getAlerts(true).then((a) => setUnreadAlerts(a.length)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center h-16 px-6 border-b bg-gradient-to-r from-blue-600 to-blue-800">
          <span className="text-xl font-bold text-white">SmartWMS AI</span>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.path === '/alerts' && unreadAlerts > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadAlerts}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-gray-500">{user?.full_name || user?.username}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">{user?.role}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Salir</button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
