import { useState, useEffect } from 'react'

const EMPTY_FORM = {
  name: '',
  category: '',
  prices: [{ unit: '', price: '' }],
  stock: '',
  discount: { enabled: false, type: 'percentage', value: 0 },
}

export default function ProductFormModal({ product, categories, unitsOfMeasure, onSave, onClose, currencySymbol }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const sym = currencySymbol || '$'

  // Group units by type
  const unitsByType = unitsOfMeasure.reduce((acc, unit) => {
    if (!acc[unit.type]) {
      acc[unit.type] = []
    }
    acc[unit.type].push(unit)
    return acc
  }, {})

  useEffect(() => {
    if (product) {
      setForm({
        ...EMPTY_FORM,
        ...product,
        prices: product.prices && product.prices.length > 0 
          ? product.prices.map(p => ({ ...p, price: String(p.price) }))
          : [{ unit: '', price: '' }],
        stock: product.stock != null ? String(product.stock) : '',
        discount: product.discount || EMPTY_FORM.discount,
      })
    } else {
      setForm({ 
        ...EMPTY_FORM, 
        category: categories[0]?.id || '',
        prices: [{ unit: unitsOfMeasure.find(u => u.type === 'unit')?.abbreviation || '', price: '' }]
      })
    }
  }, [product, categories, unitsOfMeasure]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const setDiscount = (field, value) => setForm(f => ({ ...f, discount: { ...f.discount, [field]: value } }))

  const addPriceRow = () => {
    setForm(f => ({
      ...f,
      prices: [...f.prices, { unit: '', price: '' }]
    }))
  }

  const removePriceRow = (index) => {
    if (form.prices.length > 1) {
      setForm(f => ({
        ...f,
        prices: f.prices.filter((_, i) => i !== index)
      }))
    }
  }

  const updatePrice = (index, field, value) => {
    setForm(f => {
      const newPrices = [...f.prices]
      newPrices[index] = { ...newPrices[index], [field]: value }
      return { ...f, prices: newPrices }
    })
  }

  const addPrice = () => {
    setForm(f => ({ ...f, prices: [...f.prices, { unit: '', price: '' }] }))
  }

  const removePrice = (index) => {
    setForm(f => ({ ...f, prices: f.prices.filter((_, i) => i !== index) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    
    // Validate at least one price is set
    const validPrices = form.prices.filter(p => p.unit && p.price)
    if (validPrices.length === 0) return
    
    onSave({
      ...form,
      name: form.name.trim(),
      prices: validPrices.map(p => ({ 
        unit: p.unit, 
        price: parseFloat(p.price) || 0 
      })),
      stock: form.stock !== '' ? parseInt(form.stock, 10) : null,
      discount: {
        ...form.discount,
        value: parseFloat(form.discount.value) || 0,
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {product?.id ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prices */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prices</label>
            <div className="space-y-2">
              {form.prices.map((price, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={price.unit}
                    onChange={e => updatePrice(index, 'unit', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select unit</option>
                    {Object.entries(unitsByType).map(([type, units]) => (
                      <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}>
                        {units.map(unit => (
                          <option key={unit.id} value={unit.abbreviation}>
                            {unit.name} ({unit.abbreviation})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price.price}
                    onChange={e => updatePrice(index, 'price', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    required
                  />
                  <span className="flex items-center text-gray-500">{sym}</span>
                  {form.prices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePriceRow(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 21m0 0l-1.5 1.5M5 21h14" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPriceRow}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                + Add Price
              </button>
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={e => set('stock', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Leave blank if not tracked"
            />
          </div>

          {/* Per-item Discount */}
          <div className="border border-gray-200 rounded-xl p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.discount.enabled}
                onChange={e => setDiscount('enabled', e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <span className="text-sm font-medium text-gray-700">Enable per-item discount</span>
            </label>
            {form.discount.enabled && (
              <div className="flex gap-2 items-center mt-2">
                <select
                  value={form.discount.type}
                  onChange={e => setDiscount('type', e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">{sym}</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={form.discount.type === 'percentage' ? 100 : undefined}
                  value={form.discount.value}
                  onChange={e => setDiscount('value', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>
            )}
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
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
