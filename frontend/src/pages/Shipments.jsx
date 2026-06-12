import React, { useState, useEffect } from 'react'
import { getShipments, createShipment, dispatchShipment, getOrders } from '../services/api'

export default function Shipments() {
  const [shipments, setShipments] = useState([])
  const [orders, setOrders] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ order_id: '', tracking_number: '' })

  const load = () => {
    getShipments().then(setShipments)
    getOrders('picked').then(setOrders)
  }
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await createShipment(Number(form.order_id), form.tracking_number)
    setShowForm(false)
    setForm({ order_id: '', tracking_number: '' })
    load()
  }

  const handleDispatch = async (id) => {
    await dispatchShipment(id)
    load()
  }

  const getStatusBadge = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-700', dispatched: 'bg-green-100 text-green-700' }
    return <span className={`${colors[status] || 'bg-gray-100 text-gray-700'} px-2 py-0.5 rounded-full text-xs`}>{status}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Despachos</h1>
        <button onClick={() => setShowForm(true)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Despacho</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nuevo Despacho</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Seleccionar orden</option>
                {orders.map((o) => <option key={o.id} value={o.id}>{o.order_number} - {o.customer || 'Sin cliente'}</option>)}
              </select>
              <input placeholder="N° Seguimiento" value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Orden</th>
              <th className="text-left p-4">Tracking</th>
              <th className="text-center p-4">Estado</th>
              <th className="text-left p-4">Fecha</th>
              <th className="text-center p-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shipments.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Sin despachos</td></tr>}
            {shipments.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4">#{s.id}</td>
                <td className="p-4 font-mono text-blue-600">#{s.order_id}</td>
                <td className="p-4">{s.tracking_number || '-'}</td>
                <td className="p-4 text-center">{getStatusBadge(s.status)}</td>
                <td className="p-4 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                <td className="p-4 text-center">
                  {s.status === 'pending' && (
                    <button onClick={() => handleDispatch(s.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Despachar</button>
                  )}
                  {s.status === 'dispatched' && <span className="text-xs text-green-600">✓ Despachado</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
