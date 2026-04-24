import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const UNIT_TYPES = {
  unit:   { label: 'Unit',   units: ['Each', 'Pack', 'Box', 'Dozen', 'Pair'] },
  weight: { label: 'Weight', units: ['kg', 'g', 'lb', 'oz'] },
  volume: { label: 'Volume', units: ['L', 'mL', 'fl oz', 'gal'] },
  length: { label: 'Length', units: ['y', 'm', 'cm', 'ft', 'in'] },
}

export default function MiscItemModal({ onConfirm, onClose, currencySymbol }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('1')
  const [unitType, setUnitType] = useState('unit')
  const [unit, setUnit] = useState('Each')
  const sym = currencySymbol || '$'

  const handleUnitTypeChange = (ut) => {
    setUnitType(ut)
    setUnit(UNIT_TYPES[ut].units[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !price) return
    onConfirm({
      id: uuidv4(),
      name: name.trim(),
      price: parseFloat(price),
      qty: parseFloat(qty) || 1,
      unit,
      unitType,
      isMisc: true,
      discount: { enabled: false, type: 'percentage', value: 0 },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Miscellaneous Item</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add a one-off item to the cart</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Custom Service"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ({sym}) *</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>

          {/* Sold By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sold By</label>
            <div className="flex gap-1 mb-2">
              {Object.entries(UNIT_TYPES).map(([key, { label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleUnitTypeChange(key)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    unitType === key
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {UNIT_TYPES[unitType]?.units.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    unit === u
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 font-medium'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity{unit && unit !== 'Each' ? ` (${unit})` : ''}
            </label>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
