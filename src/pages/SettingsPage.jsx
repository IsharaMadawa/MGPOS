import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useSettings, CURRENCIES } from '../hooks/useSettings'
import { useCategories } from '../hooks/useCategories'
import ProductFormModal from '../components/ProductFormModal'

// ─── Products Tab ────────────────────────────────────────────────────────────

function ProductsTab({ currencySymbol }) {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts()
  const { categories, addCategory, deleteCategory } = useCategories()
  const [editingProduct, setEditingProduct] = useState(null) // null=closed, undefined=new, obj=edit
  const [newCat, setNewCat] = useState('')
  const [catError, setCatError] = useState('')

  const handleAddCategory = (e) => {
    e.preventDefault()
    if (!newCat.trim()) return
    const ok = addCategory(newCat.trim())
    if (ok) {
      setNewCat('')
      setCatError('')
    } else {
      setCatError('Category already exists')
    }
  }

  return (
    <div className="space-y-6">
      {/* Products List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Products
            <span className="ml-2 text-sm font-normal text-gray-400">({products.length})</span>
          </h3>
          <button
            onClick={() => setEditingProduct(undefined)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-400 text-sm">No products yet. Add your first product.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-sm text-gray-500">
                    {currencySymbol}{Number(p.price).toFixed(2)}
                    {p.unit && ` / ${p.unit}`}
                    {p.category && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{p.category}</span>
                    )}
                    {p.discount?.enabled && (
                      <span className="ml-1 text-rose-500 text-xs">
                        {p.discount.type === 'percentage'
                          ? ` −${p.discount.value}%`
                          : ` −${currencySymbol}${p.discount.value}`}
                      </span>
                    )}
                    {p.stock != null && (
                      <span className={`ml-1 text-xs ${p.stock <= 5 ? 'text-orange-500' : 'text-gray-400'}`}>
                        · Stock: {p.stock}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingProduct(p)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) deleteProduct(p.id) }}
                    className="text-xs px-3 py-1.5 border border-red-100 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Categories</h3>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            value={newCat}
            onChange={e => { setNewCat(e.target.value); setCatError('') }}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="New category name"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Add
          </button>
        </form>
        {catError && <p className="text-red-500 text-xs">{catError}</p>}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <span key={cat} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {cat}
              <button
                onClick={() => { if (window.confirm(`Delete category "${cat}"?`)) deleteCategory(cat) }}
                className="text-gray-400 hover:text-red-500 ml-0.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {categories.length === 0 && (
            <p className="text-gray-400 text-sm">No categories yet</p>
          )}
        </div>
      </section>

      {/* Product Form Modal */}
      {editingProduct !== null && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          currencySymbol={currencySymbol}
          onSave={(data) => {
            if (editingProduct?.id) {
              updateProduct(editingProduct.id, data)
            } else {
              addProduct(data)
            }
            setEditingProduct(null)
          }}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  )
}

// ─── Billing Tab ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
    </label>
  )
}

function BillingTab({ settings, updateSettings }) {
  const setStoreInfo = (key, value) => {
    updateSettings({ storeInfo: { ...settings.storeInfo, [key]: value } })
  }

  return (
    <div className="space-y-5">
      {/* Store Information */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Store Information</h3>
        {[
          { key: 'name',    label: 'Store Name',     placeholder: 'My Shop' },
          { key: 'address', label: 'Address',         placeholder: '123 Main St, City' },
          { key: 'phone',   label: 'Phone',           placeholder: '+1 (555) 000-0000' },
          { key: 'footer',  label: 'Receipt Footer',  placeholder: 'Thank you for your purchase!' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              value={settings.storeInfo?.[key] || ''}
              onChange={e => setStoreInfo(key, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder={placeholder}
            />
          </div>
        ))}
      </section>

      {/* Currency */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Currency</h3>
        <select
          value={settings.currency}
          onChange={e => updateSettings({ currency: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.symbol} — {c.name} ({c.code})
            </option>
          ))}
        </select>
      </section>

      {/* Tax */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Tax</h3>
          <Toggle
            checked={settings.taxEnabled || false}
            onChange={e => updateSettings({ taxEnabled: e.target.checked })}
          />
        </div>
        {settings.taxEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.taxRate || 0}
              onChange={e => updateSettings({ taxRate: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        )}
      </section>

      {/* Global Discount */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Global Discount</h3>
          <Toggle
            checked={settings.globalDiscountEnabled || false}
            onChange={e => updateSettings({ globalDiscountEnabled: e.target.checked })}
          />
        </div>
        {settings.globalDiscountEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.globalDiscount || 0}
              onChange={e => updateSettings({ globalDiscount: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <p className="text-xs text-gray-400 mt-1">Applied to every sale after per-item discounts</p>
          </div>
        )}
      </section>

      {/* Misc Items */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Miscellaneous Items</h3>
            <p className="text-xs text-gray-500 mt-0.5">Allow adding one-off items at checkout</p>
          </div>
          <Toggle
            checked={settings.miscEnabled !== false}
            onChange={e => updateSettings({ miscEnabled: e.target.checked })}
          />
        </div>
      </section>
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('products')
  const { settings, updateSettings } = useSettings()
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

  const tabs = [
    { id: 'products', label: 'Products' },
    { id: 'billing',  label: 'Billing' },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 mb-6 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'products' && <ProductsTab currencySymbol={currencySymbol} />}
        {activeTab === 'billing'  && <BillingTab settings={settings} updateSettings={updateSettings} />}
      </div>
    </div>
  )
}
