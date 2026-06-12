import React, { useState, useEffect } from 'react'
import { getProducts, createProduct, getCategories, createCategory } from '../services/api'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [form, setForm] = useState({ sku: '', name: '', description: '', category_id: '', unit: 'unidad', price: 0, cost: 0, min_stock: 0, max_stock: 0 })
  const [catForm, setCatForm] = useState({ name: '', description: '' })

  const load = () => {
    getProducts().then(setProducts)
    getCategories().then(setCategories)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createProduct({ ...form, category_id: form.category_id ? Number(form.category_id) : null })
    setShowForm(false)
    setForm({ sku: '', name: '', description: '', category_id: '', unit: 'unidad', price: 0, cost: 0, min_stock: 0, max_stock: 0 })
    load()
  }

  const handleCatSubmit = async (e) => {
    e.preventDefault()
    await createCategory(catForm)
    setShowCatForm(false)
    setCatForm({ name: '', description: '' })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCatForm(true)} className="text-sm bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">+ Categoria</button>
          <button onClick={() => setShowForm(true)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Producto</button>
        </div>
      </div>

      {showCatForm && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" onClick={() => setShowCatForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nueva Categoria</h2>
            <form onSubmit={handleCatSubmit} className="space-y-3">
              <input placeholder="Nombre" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              <input placeholder="Descripcion" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCatForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nuevo Producto</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="px-3 py-2 border rounded-lg" required />
                <input placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg" required />
              </div>
              <input placeholder="Descripcion" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="px-3 py-2 border rounded-lg">
                  <option value="">Sin categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="Unidad" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" placeholder="Precio" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="px-3 py-2 border rounded-lg" />
                <input type="number" step="0.01" placeholder="Costo" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" placeholder="Stock minimo" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} className="px-3 py-2 border rounded-lg" />
                <input type="number" step="0.01" placeholder="Stock maximo" value={form.max_stock} onChange={(e) => setForm({ ...form, max_stock: Number(e.target.value) })} className="px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4">SKU</th>
              <th className="text-left p-4">Nombre</th>
              <th className="text-left p-4">Categoria</th>
              <th className="text-right p-4">Precio</th>
              <th className="text-right p-4">Stock Min</th>
              <th className="text-right p-4">Stock Max</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Sin productos registrados</td></tr>}
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-blue-600">{p.sku}</td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-gray-500">{categories.find((c) => c.id === p.category_id)?.name || '-'}</td>
                <td className="p-4 text-right">${p.price.toFixed(2)}</td>
                <td className="p-4 text-right">{p.min_stock}</td>
                <td className="p-4 text-right">{p.max_stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
