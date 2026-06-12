import React, { useState, useEffect } from 'react'
import { getPickingTasks, assignPicking, completePicking, getOrders } from '../services/api'

export default function Picking() {
  const [tasks, setTasks] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      getPickingTasks(),
      getOrders('pending'),
    ]).then(([t, o]) => {
      setTasks(t)
      setOrders(o)
    }).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleAssign = async (orderId) => {
    await assignPicking(orderId)
    load()
  }

  const handleComplete = async (taskId) => {
    await completePicking(taskId)
    load()
  }

  const getStatusBadge = (status) => {
    const colors = { assigned: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700' }
    return <span className={`${colors[status] || 'bg-gray-100 text-gray-700'} px-2 py-0.5 rounded-full text-xs`}>{status}</span>
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Picking</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Órdenes Pendientes</h2>
          {orders.length === 0 ? <p className="text-gray-400 text-sm">No hay órdenes pendientes</p> : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <span className="font-mono text-blue-600 text-sm">{o.order_number}</span>
                    <p className="text-xs text-gray-500">{o.customer || 'Sin cliente'} · {o.items?.length || 0} items</p>
                  </div>
                  <button onClick={() => handleAssign(o.id)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Asignar Picking</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Tareas de Picking</h2>
          {tasks.length === 0 ? <p className="text-gray-400 text-sm">Sin tareas asignadas</p> : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Tarea #{t.id}</span>
                    <p className="text-xs text-gray-500">Orden: {t.order?.order_number || t.order_id}</p>
                    <div className="mt-1">{getStatusBadge(t.status)}</div>
                  </div>
                  {t.status !== 'completed' && (
                    <button onClick={() => handleComplete(t.id)} className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Completar</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
