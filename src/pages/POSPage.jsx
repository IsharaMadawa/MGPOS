import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useSettings, CURRENCIES } from '../hooks/useSettings'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import ProductGrid from '../components/ProductGrid'
import CartPanel from '../components/CartPanel'
import MiscItemModal from '../components/MiscItemModal'

export default function POSPage() {
  const { products } = useProducts()
  const { settings } = useSettings()
  const { categories } = useCategories()
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId } = useOrg()
  const [cart, setCart] = useState([])
  const [showMisc, setShowMisc] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)

  // Determine which orgId is being used
  const currentOrgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId

  const currencySymbol = CURRENCIES.find(c => c.code === settings.currency)?.symbol || '$'

  // Show message if no organization selected (for super admin)
  if (isSuperAdmin && !selectedOrgId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-md">
          <svg className="w-16 h-16 text-amber-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Select an Organization</h2>
          <p className="text-gray-600">Please select an organization from the navigation bar to access its POS.</p>
        </div>
      </div>
    )
  }

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      // Create a unique key combining product id and selected unit
      // This ensures same product with different units appears as separate line items
      const itemKey = product.id + '|' + (product.selectedUnit || product.unit || 'Each')
      const existingKey = (item) => item.id + '|' + (item.selectedUnit || item.unit || 'Each')
      
      const existing = prev.find(i => existingKey(i) === itemKey)
      if (existing) {
        return prev.map(i => existingKey(i) === itemKey ? { ...i, qty: i.qty + qty } : i)
      }
      // Generate unique id for the cart item to ensure separate line items
      const newItem = { 
        ...product, 
        qty,
        cartItemId: product.id + '_' + Date.now() // Unique cart item ID
      }
      return [...prev, newItem]
    })
  }

  const addMiscItem = (item) => {
    setCart(prev => [...prev, item])
    setShowMisc(false)
  }

  const updateQty = (cartItemId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.cartItemId !== cartItemId))
    } else {
      setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, qty } : i))
    }
  }

  const updateItem = (cartItemId, updatedProduct, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.cartItemId !== cartItemId))
      return
    }
    setCart(prev => {
      // Check if the update changes unit, potentially merging with an existing item
      const itemKey = updatedProduct.id + '|' + (updatedProduct.selectedUnit || updatedProduct.unit || 'Each')
      const existingKey = (item) => item.id + '|' + (item.selectedUnit || item.unit || 'Each')
      
      const otherExisting = prev.find(i => i.cartItemId !== cartItemId && existingKey(i) === itemKey)
      if (otherExisting) {
        // Merge with other existing, remove this one
        return prev.map(i => i.cartItemId === otherExisting.cartItemId ? { ...i, qty: i.qty + qty } : i).filter(i => i.cartItemId !== cartItemId)
      }
      
      return prev.map(i => i.cartItemId === cartItemId ? { ...updatedProduct, qty } : i)
    })
  }

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId))
  }

  const updateItemDiscount = (cartItemId, amount) => {
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, cartDiscount: amount } : i))
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

      {/* Right: Cart - hidden on mobile, accessible via toggle */}
      <div className="hidden lg:flex w-80 flex-shrink-0">
        <CartPanel
          cart={cart}
          onUpdateQty={updateQty}
          onUpdateItem={updateItem}
          onUpdateItemDiscount={updateItemDiscount}
          onRemoveItem={removeFromCart}
          onClear={clearCart}
          settings={settings}
        />
      </div>

      {/* Mobile Cart Toggle Button */}
      <button
        onClick={() => setShowMobileCart(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 active:scale-95 transition-transform"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {cart.reduce((s, i) => s + i.qty, 0)}
          </span>
        )}
      </button>

      {/* Mobile Cart Sheet */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl h-[85vh] overflow-hidden flex flex-col">
            <CartPanel
              cart={cart}
              onUpdateQty={updateQty}
              onUpdateItem={updateItem}
              onUpdateItemDiscount={updateItemDiscount}
              onRemoveItem={removeFromCart}
              onClear={clearCart}
              settings={settings}
              onClose={() => setShowMobileCart(false)}
            />
          </div>
        </div>
      )}

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
