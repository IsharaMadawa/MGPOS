import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MasterDataTab from '../components/MasterDataTab.jsx'

// Mock dependencies
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { id: 'user1', name: 'Test User' }
  })
}))

vi.mock('./ToastContainer', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}))

vi.mock('../utils/logger', () => ({
  logUserAction: vi.fn(),
  LOG_TYPES: {
    MASTER_DATA_CREATE: 'MASTER_DATA_CREATE',
    MASTER_DATA_UPDATE: 'MASTER_DATA_UPDATE',
    MASTER_DATA_DELETE: 'MASTER_DATA_DELETE'
  }
}))

describe('MasterDataTab', () => {
  const mockUpdateSettings = vi.fn()
  const mockSettings = {
    defaultQuantities: [
      { id: 'qty_1', value: 0.5 },
      { id: 'qty_2', value: 1 },
      { id: 'qty_3', value: 2 }
    ],
    unitsOfMeasure: [
      { id: 'kg', name: 'Kilogram', abbreviation: 'kg', type: 'weight', isStandard: true },
      { id: 'g', name: 'Gram', abbreviation: 'g', type: 'weight', isStandard: true },
      { id: 'mg', name: 'Milligram', abbreviation: 'mg', type: 'weight', isStandard: true },
      { id: 'lb', name: 'Pound', abbreviation: 'lb', type: 'weight', isStandard: true },
      { id: 'oz', name: 'Ounce', abbreviation: 'oz', type: 'weight', isStandard: true },
      { id: 't', name: 'Ton', abbreviation: 't', type: 'weight', isStandard: true },
      { id: 'l', name: 'Liter', abbreviation: 'L', type: 'volume', isStandard: true },
      { id: 'ml', name: 'Milliliter', abbreviation: 'mL', type: 'volume', isStandard: true },
      { id: 'gal', name: 'Gallon', abbreviation: 'gal', type: 'volume', isStandard: true },
      { id: 'qt', name: 'Quart', abbreviation: 'qt', type: 'volume', isStandard: true },
      { id: 'pt', name: 'Pint', abbreviation: 'pt', type: 'volume', isStandard: true },
      { id: 'fl_oz', name: 'Fluid Ounce', abbreviation: 'fl oz', type: 'volume', isStandard: true },
      { id: 'm', name: 'Meter', abbreviation: 'm', type: 'length', isStandard: true },
      { id: 'cm', name: 'Centimeter', abbreviation: 'cm', type: 'length', isStandard: true },
      { id: 'mm', name: 'Millimeter', abbreviation: 'mm', type: 'length', isStandard: true },
      { id: 'km', name: 'Kilometer', abbreviation: 'km', type: 'length', isStandard: true },
      { id: 'in', name: 'Inch', abbreviation: 'in', type: 'length', isStandard: true },
      { id: 'ft', name: 'Foot', abbreviation: 'ft', type: 'length', isStandard: true },
      { id: 'yd', name: 'Yard', abbreviation: 'yd', type: 'length', isStandard: true },
      { id: 'mi', name: 'Mile', abbreviation: 'mi', type: 'length', isStandard: true },
      { id: 'sq_m', name: 'Square Meter', abbreviation: 'm²', type: 'area', isStandard: true },
      { id: 'sq_cm', name: 'Square Centimeter', abbreviation: 'cm²', type: 'area', isStandard: true },
      { id: 'sq_ft', name: 'Square Foot', abbreviation: 'ft²', type: 'area', isStandard: true },
      { id: 'sq_in', name: 'Square Inch', abbreviation: 'in²', type: 'area', isStandard: true },
      { id: 'acre', name: 'Acre', abbreviation: 'acre', type: 'area', isStandard: true },
      { id: 'ha', name: 'Hectare', abbreviation: 'ha', type: 'area', isStandard: true },
      { id: 'pcs', name: 'Pieces', abbreviation: 'pcs', type: 'unit', isStandard: true },
      { id: 'unit', name: 'Unit', abbreviation: 'unit', type: 'unit', isStandard: true },
      { id: 'box', name: 'Box', abbreviation: 'box', type: 'unit', isStandard: true },
      { id: 'pkg', name: 'Package', abbreviation: 'pkg', type: 'unit', isStandard: true },
      { id: 'set', name: 'Set', abbreviation: 'set', type: 'unit', isStandard: true },
      { id: 'pair', name: 'Pair', abbreviation: 'pair', type: 'unit', isStandard: true },
      { id: 'dozen', name: 'Dozen', abbreviation: 'doz', type: 'unit', isStandard: true },
      { id: 'bottle', name: 'Bottle', abbreviation: 'bottle', type: 'unit', isStandard: true },
      { id: 'bag', name: 'Bag', abbreviation: 'bag', type: 'unit', isStandard: true },
      { id: 'carton', name: 'Carton', abbreviation: 'carton', type: 'unit', isStandard: true },
      { id: 'sec', name: 'Second', abbreviation: 's', type: 'time', isStandard: true },
      { id: 'min', name: 'Minute', abbreviation: 'min', type: 'time', isStandard: true },
      { id: 'hr', name: 'Hour', abbreviation: 'h', type: 'time', isStandard: true },
      { id: 'day', name: 'Day', abbreviation: 'day', type: 'time', isStandard: true },
      { id: 'week', name: 'Week', abbreviation: 'week', type: 'time', isStandard: true },
      { id: 'month', name: 'Month', abbreviation: 'month', type: 'time', isStandard: true },
      { id: 'year', name: 'Year', abbreviation: 'year', type: 'time', isStandard: true },
      { id: 'c', name: 'Celsius', abbreviation: '°C', type: 'temperature', isStandard: true },
      { id: 'f', name: 'Fahrenheit', abbreviation: '°F', type: 'temperature', isStandard: true },
      { id: 'k', name: 'Kelvin', abbreviation: 'K', type: 'temperature', isStandard: true },
      { id: 'custom1', name: 'Custom Unit', abbreviation: 'cu', type: 'volume', isStandard: false }
    ],
    masterCategories: [
      { id: 'custom1', name: 'Custom Category', description: 'Custom items', color: '#3B82F6', isDefault: false }
    ]
  }

  beforeEach(() => {
    mockUpdateSettings.mockClear()
  })

  describe('Default Quantities Section', () => {
    it('should display default quantities', () => {
      render(<MasterDataTab settings={mockSettings} updateSettings={mockUpdateSettings} />)
      
      expect(screen.getByText('0.5')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should add new quantity', async () => {
      render(<MasterDataTab settings={mockSettings} updateSettings={mockUpdateSettings} />)
      
      const input = screen.getByPlaceholderText('Enter quantity (e.g., 0.5)')
      const addButton = screen.getByText('Add')
      
      fireEvent.change(input, { target: { value: '3.5' } })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          defaultQuantities: [
            ...mockSettings.defaultQuantities,
            { id: expect.any(String), value: 3.5 }
          ]
        })
      })
    })

    it('should delete quantity', async () => {
      render(<MasterDataTab settings={mockSettings} updateSettings={mockUpdateSettings} />)
      
      const deleteButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && button.closest('.flex.items-center.gap-2.p-3')
      )
      
      fireEvent.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          defaultQuantities: mockSettings.defaultQuantities.filter(q => q.id !== 'qty_1')
        })
      })
    })

    it('should validate quantity input', () => {
      render(<MasterDataTab settings={mockSettings} updateSettings={mockUpdateSettings} />)
      
      const input = screen.getByPlaceholderText('Enter quantity (e.g., 0.5)')
      const addButton = screen.getByText('Add')
      
      fireEvent.change(input, { target: { value: '-1' } })
      fireEvent.click(addButton)
      
      expect(screen.getByText('Enter a valid positive number')).toBeInTheDocument()
    })
  })

  describe('Units of Measure Section', () => {
    beforeEach(() => {
      // Switch to units section
      render(<MasterDataTab settings={mockSettings} updateSettings={mockUpdateSettings} />)
      const unitsButton = screen.getByText('Units of Measure')
      fireEvent.click(unitsButton)
    })

    it('should display units grouped by type', () => {
      expect(screen.getByText('Weight')).toBeInTheDocument()
      expect(screen.getByText('Volume')).toBeInTheDocument()
      expect(screen.getByText('Kilogram')).toBeInTheDocument()
      expect(screen.getByText('Gram')).toBeInTheDocument()
      expect(screen.getByText('Custom Unit')).toBeInTheDocument()
    })

    it('should show "Standard" badge for standard units', () => {
      const standardBadges = screen.getAllByText('Standard')
      expect(standardBadges.length).toBeGreaterThan(0)
    })

    it('should not show edit/delete buttons for standard units', () => {
      const standardUnits = screen.getAllByText('Standard')
      standardUnits.forEach(badge => {
        const unitRow = badge.closest('.flex.items-center.justify-between.p-2')
        const editButtons = unitRow?.querySelectorAll('button')
        expect(editButtons?.length).toBe(1) // Only abbreviation span
      })
    })

    it('should show edit/delete buttons for custom units', () => {
      const customUnitRow = screen.getByText('Custom Unit').closest('.flex.items-center.justify-between.p-2')
      const buttons = customUnitRow.querySelectorAll('button')
      expect(buttons.length).toBe(2) // Edit and Delete buttons
    })

    it('should add new custom unit', async () => {
      const newUnitButton = screen.getByText('+ New Unit')
      fireEvent.click(newUnitButton)
      
      const nameInput = screen.getByPlaceholderText('e.g., Kilogram')
      const abbreviationInput = screen.getByPlaceholderText('e.g., kg')
      const createButton = screen.getByText('Create Unit')
      
      fireEvent.change(nameInput, { target: { value: 'Test Unit' } })
      fireEvent.change(abbreviationInput, { target: { value: 'tu' } })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          unitsOfMeasure: [
            ...mockSettings.unitsOfMeasure,
            expect.objectContaining({
              name: 'Test Unit',
              abbreviation: 'tu',
              type: 'weight',
              isStandard: false
            })
          ]
        })
      })
    })

    it('should edit custom unit', async () => {
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      const nameInput = screen.getByDisplayValue('Custom Unit')
      const updateButton = screen.getByText('Update Unit')
      
      fireEvent.change(nameInput, { target: { value: 'Updated Unit' } })
      fireEvent.click(updateButton)
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          unitsOfMeasure: expect.arrayContaining([
            expect.objectContaining({
              id: 'custom1',
              name: 'Updated Unit'
            })
          ])
        })
      })
    })

    it('should delete custom unit', async () => {
      const deleteButton = screen.getByText('Delete')
      window.confirm = vi.fn(() => true)
      
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          unitsOfMeasure: mockSettings.unitsOfMeasure.filter(u => u.id !== 'custom1')
        })
      })
    })

    it('should validate unit abbreviation uniqueness', async () => {
      const newUnitButton = screen.getByText('+ New Unit')
      fireEvent.click(newUnitButton)
      
      const nameInput = screen.getByPlaceholderText('e.g., Kilogram')
      const abbreviationInput = screen.getByPlaceholderText('e.g., kg')
      const createButton = screen.getByText('Create Unit')
      
      fireEvent.change(nameInput, { target: { value: 'Test Unit' } })
      fireEvent.change(abbreviationInput, { target: { value: 'kg' } }) // Existing abbreviation
      fireEvent.click(createButton)
      
      expect(screen.getByText('This abbreviation already exists')).toBeInTheDocument()
    })
  })

  describe('Master Categories Section', () => {
    beforeEach(() => {
      // Switch to categories section
      render(<MasterDataTab settings={mockSettings} updateSettings={mockUpdateSettings} />)
      const categoriesButton = screen.getByText('Categories')
      fireEvent.click(categoriesButton)
    })

    it('should display categories with color indicators', () => {
      expect(screen.getByText('Food & Beverages')).toBeInTheDocument()
      expect(screen.getByText('Custom Category')).toBeInTheDocument()
      
      // Check for color indicators (div elements with background color)
      const colorIndicators = document.querySelectorAll('[style*="background-color"]')
      expect(colorIndicators.length).toBeGreaterThan(0)
    })

    it('should add new category', async () => {
      const newCategoryButton = screen.getByText('+ New Category')
      fireEvent.click(newCategoryButton)
      
      const nameInput = screen.getByPlaceholderText('e.g., Food & Beverages')
      const descriptionInput = screen.getByPlaceholderText('Brief description of this category')
      const createButton = screen.getByText('Create Category')
      
      fireEvent.change(nameInput, { target: { value: 'Test Category' } })
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          masterCategories: [
            ...mockSettings.masterCategories,
            expect.objectContaining({
              name: 'Test Category',
              description: 'Test description',
              color: expect.any(String),
              isDefault: false
            })
          ]
        })
      })
    })

    it('should edit category', async () => {
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      const nameInput = screen.getByDisplayValue('Custom Category')
      const updateButton = screen.getByText('Update Category')
      
      fireEvent.change(nameInput, { target: { value: 'Updated Category' } })
      fireEvent.click(updateButton)
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          masterCategories: expect.arrayContaining([
            expect.objectContaining({
              id: 'custom1',
              name: 'Updated Category'
            })
          ])
        })
      })
    })

    it('should delete category', async () => {
      const deleteButton = screen.getByText('Delete')
      window.confirm = vi.fn(() => true)
      
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledWith({
          masterCategories: mockSettings.masterCategories.filter(c => c.id !== 'custom1')
        })
      })
    })

    it('should validate category name uniqueness', async () => {
      const newCategoryButton = screen.getByText('+ New Category')
      fireEvent.click(newCategoryButton)
      
      const nameInput = screen.getByPlaceholderText('e.g., Food & Beverages')
      const createButton = screen.getByText('Create Category')
      
      fireEvent.change(nameInput, { target: { value: 'Food & Beverages' } }) // Existing name
      fireEvent.click(createButton)
      
      expect(screen.getByText('This category name already exists')).toBeInTheDocument()
    })

    it('should allow color selection', async () => {
      const newCategoryButton = screen.getByText('+ New Category')
      fireEvent.click(newCategoryButton)
      
      const colorButtons = document.querySelectorAll('[style*="background-color"]')
      const firstColorButton = Array.from(colorButtons).find(button => 
        button.style.backgroundColor && button.tagName === 'BUTTON'
      )
      
      if (firstColorButton) {
        fireEvent.click(firstColorButton)
        
        // Check that the color is selected (has border-gray-800 class)
        expect(firstColorButton).toHaveClass('border-gray-800')
      }
    })
  })

  describe('Navigation', () => {
    it('should switch between sections', () => {
      render(<MasterDataTab settings={mockSettings} updateSettings={mockUpdateSettings} />)
      
      // Initially on quantities
      expect(screen.getByText('Default Quantities')).toBeInTheDocument()
      
      // Switch to units
      fireEvent.click(screen.getByText('Units of Measure'))
      expect(screen.getByText('Units of Measure')).toBeInTheDocument()
      
      // Switch to categories
      fireEvent.click(screen.getByText('Categories'))
      expect(screen.getByText('Master Categories')).toBeInTheDocument()
    })

    it('should highlight active section', () => {
      render(<MasterDataTab settings={mockSettings} updateSettings={mockUpdateSettings} />)
      
      const quantitiesButton = screen.getByText('Quantities')
      expect(quantitiesButton).toHaveClass('bg-white', 'text-emerald-600')
      
      fireEvent.click(screen.getByText('Units of Measure'))
      expect(quantitiesButton).not.toHaveClass('bg-white', 'text-emerald-600')
    })
  })

  describe('Default Values', () => {
    it('should use default quantities when none provided', () => {
      const settingsWithoutQuantities = { ...mockSettings, defaultQuantities: undefined }
      render(<MasterDataTab settings={settingsWithoutQuantities} updateSettings={mockUpdateSettings} />)
      
      expect(screen.getByText('0.5')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('should use default units when none provided', () => {
      const settingsWithoutUnits = { ...mockSettings, unitsOfMeasure: undefined }
      render(<MasterDataTab settings={settingsWithoutUnits} updateSettings={mockUpdateSettings} />)
      
      fireEvent.click(screen.getByText('Units of Measure'))
      
      expect(screen.getByText('Kilogram')).toBeInTheDocument()
      expect(screen.getByText('Gram')).toBeInTheDocument()
      expect(screen.getByText('Liter')).toBeInTheDocument()
      expect(screen.getByText('Pieces')).toBeInTheDocument()
    })

    it('should use empty categories when none provided', () => {
      const settingsWithoutCategories = { ...mockSettings, masterCategories: undefined }
      render(<MasterDataTab settings={settingsWithoutCategories} updateSettings={mockUpdateSettings} />)
      
      fireEvent.click(screen.getByText('Categories'))
      
      // Should show empty state message
      expect(screen.getByText('No master categories added yet')).toBeInTheDocument()
    })
  })
})
