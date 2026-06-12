import React, { useState, useEffect } from 'react'
import { getWarehouses, createWarehouse, createLocation, getLocations } from '../services/api'

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [showWhForm, setShowWhForm] = useState(false)
  const [showLocForm, setShowLocForm] = useState(false)
  const [selectedWh, setSelectedWh] = useState(null)
  const [whForm, setWhForm] = useState({ name: '', code: '', address: '', city: '', country: '' })
  const [locForm, setLocForm] = useState({ warehouse_id: '', code: '', zone: '', aisle: '', rack: '', shelf: '' })

  const load = () => {
    getWarehouses().then(setWarehouses)
    getLocations().then(setLocations)
  }
  useEffect(() => { load() }, [])

  const handleWhSubmit = async (e) => {
    e.preventDefault()
    await createWarehouse(whForm)
    setShowWhForm(false)
    setWhForm({ name: '', code: '', address: '', city: '', country: '' })
    load()
  }

  const handleLocSubmit = async (e) => {
    e.preventDefault()
    await createLocation({ ...locForm, warehouse_id: Number(locForm.warehouse_id) })
    setShowLocForm(false)
    setLocForm({ warehouse_id: '', code: '', zone: '', aisle: '', rack: '', shelf: '' })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bodegas</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowLocForm(true)} className="text-sm bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">+ Ubicación</button>
          <button onClick={() => setShowWhForm(true)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Bodega</button>
        </div>
      </div>

      {showWhForm && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" onClick={() => setShowWhForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nueva Bodega</h2>
            <form onSubmit={handleWhSubmit} className="space-y-3">
              <input placeholder="Nombre *" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              <input placeholder="Código *" value={whForm.code} onChange={(e) => setWhForm({ ...whForm, code: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              <input placeholder="Dirección" value={whForm.address} onChange={(e) => setWhForm({ ...whForm, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Ciudad" value={whForm.city} onChange={(e) => setWhForm({ ...whForm, city: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input placeholder="País" value={whForm.country} onChange={(e) => setWhForm({ ...whForm, country: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowWhForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLocForm && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center p-4" onClick={() => setShowLocForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nueva Ubicación</h2>
            <form onSubmit={handleLocSubmit} className="space-y-3">
              <select value={locForm.warehouse_id} onChange={(e) => setLocForm({ ...locForm, warehouse_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Seleccionar bodega</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <input placeholder="Código * (ej: A-01-02-03)" value={locForm.code} onChange={(e) => setLocForm({ ...locForm, code: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Zona" value={locForm.zone} onChange={(e) => setLocForm({ ...locForm, zone: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input placeholder="Pasillo" value={locForm.aisle} onChange={(e) => setLocForm({ ...locForm, aisle: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Rack" value={locForm.rack} onChange={(e) => setLocForm({ ...locForm, rack: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input placeholder="Nivel" value={locForm.shelf} onChange={(e) => setLocForm({ ...locForm, shelf: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowLocForm(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {warehouses.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 col-span-2">
            Sin bodegas registradas
          </div>
        )}
        {warehouses.map((wh) => {
          const whLocs = locations.filter((l) => l.warehouse_id === wh.id)
          return (
            <div key={wh.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{wh.name}</h3>
                  <span className="text-sm text-blue-600 font-mono">{wh.code}</span>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{whLocs.length} ubicaciones</span>
              </div>
              {wh.address && <p className="text-sm text-gray-500 mb-3">{wh.address}{wh.city ? `, ${wh.city}` : ''}</p>}
              {whLocs.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">UBICACIONES</p>
                  <div className="flex flex-wrap gap-2">
                    {whLocs.map((l) => (
                      <span key={l.id} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{l.code}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
