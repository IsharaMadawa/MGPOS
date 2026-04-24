import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useSettings, CURRENCIES } from '../hooks/useSettings'
import { useCategories } from '../hooks/useCategories'
import ProductGrid from '../components/ProductGrid'
import CartPanel from '../components/CartPanel'
import MiscItemModal from '../components/MiscItemModal'

// Quick quantity input modal
function QtyModal({ product, onConfirm, onClose, currencySymbol, defaultQuantities = [] }) {
  const [qty, setQty] = useState('1')
  const sym = currencySymbol || '$'

  const handleConfirm = () => {
    const q = parseFloat(qty) || 1
    if (q > 0) onConfirm(product, q)
  }

  const handleQuickAdd = (value) => {
    onConfirm(product, value)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-4 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{sym}{Number(product.price).toFixed(2)} / {product.unit || 'Each'}</p>
        
        <label className="block text-xs text-gray-500 mb-1">
          Quantity{product.unit && product.unit !== 'Each' ? ` (${product.unit})` : ''}
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          autoFocus
          value={qty}
          onChange={e => setQty(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        
        {defaultQuantities.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Quick select</p>
            <div className="flex flex-wrap gap-1.5">
              {defaultQuantities.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleQuickAdd(item.value)}
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
            onClick={handleConfirm}
            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default function POSPage() {
  const { products } = useProducts()
  const { settings } = useSettings()
  const { categories } = useCategories()
  const [cart, setCart] = useState([])
  const [showMisc, setShowMisc] = useState(false)
  const [pendingProduct, setPendingProduct] = useState(null)

  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

  const addToCart = (product) => {
    setPendingProduct(product)
  }

  const confirmAddToCart = (product, qty) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i)
      }
      return [...prev, { ...product, qty }]
    })
    setPendingProduct(null)
  }

  const addMiscItem = (item) => {
    setCart(prev => [...prev, item])
    setShowMisc(false)
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== id))
    } else {
      setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
    }
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const updateItemDiscount = (id, amount) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, cartDiscount: amount } : i))
  }

  const clearCart = () => setCart([])

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Product Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <ProductGrid
          products={products}
          categories={categories}
          onAddToCart={addToCart}
          currencySymbol={currencySymbol}
          settings={settings}
        />

        {/* Misc Item Button */}
        {settings.miscEnabled !== false && (
          <div className="px-4 pb-4 flex-shrink-0">
            <button
              onClick={() => setShowMisc(true)}
              className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl text-sm font-medium hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Miscellaneous Item
            </button>
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <CartPanel
        cart={cart}
        onUpdateQty={updateQty}
        onUpdateItemDiscount={updateItemDiscount}
        onRemoveItem={removeFromCart}
        onClear={clearCart}
        settings={settings}
      />

      {/* Misc Modal */}
      {showMisc && (
        <MiscItemModal
          onConfirm={addMiscItem}
          onClose={() => setShowMisc(false)}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Quantity Modal */}
      {pendingProduct && (
        <QtyModal
          product={pendingProduct}
          onConfirm={confirmAddToCart}
          onClose={() => setPendingProduct(null)}
          currencySymbol={currencySymbol}
          defaultQuantities={settings.defaultQuantities}
        />
      )}
    </div>
  )
}
