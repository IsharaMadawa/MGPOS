import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './ToastContainer'
import { logUserAction, LOG_TYPES } from '../utils/logger'

function MasterDataTab({ settings, updateSettings }) {
  const { userProfile } = useAuth()
  const { addToast } = useToast()
  const [activeSection, setActiveSection] = useState('quantities')

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Master Data Management</h3>
        <div className="flex gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('quantities')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeSection === 'quantities'
                ? 'bg-white text-emerald-600 shadow-sm border border-emerald-200'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Quantities
          </button>
          <button
            onClick={() => setActiveSection('units')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeSection === 'units'
                ? 'bg-white text-emerald-600 shadow-sm border border-emerald-200'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Units of Measure
          </button>
          <button
            onClick={() => setActiveSection('categories')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeSection === 'categories'
                ? 'bg-white text-emerald-600 shadow-sm border border-emerald-200'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Default Quantities Section */}
      {activeSection === 'quantities' && <DefaultQuantitiesSection settings={settings} updateSettings={updateSettings} />}

      {/* Units of Measure Section */}
      {activeSection === 'units' && <UnitsOfMeasureSection settings={settings} updateSettings={updateSettings} userProfile={userProfile} addToast={addToast} />}

      {/* Categories Section */}
      {activeSection === 'categories' && <MasterCategoriesSection settings={settings} updateSettings={updateSettings} userProfile={userProfile} addToast={addToast} />}
    </div>
  )
}

// Default Quantities Section (existing functionality)
function DefaultQuantitiesSection({ settings, updateSettings }) {
  const [newQty, setNewQty] = useState('')
  const [error, setError] = useState('')

  // Use database defaults if no settings exist
  const quantities = settings?.defaultQuantities || [
    { id: 'qty_1', value: 0.5 },
    { id: 'qty_2', value: 1 },
    { id: 'qty_3', value: 2 },
    { id: 'qty_4', value: 5 },
    { id: 'qty_5', value: 10 },
  ]

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
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <div className="mb-4">
        <h4 className="font-medium text-gray-900">Default Quantities</h4>
        <p className="text-sm text-gray-600 mt-1">
          Quick-select values shown in the quantity popup when adding products
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
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
    </div>
  )
}

// Units of Measure Section (fully implemented)
function UnitsOfMeasureSection({ settings, updateSettings, userProfile, addToast }) {
  const [showNewUnit, setShowNewUnit] = useState(false)
  const [newUnit, setNewUnit] = useState({ name: '', abbreviation: '', type: 'weight' })
  const [editingUnit, setEditingUnit] = useState(null)
  const [error, setError] = useState('')

  // Use database defaults if no settings exist
  const units = settings?.unitsOfMeasure || [
    { id: 'kg', name: 'Kilogram', abbreviation: 'kg', type: 'weight', isDefault: true },
    { id: 'g', name: 'Gram', abbreviation: 'g', type: 'weight', isDefault: true },
    { id: 'l', name: 'Liter', abbreviation: 'L', type: 'volume', isDefault: true },
    { id: 'ml', name: 'Milliliter', abbreviation: 'mL', type: 'volume', isDefault: true },
    { id: 'pcs', name: 'Pieces', abbreviation: 'pcs', type: 'unit', isDefault: true },
    { id: 'box', name: 'Box', abbreviation: 'box', type: 'unit', isDefault: true },
  ]

  const unitTypes = [
    { value: 'weight', label: 'Weight', icon: '⚖️' },
    { value: 'volume', label: 'Volume', icon: '🥤' },
    { value: 'length', label: 'Length', icon: '📏' },
    { value: 'area', label: 'Area', icon: '📐' },
    { value: 'unit', label: 'Unit/Count', icon: '🔢' },
    { value: 'time', label: 'Time', icon: '⏰' },
    { value: 'temperature', label: 'Temperature', icon: '🌡️' },
  ]

  const handleAddUnit = (e) => {
    e.preventDefault()
    
    if (!newUnit.name.trim() || !newUnit.abbreviation.trim()) {
      setError('Name and abbreviation are required')
      return
    }

    // Check for duplicate abbreviation
    if (units.some(unit => unit.abbreviation.toLowerCase() === newUnit.abbreviation.toLowerCase())) {
      setError('This abbreviation already exists')
      return
    }

    const unitId = 'unit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const updatedUnits = [...units, {
      id: unitId,
      name: newUnit.name.trim(),
      abbreviation: newUnit.abbreviation.trim(),
      type: newUnit.type,
      isDefault: false,
      createdAt: new Date().toISOString()
    }]

    updateSettings({ unitsOfMeasure: updatedUnits })
    
    // Log unit creation
    try {
      logUserAction(
        LOG_TYPES.MASTER_DATA_CREATE,
        `Created unit of measure: ${newUnit.name} (${newUnit.abbreviation})`,
        userProfile,
        null,
        { unitId, name: newUnit.name, abbreviation: newUnit.abbreviation, type: newUnit.type }
      )
    } catch (logError) {
      console.error('Failed to log unit creation:', logError)
    }

    addToast('Unit of measure created successfully!', 'success')
    setNewUnit({ name: '', abbreviation: '', type: 'weight' })
    setShowNewUnit(false)
    setError('')
  }

  const handleEditUnit = (unit) => {
    setEditingUnit(unit)
    setNewUnit({ name: unit.name, abbreviation: unit.abbreviation, type: unit.type })
    setError('')
  }

  const handleUpdateUnit = (e) => {
    e.preventDefault()
    
    if (!newUnit.name.trim() || !newUnit.abbreviation.trim()) {
      setError('Name and abbreviation are required')
      return
    }

    // Check for duplicate abbreviation (excluding current unit)
    if (units.some(unit => 
      unit.id !== editingUnit.id && 
      unit.abbreviation.toLowerCase() === newUnit.abbreviation.toLowerCase()
    )) {
      setError('This abbreviation already exists')
      return
    }

    const updatedUnits = units.map(unit => 
      unit.id === editingUnit.id 
        ? { ...unit, name: newUnit.name.trim(), abbreviation: newUnit.abbreviation.trim(), type: newUnit.type }
        : unit
    )

    updateSettings({ unitsOfMeasure: updatedUnits })
    
    // Log unit update
    try {
      logUserAction(
        LOG_TYPES.MASTER_DATA_UPDATE,
        `Updated unit of measure: ${editingUnit.name} → ${newUnit.name}`,
        userProfile,
        null,
        { 
          unitId: editingUnit.id,
          oldName: editingUnit.name,
          newName: newUnit.name,
          oldAbbreviation: editingUnit.abbreviation,
          newAbbreviation: newUnit.abbreviation
        }
      )
    } catch (logError) {
      console.error('Failed to log unit update:', logError)
    }

    addToast('Unit of measure updated successfully!', 'success')
    setEditingUnit(null)
    setNewUnit({ name: '', abbreviation: '', type: 'weight' })
    setError('')
  }

  const handleDeleteUnit = (unit) => {
    if (!confirm(`Are you sure you want to delete unit "${unit.name}"?`)) return

    const updatedUnits = units.filter(u => u.id !== unit.id)
    updateSettings({ unitsOfMeasure: updatedUnits })
    
    // Log unit deletion
    try {
      logUserAction(
        LOG_TYPES.MASTER_DATA_DELETE,
        `Deleted unit of measure: ${unit.name}`,
        userProfile,
        null,
        { unitId: unit.id, name: unit.name, abbreviation: unit.abbreviation }
      )
    } catch (logError) {
      console.error('Failed to log unit deletion:', logError)
    }

    addToast('Unit of measure deleted successfully!', 'success')
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-medium text-gray-900">Units of Measure</h4>
          <p className="text-sm text-gray-600 mt-1">
            Standard measurement units used throughout the system
          </p>
        </div>
        <button
          onClick={() => setShowNewUnit(!showNewUnit)}
          className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showNewUnit ? 'Cancel' : '+ New Unit'}
        </button>
      </div>

      {showNewUnit && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h5 className="font-medium text-gray-900 mb-3">
            {editingUnit ? 'Edit Unit' : 'Create New Unit'}
          </h5>
          <form onSubmit={editingUnit ? handleUpdateUnit : handleAddUnit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit Name</label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={e => setNewUnit({ ...newUnit, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Kilogram"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Abbreviation</label>
                <input
                  type="text"
                  value={newUnit.abbreviation}
                  onChange={e => setNewUnit({ ...newUnit, abbreviation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., kg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newUnit.type}
                  onChange={e => setNewUnit({ ...newUnit, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {unitTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {editingUnit ? 'Update Unit' : 'Create Unit'}
              </button>
              {editingUnit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUnit(null)
                    setNewUnit({ name: '', abbreviation: '', type: 'weight' })
                    setError('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {unitTypes.map(type => {
          const typeUnits = units.filter(unit => unit.type === type.value)
          if (typeUnits.length === 0) return null

          return (
            <div key={type.value} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{type.icon}</span>
                <h5 className="font-medium text-gray-900">{type.label}</h5>
                <span className="text-xs text-gray-500">({typeUnits.length} units)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {typeUnits.map(unit => (
                  <div key={unit.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{unit.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded">
                        {unit.abbreviation}
                      </span>
                      <button
                        onClick={() => handleEditUnit(unit)}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Master Categories Section (fully implemented)
function MasterCategoriesSection({ settings, updateSettings, userProfile, addToast }) {
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#6B7280', icon: '??' })
  const [editingCategory, setEditingCategory] = useState(null)
  const [error, setError] = useState('')

  // Use database defaults if no settings exist
  const masterCategories = settings?.masterCategories || [
    { id: 'food', name: 'Food & Beverages', description: 'Edible items and drinks', color: '#EF4444', icon: '??', isDefault: true },
    { id: 'electronics', name: 'Electronics', description: 'Electronic devices and accessories', color: '#3B82F6', icon: '??', isDefault: true },
    { id: 'clothing', name: 'Clothing', description: 'Apparel and accessories', color: '#8B5CF6', icon: '??', isDefault: true },
    { id: 'household', name: 'Household', description: 'Home and kitchen items', color: '#10B981', icon: '??', isDefault: true },
    { id: 'other', name: 'Other', description: 'Miscellaneous items', color: '#6B7280', icon: '??', isDefault: true },
  ]

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#6B7280'
  ]

  const iconOptions = ['🍔', '📱', '👕', '🏠', '📦', '🚗', '🏃', '📚', '💻', '🎮', '🎵', '⚽', '🌺', '💎', '🔧', '🎨', '🍷', '☕', '🍰', '🧴']

  const handleAddCategory = (e) => {
    e.preventDefault()
    
    if (!newCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    // Check for duplicate name
    if (masterCategories.some(cat => cat.name.toLowerCase() === newCategory.name.trim().toLowerCase())) {
      setError('This category name already exists')
      return
    }

    const categoryId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const updatedCategories = [...masterCategories, {
      id: categoryId,
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      color: newCategory.color,
      icon: newCategory.icon,
      isDefault: false,
      createdAt: new Date().toISOString()
    }]

    updateSettings({ masterCategories: updatedCategories })
    
    // Log category creation
    try {
      logUserAction(
        LOG_TYPES.MASTER_DATA_CREATE,
        `Created master category: ${newCategory.name}`,
        userProfile,
        null,
        { categoryId, name: newCategory.name, description: newCategory.description, color: newCategory.color }
      )
    } catch (logError) {
      console.error('Failed to log category creation:', logError)
    }

    addToast('Master category created successfully!', 'success')
    setNewCategory({ name: '', description: '', color: '#6B7280', icon: '📦' })
    setShowNewCategory(false)
    setError('')
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setNewCategory({ 
      name: category.name, 
      description: category.description, 
      color: category.color, 
      icon: category.icon 
    })
    setError('')
  }

  const handleUpdateCategory = (e) => {
    e.preventDefault()
    
    if (!newCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    // Check for duplicate name (excluding current category)
    if (masterCategories.some(cat => 
      cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === newCategory.name.trim().toLowerCase()
    )) {
      setError('This category name already exists')
      return
    }

    const updatedCategories = masterCategories.map(cat => 
      cat.id === editingCategory.id 
        ? { 
            ...cat, 
            name: newCategory.name.trim(),
            description: newCategory.description.trim(),
            color: newCategory.color,
            icon: newCategory.icon
          }
        : cat
    )

    updateSettings({ masterCategories: updatedCategories })
    
    // Log category update
    try {
      logUserAction(
        LOG_TYPES.MASTER_DATA_UPDATE,
        `Updated master category: ${editingCategory.name} → ${newCategory.name}`,
        userProfile,
        null,
        { 
          categoryId: editingCategory.id,
          oldName: editingCategory.name,
          newName: newCategory.name,
          oldColor: editingCategory.color,
          newColor: newCategory.color
        }
      )
    } catch (logError) {
      console.error('Failed to log category update:', logError)
    }

    addToast('Master category updated successfully!', 'success')
    setEditingCategory(null)
    setNewCategory({ name: '', description: '', color: '#6B7280', icon: '📦' })
    setError('')
  }

  const handleDeleteCategory = (category) => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) return

    const updatedCategories = masterCategories.filter(cat => cat.id !== category.id)
    updateSettings({ masterCategories: updatedCategories })
    
    // Log category deletion
    try {
      logUserAction(
        LOG_TYPES.MASTER_DATA_DELETE,
        `Deleted master category: ${category.name}`,
        userProfile,
        null,
        { categoryId: category.id, name: category.name, color: category.color }
      )
    } catch (logError) {
      console.error('Failed to log category deletion:', logError)
    }

    addToast('Master category deleted successfully!', 'success')
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-medium text-gray-900">Master Categories</h4>
          <p className="text-sm text-gray-600 mt-1">
            Organization-wide categories that can be used across all locations
          </p>
        </div>
        <button
          onClick={() => setShowNewCategory(!showNewCategory)}
          className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showNewCategory ? 'Cancel' : '+ New Category'}
        </button>
      </div>

      {showNewCategory && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h5 className="font-medium text-gray-900 mb-3">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h5>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Food & Beverages"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                <select
                  value={newCategory.icon}
                  onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>
                      {icon} {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
              <textarea
                value={newCategory.description}
                onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Brief description of this category"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, color })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      newCategory.color === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null)
                    setNewCategory({ name: '', description: '', color: '#6B7280', icon: '📦' })
                    setError('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {masterCategories.map(category => (
          <div key={category.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span 
                  className="text-lg p-1 rounded" 
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </span>
                <div>
                  <h5 className="font-medium text-gray-900 text-sm">{category.name}</h5>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
            {category.description && (
              <p className="text-xs text-gray-600">{category.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MasterDataTab
