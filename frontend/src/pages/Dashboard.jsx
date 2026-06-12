import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard, generateAlerts } from '../services/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getDashboard().then(setData).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleGenerateAlerts = async () => {
    await generateAlerts()
    load()
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  const cards = [
    { label: 'Productos', value: data?.total_products || 0, color: 'bg-blue-500', link: '/products' },
    { label: 'Valor Inventario', value: `$${(data?.total_inventory_value || 0).toLocaleString()}`, color: 'bg-green-500', link: '/inventory' },
    { label: 'Órdenes Pendientes', value: data?.total_orders_pending || 0, color: 'bg-orange-500', link: '/orders' },
    { label: 'Alertas', value: data?.total_alerts || 0, color: 'bg-red-500', link: '/alerts' },
    { label: 'Stock Bajo', value: data?.low_stock_count || 0, color: 'bg-yellow-500', link: '/inventory' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button onClick={handleGenerateAlerts} className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Generar Alertas IA</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white font-bold mb-3`}>
              {card.label[0]}
            </div>
            <div className="text-2xl font-bold text-gray-800">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
          <div className="space-y-3">
            {data?.recent_activity?.length > 0 ? data.recent_activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">{a.action}</p>
                  <p className="text-gray-400 text-xs">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            )) : <p className="text-gray-400 text-sm">Sin actividad reciente</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Alertas Activas</h2>
            <Link to="/alerts" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {data?.alerts?.length > 0 ? data.alerts.map((a) => (
              <div key={a.id} className={`p-3 rounded-lg text-sm ${
                a.type === 'low_stock' ? 'bg-red-50 text-red-700' :
                a.type === 'over_stock' ? 'bg-yellow-50 text-yellow-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                <strong>{a.title}</strong>
                <p>{a.message}</p>
              </div>
            )) : <p className="text-gray-400 text-sm">Sin alertas activas</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
