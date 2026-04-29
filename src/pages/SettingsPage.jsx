import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useSettings, CURRENCIES } from '../hooks/useSettings'
import { useCategories } from '../hooks/useCategories'
import { useOrganizations } from '../hooks/useOrganizations'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { useToast } from '../components/ToastContainer'
import { logUserAction, LOG_TYPES } from '../utils/logger'
import { db } from '../firebase'
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import ProductFormModal from '../components/ProductFormModal'
import PasswordChangeModal from '../components/PasswordChangeModal'
import UserOrganizationManager from '../components/UserOrganizationManager'
import UserProfileManager from '../components/UserProfileManager'
import AccessManagement from '../components/AccessManagement'
import MasterDataTab from '../components/MasterDataTab'

// ─── Products Tab ────────────────────────────────────────────────────────────

function ProductsTab({ currencySymbol, settings }) {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts()
  const [editingProduct, setEditingProduct] = useState(null) // null=closed, undefined=new, obj=edit
  
  // Get master categories and units from settings
  const masterCategories = settings?.masterCategories || []
  const unitsOfMeasure = settings?.unitsOfMeasure || []
  
  // Create lookup maps for easier access
  const categoryMap = masterCategories.reduce((acc, cat) => {
    acc[cat.id] = cat
    return acc
  }, {})
  
  const unitMap = unitsOfMeasure.reduce((acc, unit) => {
    acc[unit.abbreviation] = unit
    return acc
  }, {})

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
                    <div className="flex items-center">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                      {p.category && categoryMap[p.category] && (
                        <span 
                          className="ml-1.5 px-1.5 py-0.5 rounded text-xs"
                          style={{ 
                            backgroundColor: `${categoryMap[p.category].color}20`,
                            color: categoryMap[p.category].color
                          }}
                        >
                          {categoryMap[p.category].icon} {categoryMap[p.category].name}
                        </span>
                      )}
                    </div>
                  <p className="text-sm text-gray-500">
                    {p.prices.map(pr => (
                      <span key={pr.unit}>
                        {currencySymbol}{Number(pr.price).toFixed(2)}{pr.unit && `/${pr.unit}`}
                        <br/>
                      </span>
                    ))}
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


      {/* Product Form Modal */}
      {editingProduct !== null && (
        <ProductFormModal
          product={editingProduct}
          categories={masterCategories}
          unitsOfMeasure={unitsOfMeasure}
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
  const { categories } = useCategories()
  const setStoreInfo = (key, value) => {
    updateSettings({ storeInfo: { ...settings.storeInfo, [key]: value } })
  }

  const updateCategoryDiscount = (category, field, value) => {
    const current = settings.categoryDiscounts?.[category] || { enabled: false, type: 'percentage', value: 0 }
    updateSettings({
      categoryDiscounts: {
        ...settings.categoryDiscounts,
        [category]: { ...current, [field]: value },
      },
    })
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

      {/* Discount Mode */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Discount Type</h3>
        <p className="text-xs text-gray-500 mb-3">Choose how discounts are applied to items</p>
        <div className="space-y-2">
          {[
            { value: 'global', label: 'Global Discount', desc: 'Apply a single discount to all items' },
            { value: 'category', label: 'Category Discount', desc: 'Set different discounts per category' },
            { value: 'item', label: 'Item Discount', desc: 'Set discounts individually on each product' },
          ].map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                settings.discountMode === opt.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="discountMode"
                value={opt.value}
                checked={settings.discountMode === opt.value}
                onChange={e => updateSettings({ discountMode: e.target.value })}
                className="mt-0.5"
              />
              <div>
                <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Cart Discount Override */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Cart Discount Override</h3>
            <p className="text-xs text-gray-500 mt-0.5">Allow applying a custom discount amount directly in the cart</p>
          </div>
          <Toggle
            checked={settings.cartDiscountEnabled || false}
            onChange={e => updateSettings({ cartDiscountEnabled: e.target.checked })}
          />
        </div>
      </section>

      {/* Global Discount - shown when global mode selected */}
      {settings.discountMode === 'global' && (
        <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
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
            </div>
        </section>
      )}

      {/* Category Discounts - shown when category mode selected */}
      {settings.discountMode === 'category' && (
        <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
          <h3 className="font-semibold text-gray-900">Category Discounts</h3>
          <p className="text-xs text-gray-500 mb-3">Set discount for each category</p>
          {categories.length === 0 ? (
            <p className="text-gray-400 text-sm">No categories defined. Add categories in Products tab.</p>
          ) : (
            <div className="space-y-3">
              {categories.map(cat => {
                const disc = settings.categoryDiscounts?.[cat] || { enabled: false, type: 'percentage', value: 0 }
                return (
                  <div key={cat} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Toggle
                      checked={disc.enabled}
                      onChange={e => updateCategoryDiscount(cat, 'enabled', e.target.checked)}
                    />
                    <span className="flex-1 font-medium text-sm text-gray-700">{cat.name}</span>
                    {disc.enabled && (
                      <>
                        <select
                          value={disc.type}
                          onChange={e => updateCategoryDiscount(cat, 'type', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">{CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'}</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          max={disc.type === 'percentage' ? 100 : 99999}
                          step="0.01"
                          value={disc.value}
                          onChange={e => updateCategoryDiscount(cat, 'value', parseFloat(e.target.value) || 0)}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Item Discounts info - shown when item mode selected */}
      {settings.discountMode === 'item' && (
        <section className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900">Item Discounts</h3>
          <p className="text-xs text-gray-500 mt-1">Set discounts individually on each product in the Products tab.</p>
        </section>
      )}

      {/* Reprint */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Bill Reprint</h3>
            <p className="text-xs text-gray-500 mt-0.5">Allow reprinting bills from today only</p>
          </div>
          <Toggle
            checked={settings.reprintEnabled || false}
            onChange={e => updateSettings({ reprintEnabled: e.target.checked })}
          />
        </div>
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

// ─── Quick Quantities Tab ──────────────────────────────────────────────────

function QuickQuantitiesTab({ settings, updateSettings }) {
  const [newQty, setNewQty] = useState('')
  const [error, setError] = useState('')

  const quantities = settings.defaultQuantities || []

  const handleAdd = (e) => {
    e.preventDefault()
    const val = parseFloat(newQty)
    if (!val || val <= 0) {
      setError('Enter a valid positive number')
      return
    }
    if (quantities.some(q => q.value === val)) {
      setError('Value already exists')
      return
    }
    const newItem = {
      id: Date.now().toString(),
      value: val,
    }
    updateSettings({
      defaultQuantities: [...quantities, newItem],
    })
    setNewQty('')
    setError('')
  }

  const handleDelete = (id) => {
    updateSettings({
      defaultQuantities: quantities.filter(q => q.id !== id),
    })
  }

  const moveItem = (index, direction) => {
    const newList = [...quantities]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= newList.length) return
    const temp = newList[index]
    newList[index] = newList[newIndex]
    newList[newIndex] = temp
    updateSettings({ defaultQuantities: newList })
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900">Default Quantities</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Quick-select values shown in the quantity popup when adding products
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={newQty}
              onChange={e => { setNewQty(e.target.value); setError('') }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Enter quantity (e.g., 0.5)"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Add
          </button>
        </form>

        {quantities.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No default quantities added yet</p>
        ) : (
          <div className="space-y-2">
            {quantities.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === quantities.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <span className="flex-1 font-medium text-gray-700">{item.value}</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 21m0 0l-1.5 1.5M5 21h14" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('products')
  const { settings, updateSettings } = useSettings()
  const { userProfile, isSuperAdmin } = useAuth()
  const { organizations } = useOrganizations()
  const { selectedOrgId, setSelectedOrgId, hasAdminAccessToOrganization, getAdminOrganizations } = useOrg()
  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

  // Determine which orgId is being used and validate admin access
  const currentOrgId = isSuperAdmin ? selectedOrgId : (selectedOrgId || userProfile?.orgId)
  const hasAdminAccess = currentOrgId && hasAdminAccessToOrganization(currentOrgId)

  // Get admin organizations for organization selector
  const adminOrganizations = getAdminOrganizations()

  
  // Auto-select admin organization when needed
  useEffect(() => {
    if (!isSuperAdmin) {
      // If no organization selected, select the first admin org
      if (!selectedOrgId && adminOrganizations.length >= 1) {
        setSelectedOrgId(adminOrganizations[0].orgId)
      }
      // If current organization doesn't have admin access, switch to first admin org
      else if (selectedOrgId && !hasAdminAccessToOrganization(selectedOrgId) && adminOrganizations.length >= 1) {
        setSelectedOrgId(adminOrganizations[0].orgId)
      }
    }
  }, [adminOrganizations, selectedOrgId, setSelectedOrgId, isSuperAdmin, hasAdminAccessToOrganization])

  const tabs = [
    { id: 'products', label: 'Products' },
    { id: 'billing',  label: 'Billing' },
    { id: 'masterdata', label: 'Master Data' },
    { id: 'users', label: 'Users' },
    { id: 'access', label: 'Access' },
    { id: 'profile', label: 'Profile' },
  ]

  // Show message if no organization selected or no admin access
  // Hide settings for users with multiple organizations until one is selected
  const hasMultipleOrganizations = (isSuperAdmin && organizations.length > 1) || adminOrganizations.length > 1
  const needsOrgSelection = hasMultipleOrganizations && !selectedOrgId
  
  // Handle Super Admin specific cases
  if (isSuperAdmin) {
    // Super Admin with no organizations at all
    if (organizations.length === 0) {
      return (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations Defined</h3>
              <p className="text-gray-600 mb-4">There are no organizations defined yet. Create your first organization to start managing settings.</p>
              <div className="flex justify-center">
                <button
                  onClick={() => window.location.href = '/super-admin'}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Create Organization
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    // Super Admin with multiple organizations but none selected
    if (needsOrgSelection) {
      return (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2h-4a2 2 0 01-2-2V5z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
              <p className="text-gray-600 mb-4">You have access to {organizations.length} organization{organizations.length > 1 ? 's' : ''}. Please select an organization from the navigation bar to manage its settings.</p>
            </div>
          </div>
        </div>
      )
    }
  }
  
  // Handle Organization Admin cases
  if (!hasAdminAccess || needsOrgSelection) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
          
          {needsOrgSelection ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Organization</h3>
              <p className="text-gray-600 mb-4">You have admin access to {adminOrganizations.length} organization{adminOrganizations.length > 1 ? 's' : ''}. Please select an organization from the navigation bar to manage its settings.</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">You don't have admin access to manage settings for this organization.</p>
              <p className="text-sm text-gray-500">
                {adminOrganizations.length > 0 
                  ? `You have admin access to ${adminOrganizations.length} organization${adminOrganizations.length > 1 ? 's' : ''}. Please select an organization where you have admin privileges.`
                  : 'You need admin access to manage organization settings.'}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Organization Selector for users with admin access */}
        {!isSuperAdmin && adminOrganizations.length >= 1 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {adminOrganizations.length === 1 ? 'Managing Organization' : 'Manage Organization'}
            </label>
            {adminOrganizations.length === 1 ? (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                {adminOrganizations[0].orgId} ({adminOrganizations[0].role})
              </div>
            ) : (
              <select
                value={selectedOrgId || ''}
                onChange={(e) => {
                  const newOrgId = e.target.value
                  if (newOrgId) {
                    setSelectedOrgId(newOrgId)
                  }
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Select an organization to manage</option>
                {adminOrganizations.map(org => (
                  <option key={org.orgId} value={org.orgId}>
                    {org.orgId} ({org.role})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

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

        {activeTab === 'products' && <ProductsTab currencySymbol={currencySymbol} settings={settings} />}
        {activeTab === 'billing'  && <BillingTab settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'masterdata' && <MasterDataTab settings={settings} updateSettings={updateSettings} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'access' && <AccessManagement />}
        {activeTab === 'profile' && <UserProfileManager />}
      </div>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId, hasAdminAccessToOrganization } = useOrg()
  const { addToast } = useToast()
  
  // Determine which orgId to use and validate admin access
  const orgId = isSuperAdmin ? selectedOrgId : (selectedOrgId || userProfile?.orgId)
  const hasAdminAccess = orgId && hasAdminAccessToOrganization(orgId)
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', displayName: '', email: '', role: 'user' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  // Show access denied message if no admin access
  if (!hasAdminAccess) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have admin access to manage users for this organization.</p>
      </div>
    )
  }

  // Fetch users for this organization
  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }

    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('orgId', '==', orgId))
        const snapshot = await getDocs(q)
        const userList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setUsers(userList)
      } catch (err) {
        console.error('Error fetching users:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [orgId])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newUser.username.trim() || !newUser.password || !newUser.displayName.trim()) {
      setError('Username, password, and display name are required')
      return
    }

    setCreating(true)
    setError('')

    try {
      // Check if username exists
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', newUser.username.trim().toLowerCase()))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        setError('This username is already taken. Please choose a different username.')
        setCreating(false)
        return
      }

      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      await setDoc(doc(db, 'users', userId), {
        username: newUser.username.trim().toLowerCase(),
        password: newUser.password,
        displayName: newUser.displayName.trim(),
        email: newUser.email.trim() || null,
        role: newUser.role,
        orgId: orgId,
        createdAt: serverTimestamp(),
      })

      // Refresh user list
      const newQ = query(usersRef, where('orgId', '==', orgId))
      const newSnapshot = await getDocs(newQ)
      setUsers(newSnapshot.docs.map(d => ({ id: d.id, ...d.data() })))

      addToast('User created successfully!', 'success', { important: true })
      
      // Log user creation
      try {
        await logUserAction(
          LOG_TYPES.USER_CREATE,
          `Created user: ${newUser.displayName} (${newUser.username}) with role: ${newUser.role}`,
          userProfile,
          orgId,
          {
            userId: userId,
            username: newUser.username,
            displayName: newUser.displayName,
            email: newUser.email,
            role: newUser.role,
            orgId: orgId
          }
        )
      } catch (logError) {
        console.error('Failed to log user creation:', logError)
      }
      
      setNewUser({ username: '', password: '', displayName: '', email: '', role: 'user' })
      setShowNewUser(false)
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const user = users.find(u => u.id === userId)
      const oldRole = user?.role
      
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true })
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      
      // Log role change
      try {
        await logUserAction(
          LOG_TYPES.USER_ROLE_CHANGE,
          `Updated user role: ${user?.displayName} (${user?.username}) from ${oldRole} to ${newRole}`,
          userProfile,
          orgId,
          {
            userId: userId,
            username: user?.username,
            displayName: user?.displayName,
            oldRole: oldRole,
            newRole: newRole,
            orgId: orgId
          }
        )
      } catch (logError) {
        console.error('Failed to log role change:', logError)
      }
      
      addToast('Role updated successfully!', 'success', { important: true })
    } catch (err) {
      console.error('Error updating role:', err)
      addToast('Failed to update role', 'error')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user?')) return
    try {
      const user = users.find(u => u.id === userId)
      
      await deleteDoc(doc(db, 'users', userId))
      setUsers(users.filter(u => u.id !== userId))
      
      // Log user deletion
      try {
        await logUserAction(
          LOG_TYPES.USER_DELETE,
          `Deleted user: ${user?.displayName} (${user?.username})`,
          userProfile,
          orgId,
          {
            userId: userId,
            username: user?.username,
            displayName: user?.displayName,
            email: user?.email,
            role: user?.role,
            orgId: orgId
          }
        )
      } catch (logError) {
        console.error('Failed to log user deletion:', logError)
      }
      
      addToast('User deleted successfully!', 'success', { important: true })
    } catch (err) {
      console.error('Error deleting user:', err)
      addToast('Failed to delete user', 'error')
    }
  }

  const handlePasswordChange = (userId) => {
    setSelectedUserId(userId)
    setShowPasswordModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Create User Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Organization Users</h3>
          <button
            onClick={() => setShowNewUser(!showNewUser)}
            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {showNewUser ? 'Cancel' : '+ New User'}
          </button>
        </div>

        {showNewUser && (
          <form onSubmit={handleCreateUser} className="p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value.toLowerCase() })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="johndoe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(optional)</span></label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 mt-5"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        )}

        {/* Users List */}
        {users.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No users in this organization yet.</p>
        ) : (
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                      <p className="text-xs text-gray-500">@{user.username} {user.email ? `· ${user.email}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={e => handleUpdateRole(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        disabled={user.id === userProfile?.id}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handlePasswordChange(user.id)}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Change Password
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                        disabled={user.id === userProfile?.id}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <UserOrganizationManager userId={user.id} userRole={user.role} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <PasswordChangeModal
            onClose={() => {
              setShowPasswordModal(false)
              setSelectedUserId(null)
            }}
            targetUserId={selectedUserId}
          />
        )}
      </div>
    </div>
  )
}
