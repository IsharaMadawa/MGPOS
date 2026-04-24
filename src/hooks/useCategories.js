import { useState } from 'react'

const STORAGE_KEY = 'pos_categories'
const DEFAULT_CATEGORIES = ['Beverages', 'Food', 'Electronics', 'Clothing', 'Other']

function loadCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CATEGORIES
    return JSON.parse(raw)
  } catch {
    return DEFAULT_CATEGORIES
  }
}

export function useCategories() {
  const [categories, setCategories] = useState(loadCategories)

  const addCategory = (name) => {
    const trimmed = name?.trim()
    if (!trimmed || categories.includes(trimmed)) return false
    const updated = [...categories, trimmed]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setCategories(updated)
    return true
  }

  const deleteCategory = (name) => {
    const updated = categories.filter(c => c !== name)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setCategories(updated)
  }

  return { categories, addCategory, deleteCategory }
}
