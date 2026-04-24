import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'pos_products'
const STORAGE_VERSION = 2

function migrate(data) {
  if (!data) return { version: STORAGE_VERSION, products: [] }
  // Handle legacy flat array format
  if (Array.isArray(data)) {
    const products = data.map(p => ({
      ...p,
      id: p.id || uuidv4(),
      discount: p.discount || { enabled: false, type: 'percentage', value: 0 },
    }))
    return { version: STORAGE_VERSION, products }
  }
  if (data.version === STORAGE_VERSION) return data
  // v1 -> v2: add discount field
  const products = (data.products || []).map(p => ({
    ...p,
    id: p.id || uuidv4(),
    discount: p.discount || { enabled: false, type: 'percentage', value: 0 },
  }))
  return { version: STORAGE_VERSION, products }
}

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return migrate(data).products || []
  } catch {
    return []
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, products }))
}

export function useProducts() {
  const [products, setProducts] = useState(loadProducts)

  const addProduct = (product) => {
    const newProduct = { id: uuidv4(), ...product }
    const updated = [...products, newProduct]
    saveProducts(updated)
    setProducts(updated)
    return newProduct
  }

  const updateProduct = (id, updates) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p)
    saveProducts(updated)
    setProducts(updated)
  }

  const deleteProduct = (id) => {
    const updated = products.filter(p => p.id !== id)
    saveProducts(updated)
    setProducts(updated)
  }

  return { products, addProduct, updateProduct, deleteProduct }
}
