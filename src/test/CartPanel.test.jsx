import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CartPanel from '../components/CartPanel'
import { AuthProvider } from '../contexts/AuthContext'

// Mock hooks
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { id: 'user-1', displayName: 'Test Cashier' },
  }),
}))

vi.mock('../hooks/useBillingLogs', () => ({
  useBillingLogs: () => ({
    createBillingLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
  }),
}))

vi.mock('../hooks/useSettings', () => ({
  CURRENCIES: [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
  ],
}))

const mockSettings = {
  currency: 'USD',
  taxEnabled: true,
  taxRate: 10,
  discountMode: 'global',
  globalDiscount: 0,
  categoryDiscounts: {},
  storeInfo: { name: 'Test Store', footer: 'Thank you!' },
}

const mockCart = [
  { id: 'prod-1', name: 'Product 1', price: 10, qty: 2, category: 'Cat1', unit: 'Each' },
  { id: 'prod-2', name: 'Product 2', price: 25, qty: 1, category: 'Cat2', unit: 'Each' },
]

describe('CartPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render empty cart message when cart is empty', () => {
      render(
        <CartPanel
          cart={[]}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={vi.fn()}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    })

    it('should render cart items when cart has items', () => {
      render(
        <CartPanel
          cart={mockCart}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={vi.fn()}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
    })
  })

  describe('Calculations', () => {
    it('should calculate subtotal correctly', () => {
      render(
        <CartPanel
          cart={mockCart}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={vi.fn()}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      // (10 * 2) + (25 * 1) = 45
      expect(screen.getByText(/45/)).toBeInTheDocument()
    })

    it('should apply tax when tax is enabled', () => {
      render(
        <CartPanel
          cart={mockCart}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={vi.fn()}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      // Subtotal: 45, Tax (10%): 4.50, Total: 49.50
      expect(screen.getByText(/49.50/)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onUpdateQty when quantity changes', () => {
      const onUpdateQty = vi.fn()
      render(
        <CartPanel
          cart={mockCart}
          onUpdateQty={onUpdateQty}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={vi.fn()}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      
      // Find and click increment button
      const incrementButtons = screen.getAllByText('+')
      fireEvent.click(incrementButtons[0])
      
      expect(onUpdateQty).toHaveBeenCalled()
    })

    it('should call onRemoveItem when remove button is clicked', () => {
      const onRemoveItem = vi.fn()
      render(
        <CartPanel
          cart={mockCart}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={onRemoveItem}
          onClear={vi.fn()}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      
      // Find and click remove buttons (×)
      const removeButtons = screen.getAllByText('×')
      fireEvent.click(removeButtons[0])
      
      expect(onRemoveItem).toHaveBeenCalled()
    })

    it('should call onClear when Clear Cart is clicked', () => {
      const onClear = vi.fn()
      render(
        <CartPanel
          cart={mockCart}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={onClear}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      
      fireEvent.click(screen.getByText('Clear Cart'))
      
      expect(onClear).toHaveBeenCalled()
    })
  })

  describe('Checkout', () => {
    it('should have Checkout button', () => {
      render(
        <CartPanel
          cart={mockCart}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={vi.fn()}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      
      expect(screen.getByText('Checkout')).toBeInTheDocument()
    })

    it('should be disabled when cart is empty', () => {
      render(
        <CartPanel
          cart={[]}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={vi.fn()}
          settings={mockSettings}
          onClose={vi.fn()}
        />
      )
      
      const checkoutBtn = screen.getByText('Checkout')
      expect(checkoutBtn).toBeDisabled()
    })
  })

  describe('Global discount', () => {
    it('should apply global discount when enabled', () => {
      const settingsWithDiscount = {
        ...mockSettings,
        discountMode: 'global',
        globalDiscount: 10, // 10% discount
      }
      
      render(
        <CartPanel
          cart={mockCart}
          onUpdateQty={vi.fn()}
          onUpdateItem={vi.fn()}
          onUpdateItemDiscount={vi.fn()}
          onRemoveItem={vi.fn()}
          onClear={vi.fn()}
          settings={settingsWithDiscount}
          onClose={vi.fn()}
        />
      )
      
      // Subtotal: 45, Discount (10%): 4.50, Tax: 4.05, Total: 44.55
      expect(screen.getByText(/44.55/)).toBeInTheDocument()
    })
  })
})