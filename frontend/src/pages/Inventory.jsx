import React, { useState, useEffect } from 'react'
import { getInventory, getInventorySummary } from '../services/api'

export default function InventoryPage() {
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getInventorySummary().then((data) => {
      setSummary(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? summary : summary.filter((s) => s.status === filter)

  const getStatusBadge = (status) => {
    if (status === 'low') return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">Stock Bajo</span>
    if (status === 'over') return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">Sobre Stock</span>
    return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">OK</span>
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <div className="flex gap-2">
          {['all', 'low', 'ok', 'over'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'Todos' : f === 'low' ? 'Stock Bajo' : f === 'ok' ? 'OK' : 'Sobre Stock'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4">SKU</th>
              <th className="text-left p-4">Producto</th>
              <th className="text-right p-4">Cantidad</th>
              <th className="text-right p-4">Stock Min</th>
              <th className="text-right p-4">Stock Max</th>
              <th className="text-center p-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Sin resultados</td></tr>}
            {filtered.map((s) => (
              <tr key={s.product_id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-blue-600">{s.sku}</td>
                <td className="p-4 font-medium">{s.name}</td>
                <td className="p-4 text-right font-semibold">{s.total_quantity}</td>
                <td className="p-4 text-right text-gray-500">{s.min_stock}</td>
                <td className="p-4 text-right text-gray-500">{s.max_stock}</td>
                <td className="p-4 text-center">{getStatusBadge(s.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
