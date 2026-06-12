import React, { useState, useEffect } from 'react'
import { getReceipts, createReceipt, receiveReceipt, getProducts, getWarehouses } from '../services/api'

export default function Receipts() {
  const [receipts, setReceipts] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ warehouse_id: '', supplier: '', notes: '', items: [{ product_id: '', quantity_expected: 1, lot_number: '', serial_number: '' }] })

  const load = () => {
    getReceipts().then(setReceipts)
    getProducts().then(setProducts)
    getWarehouses().then(setWarehouses)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createReceipt({
      warehouse_id: Number(form.warehouse_id),
      supplier: form.supplier,
      notes: form.notes,
      items: form.items.map((i) => ({ product_id: Number(i.product_id), quantity_expected: Number(i.quantity_expected), lot_number: i.lot_number || null, serial_number: i.serial_number || null })),
    })
    setShowForm(false)
    setForm({ warehouse_id: '', supplier: '', notes: '', items: [{ product_id: '', quantity_expected: 1, lot_number: '', serial_number: '' }] })
    load()
  }

  const handleReceive = async (id) => {
    await receiveReceipt(id)
    load()
  }

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity_expected: 1, lot_number: '', serial_number: '' }] })
  const updateItem = (i, field, value) => {
    const items = [...form.items]
    items[i][field] = value
    setForm({ ...form, items })
  }
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })

  const getStatusBadge = (status) => {
    if (status === 'completed') return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Completada</span>
    return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">Pendiente</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recepciones</h1>
        <button onClick={() => setShowForm(true)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Recepción</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nueva Recepción</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="px-3 py-2 border rounded-lg" required>
                  <option value="">Seleccionar bodega</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input placeholder="Proveedor" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <input placeholder="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Productos</h3>
                  <button type="button" onClick={addItem} className="text-xs bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200">+ Agregar</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                    <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)} className="px-2 py-2 border rounded-lg text-sm col-span-2" required>
                      <option value="">Producto</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                    </select>
                    <input type="number" placeholder="Cant." value={item.quantity_expected} onChange={(e) => updateItem(idx, 'quantity_expected', e.target.value)} className="px-2 py-2 border rounded-lg text-sm" required />
                    <input placeholder="Lote" value={item.lot_number} onChange={(e) => updateItem(idx, 'lot_number', e.target.value)} className="px-2 py-2 border rounded-lg text-sm" />
                    {form.items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-sm">✕</button>}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear Recepción</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4">Referencia</th>
              <th className="text-left p-4">Proveedor</th>
              <th className="text-left p-4">Bodega</th>
              <th className="text-center p-4">Estado</th>
              <th className="text-left p-4">Fecha</th>
              <th className="text-center p-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {receipts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Sin recepciones</td></tr>}
            {receipts.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-blue-600">{r.reference_number}</td>
                <td className="p-4">{r.supplier || '-'}</td>
                <td className="p-4 text-gray-500">{warehouses.find((w) => w.id === r.warehouse_id)?.name || '-'}</td>
                <td className="p-4 text-center">{getStatusBadge(r.status)}</td>
                <td className="p-4 text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-4 text-center">
                  {r.status === 'pending' && (
                    <button onClick={() => handleReceive(r.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Recibir</button>
                  )}
                  {r.status === 'completed' && <span className="text-xs text-gray-400">Completado</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
