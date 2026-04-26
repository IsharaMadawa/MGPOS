import { useState } from 'react'
import ProductModal from './ProductModal'

const CATEGORY_ICONS = {
  Beverages: '🥤',
  Food: '🍔',
  Electronics: '📱',
  Clothing: '👕',
  Other: '📦',
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || '📦'
}

export default function ProductGrid({ products, categories, onAddToCart, currencySymbol, settings }) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const sym = currencySymbol || '$'
  const discountMode = settings?.discountMode || 'global'

  const filtered = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Get the primary price (first price in the array)
  const getPrimaryPrice = (product) => {
    if (product.prices && product.prices.length > 0) {
      return product.prices[0].price
    }
    return product.price || 0
  }

  // Get all prices for display
  const getPriceDisplay = (product) => {
    if (product.prices && product.prices.length > 0) {
      return product.prices.map(p => `${sym}${Number(p.price).toFixed(2)}/${p.unit}`).join(', ')
    }
    return `${sym}${Number(product.price || 0).toFixed(2)}`
  }

  // Get discount info for a product
  const getDiscountInfo = (product) => {
    const mode = settings?.discountMode || 'global'
    const basePrice = getPrimaryPrice(product)
    
    if (mode === 'item' && product.discount?.enabled) {
      const isPct = product.discount.type === 'percentage'
      const discountedPrice = isPct 
        ? basePrice * (1 - product.discount.value / 100)
        : Math.max(0, basePrice - product.discount.value)
      return {
        originalPrice: basePrice,
        discountedPrice,
        discountText: isPct ? `−${product.discount.value}%` : `−${sym}${product.discount.value}`,
        isPercentage: isPct,
      }
    }
    
    if (mode === 'category') {
      const catDisc = settings?.categoryDiscounts?.[product.category]
      if (catDisc?.enabled) {
        const isPct = catDisc.type === 'percentage'
        const discountedPrice = isPct 
          ? basePrice * (1 - catDisc.value / 100)
          : Math.max(0, basePrice - catDisc.value)
        return {
          originalPrice: basePrice,
          discountedPrice,
          discountText: isPct ? `−${catDisc.value}%` : `−${sym}${catDisc.value}`,
          isPercentage: isPct,
        }
      }
    }
    
    if (mode === 'global' && settings?.globalDiscount) {
      const discountedPrice = basePrice * (1 - settings.globalDiscount / 100)
      return {
        originalPrice: basePrice,
        discountedPrice,
        discountText: `−${settings.globalDiscount}%`,
        isPercentage: true,
      }
    }
    
    return null
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 border border-gray-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {[{'id': 'All', 'name': 'All'}, ...categories].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm font-medium">No products found</p>
            {products.length === 0 && (
              <p className="text-xs mt-1">Add products in Settings</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2">
            {filtered.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all text-left group active:scale-95"
              >
                <div className="w-full h-14 bg-emerald-50 rounded-md mb-1.5 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <span className="text-2xl select-none">{getCategoryIcon(product.category)}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                  {product.name}
                  {settings?.discountMode === 'item' && product.discount?.enabled && (
                    <span className="text-xs text-rose-600 ml-1">(
                      {product.discount.type === 'percentage'
                        ? `-${product.discount.value}%`
                        : `-${sym}${Number(product.discount.value).toFixed(2)}`}
                    )</span>
                  )}
                </p>
                {(() => {
                  // Show all prices per unit in green
                  const priceList = product.prices && product.prices.length > 0
                    ? product.prices.map(p => (
                        <span key={p.unit} className="block text-xs font-bold text-emerald-700">
                          {sym}{Number(p.price).toFixed(2)} / {p.unit}
                        </span>
                      ))
                    : [<span key="single" className="block text-xs font-bold text-emerald-700">{sym}{Number(product.price || 0).toFixed(2)}</span>];

                  return (
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      {priceList}
                    </div>
                  );
                })()}
                {product.stock != null && (
                  <p className={`text-[10px] mt-0.5 ${product.stock <= 5 ? 'text-orange-500' : 'text-gray-400'}`}>
                    Stock: {product.stock}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Single Quantity Modal - merged with unit selection */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onSave={(updatedProduct, qty) => {
            onAddToCart(updatedProduct, qty)
            setSelectedProduct(null)
          }}
          onClose={() => setSelectedProduct(null)}
          currencySymbol={sym}
          settings={settings}
        />
      )}
    </div>
  )
}
