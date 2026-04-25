import { useState, useEffect } from 'react'

export default function ProductModal({ product, initialQty = 1, onSave, onClose, currencySymbol, settings, isEdit = false }) {
  const sym = currencySymbol || '$'
  const [localProduct, setLocalProduct] = useState({ ...product })
  const [qty, setQty] = useState(initialQty)

  const getPrimaryPrice = (p) => {
    if (p.prices && p.prices.length > 0) {
      return p.prices[0].price
    }
    return p.price || 0
  }

  // Update quantity value when input changes
  const handleQtyChange = (e) => {
    setQty(e.target.value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-xl p-4 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 mb-1 truncate">{localProduct.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{sym}{Number(getPrimaryPrice(localProduct)).toFixed(2)} / {localProduct.unit || 'Each'}</p>
        
        {localProduct.prices && localProduct.prices.length > 1 && (
          <>
            <label className="block text-xs text-gray-500 mb-1">Unit</label>
            <select
              value={localProduct.selectedUnit || localProduct.prices[0]?.unit || 'Each'}
              onChange={e => {
                const newUnit = e.target.value
                const unitPrice = localProduct.prices.find(p => p.unit === newUnit)?.price || getPrimaryPrice(localProduct)
                setLocalProduct({ ...localProduct, selectedUnit: newUnit, price: unitPrice })
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {localProduct.prices.map(p => (
                <option key={p.unit} value={p.unit}>
                  {p.unit} — {sym}{Number(p.price).toFixed(2)}
                </option>
              ))}
            </select>
          </>
        )}
        
        <label className="block text-xs text-gray-500 mb-1">
          Quantity{localProduct.unit && localProduct.unit !== 'Each' ? ` (${localProduct.unit})` : ''}
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={qty}
          onChange={handleQtyChange}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        
        {settings?.defaultQuantities?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Quick select</p>
            <div className="flex flex-wrap gap-1.5">
              {settings.defaultQuantities.map(item => (
                <button
                  key={item.id}
                  onClick={() => setQty(item.value)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 rounded-md text-sm font-medium text-gray-600 transition-colors"
                >
                  {item.value}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const parsedQty = parseFloat(qty) || 1
              if (parsedQty > 0) {
                onSave({
                  ...localProduct,
                  price: localProduct.price || getPrimaryPrice(localProduct),
                }, parsedQty)
              }
              onClose()
            }}
            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
