import React, { useState, useEffect } from 'react'
import { getAlerts, markAlertRead, generateAlerts } from '../services/api'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [showAll, setShowAll] = useState(false)

  const load = () => getAlerts(!showAll).then(setAlerts)
  useEffect(() => { load() }, [showAll])

  const handleMarkRead = async (id) => {
    await markAlertRead(id)
    load()
  }

  const handleGenerate = async () => {
    await generateAlerts()
    load()
  }

  const getAlertColor = (type) => {
    if (type === 'low_stock') return 'bg-red-50 border-red-200'
    if (type === 'over_stock') return 'bg-yellow-50 border-yellow-200'
    return 'bg-blue-50 border-blue-200'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Alertas Inteligentes</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowAll(!showAll)} className="text-sm bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            {showAll ? 'Solo no leídas' : 'Ver todas'}
          </button>
          <button onClick={handleGenerate} className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Generar Alertas IA</button>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500">No hay alertas {showAll ? '' : 'sin leer'}</p>
            <button onClick={handleGenerate} className="mt-3 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Generar alertas automáticas</button>
          </div>
        )}
        {alerts.map((a) => (
          <div key={a.id} className={`rounded-xl border p-4 ${getAlertColor(a.type)} ${a.is_read ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{a.title}</span>
                  {!a.is_read && <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Nueva</span>}
                </div>
                <p className="text-sm mt-1">{a.message}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              {!a.is_read && (
                <button onClick={() => handleMarkRead(a.id)} className="text-xs text-blue-600 hover:underline ml-4 flex-shrink-0">Marcar leída</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
