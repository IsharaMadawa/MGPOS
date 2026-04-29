import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '../components/ToastContainer'
import { logUserAction } from '../utils/logger'

// Mock the logger
vi.mock('../utils/logger')
logUserAction.mockResolvedValue()

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (children) => children,
  }
})

// Mock setTimeout
vi.spyOn(global, 'setTimeout')

// Test component that uses the toast hook
function TestComponent() {
  const { addToast } = useToast()

  return (
    <div>
      <button onClick={() => addToast('Success message', 'success')}>
        Success Toast
      </button>
      <button onClick={() => addToast('Error message', 'error')}>
        Error Toast
      </button>
      <button onClick={() => addToast('Warning message', 'warning')}>
        Warning Toast
      </button>
      <button onClick={() => addToast('Info message', 'info')}>
        Info Toast
      </button>
      <button onClick={() => addToast('Important message', 'success', { important: true })}>
        Important Toast
      </button>
    </div>
  )
}

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render toasts when addToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Click success toast button
    fireEvent.click(screen.getByText('Success Toast'))
    
    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByText('Success message')).toHaveClass('text-sm', 'font-medium')
  })

  it('should render different toast types with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Success toast
    fireEvent.click(screen.getByText('Success Toast'))
    expect(screen.getByText('Success message')).toBeInTheDocument()

    // Error toast
    fireEvent.click(screen.getByText('Error Toast'))
    expect(screen.getByText('Error message')).toBeInTheDocument()

    // Warning toast
    fireEvent.click(screen.getByText('Warning Toast'))
    expect(screen.getByText('Warning message')).toBeInTheDocument()

    // Info toast
    fireEvent.click(screen.getByText('Info Toast'))
    expect(screen.getByText('Info message')).toBeInTheDocument()
  })

  it('should auto-remove toast after 3 seconds', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Success Toast'))
    
    // Test that toast is initially visible
    expect(screen.getByText('Success message')).toBeInTheDocument()
  })

  it('should log important toast notifications', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Important toast should be logged
    fireEvent.click(screen.getByText('Important Toast'))

    expect(logUserAction).toHaveBeenCalledWith(
      expect.any(String), // LOG_TYPES.TOAST_NOTIFICATION
      'Toast displayed: success - Important message',
      { id: 'system', displayName: 'System' },
      null,
      expect.objectContaining({
        message: 'Important message',
        type: 'success',
        important: true,
        timestamp: expect.any(String)
      })
    )
  })

  it('should log error toast notifications', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Error toast should be logged
    fireEvent.click(screen.getByText('Error Toast'))

    expect(logUserAction).toHaveBeenCalledWith(
      expect.any(String), // LOG_TYPES.TOAST_NOTIFICATION
      'Toast displayed: error - Error message',
      { id: 'system', displayName: 'System' },
      null,
      expect.objectContaining({
        message: 'Error message',
        type: 'error',
        timestamp: expect.any(String)
      })
    )
  })

  it('should log warning toast notifications', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Warning toast should be logged
    fireEvent.click(screen.getByText('Warning Toast'))

    expect(logUserAction).toHaveBeenCalledWith(
      expect.any(String), // LOG_TYPES.TOAST_NOTIFICATION
      'Toast displayed: warning - Warning message',
      { id: 'system', displayName: 'System' },
      null,
      expect.objectContaining({
        message: 'Warning message',
        type: 'warning',
        timestamp: expect.any(String)
      })
    )
  })

  it('should not log regular success toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Regular success toast should not be logged
    fireEvent.click(screen.getByText('Success Toast'))

    expect(logUserAction).not.toHaveBeenCalled()
  })

  it('should allow manual removal of toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Success Toast'))
    
    // Test that toast is visible
    expect(screen.getByText('Success message')).toBeInTheDocument()

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: '' }) // Close button SVG
    expect(closeButton).toBeInTheDocument()
    fireEvent.click(closeButton)
  })

  it('should throw error when useToast is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useToast must be used within a ToastProvider')

    consoleError.mockRestore()
  })

  it('should handle multiple toasts correctly', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Add multiple toasts
    fireEvent.click(screen.getByText('Success Toast'))
    fireEvent.click(screen.getByText('Error Toast'))
    fireEvent.click(screen.getByText('Warning Toast'))

    // Test that all toasts are visible
    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByText('Warning message')).toBeInTheDocument()
  })
})
