import { useState, useEffect } from 'react'

const UNIT_TYPES = {
  unit:   { label: 'Unit',   units: ['Each', 'Pack', 'Box', 'Dozen', 'Pair'] },
  weight: { label: 'Weight', units: ['kg', 'g', 'lb', 'oz'] },
  volume: { label: 'Volume', units: ['L', 'mL', 'fl oz', 'gal'] },
  length: { label: 'Length', units: ['m', 'cm', 'ft', 'in'] },
}

const EMPTY_FORM = {
  name: '',
  price: '',
  category: '',
  unitType: 'unit',
  unit: 'Each',
  stock: '',
  discount: { enabled: false, type: 'percentage', value: 0 },
}

export default function ProductFormModal({ product, categories, onSave, onClose, currencySymbol }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const sym = currencySymbol || '$'

  useEffect(() => {
    if (product) {
      setForm({
        ...EMPTY_FORM,
        ...product,
        price: String(product.price),
        stock: product.stock != null ? String(product.stock) : '',
        discount: product.discount || EMPTY_FORM.discount,
      })
    } else {
      setForm({ ...EMPTY_FORM, category: categories[0] || '' })
    }
  }, [product]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const setDiscount = (field, value) => setForm(f => ({ ...f, discount: { ...f.discount, [field]: value } }))

  const handleUnitTypeChange = (ut) => {
    setForm(f => ({ ...f, unitType: ut, unit: UNIT_TYPES[ut].units[0] }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return
    onSave({
      ...form,
      name: form.name.trim(),
      price: parseFloat(form.price),
      stock: form.stock !== '' ? parseInt(form.stock, 10) : null,
      discount: {
        ...form.discount,
        value: parseFloat(form.discount.value) || 0,
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              required
              autoFocus
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Coca Cola"
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
              value={form.price}
              onChange={e => set('price', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">— None —</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
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
                    form.unitType === key
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {UNIT_TYPES[form.unitType]?.units.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => set('unit', u)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    form.unit === u
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 font-medium'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {u}
                </button>
              ))}
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
