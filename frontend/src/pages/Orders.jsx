import React, { useState, useEffect } from 'react'
import { getOrders, createOrder, getProducts, getWarehouses } from '../services/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ order_type: 'sale', warehouse_id: '', customer: '', notes: '', items: [{ product_id: '', quantity_ordered: 1 }] })

  const load = () => {
    getOrders(filter || undefined).then(setOrders)
    getProducts().then(setProducts)
    getWarehouses().then(setWarehouses)
  }
  useEffect(() => { load() }, [filter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createOrder({
      order_type: form.order_type,
      warehouse_id: Number(form.warehouse_id),
      customer: form.customer,
      notes: form.notes,
      items: form.items.map((i) => ({ product_id: Number(i.product_id), quantity_ordered: Number(i.quantity_ordered) })),
    })
    setShowForm(false)
    setForm({ order_type: 'sale', warehouse_id: '', customer: '', notes: '', items: [{ product_id: '', quantity_ordered: 1 }] })
    load()
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity_ordered: 1 }] })
  const updateItem = (i, field, value) => {
    const items = [...form.items]; items[i][field] = value; setForm({ ...form, items })
  }
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })

  const getStatusBadge = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-700', picking: 'bg-blue-100 text-blue-700', picked: 'bg-purple-100 text-purple-700', shipping: 'bg-orange-100 text-orange-700', shipped: 'bg-green-100 text-green-700' }
    return <span className={`${colors[status] || 'bg-gray-100 text-gray-700'} px-2 py-0.5 rounded-full text-xs font-medium`}>{status}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Órdenes</h1>
        <div className="flex gap-2">
          {['', 'pending', 'picking', 'picked', 'shipping', 'shipped'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-lg ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f || 'Todas'}
            </button>
          ))}
          <button onClick={() => setShowForm(true)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Orden</button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nueva Orden</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <select value={form.order_type} onChange={(e) => setForm({ ...form, order_type: e.target.value })} className="px-3 py-2 border rounded-lg">
                  <option value="sale">Venta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="return">Devolución</option>
                </select>
                <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="px-3 py-2 border rounded-lg" required>
                  <option value="">Bodega</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input placeholder="Cliente" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <input placeholder="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Productos</h3>
                  <button type="button" onClick={addItem} className="text-xs bg-gray-100 px-3 py-1 rounded-lg">+ Agregar</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 items-end">
                    <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)} className="px-2 py-2 border rounded-lg text-sm col-span-2" required>
                      <option value="">Producto</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <input type="number" placeholder="Cant" value={item.quantity_ordered} onChange={(e) => updateItem(idx, 'quantity_ordered', e.target.value)} className="px-2 py-2 border rounded-lg text-sm flex-1" required />
                      {form.items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-sm">✕</button>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4">Orden</th>
              <th className="text-left p-4">Tipo</th>
              <th className="text-left p-4">Cliente</th>
              <th className="text-center p-4">Estado</th>
              <th className="text-left p-4">Fecha</th>
              <th className="text-right p-4">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Sin órdenes</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-blue-600">{o.order_number}</td>
                <td className="p-4 capitalize">{o.order_type}</td>
                <td className="p-4">{o.customer || '-'}</td>
                <td className="p-4 text-center">{getStatusBadge(o.status)}</td>
                <td className="p-4 text-gray-500">{new Date(o.created_at).toLocaleString()}</td>
                <td className="p-4 text-right">{o.items?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
