import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useSettings, CURRENCIES } from '../hooks/useSettings'
import { useCategories } from '../hooks/useCategories'
import ProductGrid from '../components/ProductGrid'
import CartPanel from '../components/CartPanel'
import MiscItemModal from '../components/MiscItemModal'

export default function POSPage() {
  const { products } = useProducts()
  const { settings } = useSettings()
  const { categories } = useCategories()
  const [cart, setCart] = useState([])
  const [showMisc, setShowMisc] = useState(false)

  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...product, qty: 1 }]
    })
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
    </div>
  )
}
