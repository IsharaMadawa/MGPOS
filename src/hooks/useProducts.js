// import { useState } from 'react'
// import { v4 as uuidv4 } from 'uuid'

// const STORAGE_KEY = 'pos_products'
// const STORAGE_VERSION = 2

// function migrate(data) {
//   if (!data) return { version: STORAGE_VERSION, products: [] }
//   // Handle legacy flat array format
//   if (Array.isArray(data)) {
//     const products = data.map(p => ({
//       ...p,
//       id: p.id || uuidv4(),
//       discount: p.discount || { enabled: false, type: 'percentage', value: 0 },
//     }))
//     return { version: STORAGE_VERSION, products }
//   }
//   if (data.version === STORAGE_VERSION) return data
//   // v1 -> v2: add discount field
//   const products = (data.products || []).map(p => ({
//     ...p,
//     id: p.id || uuidv4(),
//     discount: p.discount || { enabled: false, type: 'percentage', value: 0 },
//   }))
//   return { version: STORAGE_VERSION, products }
// }

// function loadProducts() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY)
//     if (!raw) return []
//     const data = JSON.parse(raw)
//     return migrate(data).products || []
//   } catch {
//     return []
//   }
// }

// function saveProducts(products) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, products }))
// }

// export function useProducts() {
//   const [products, setProducts] = useState(loadProducts)

//   const addProduct = (product) => {
//     const newProduct = { id: uuidv4(), ...product }
//     const updated = [...products, newProduct]
//     saveProducts(updated)
//     setProducts(updated)
//     return newProduct
//   }

//   const updateProduct = (id, updates) => {
//     const updated = products.map(p => p.id === id ? { ...p, ...updates } : p)
//     saveProducts(updated)
//     setProducts(updated)
//   }

//   const deleteProduct = (id) => {
//     const updated = products.filter(p => p.id !== id)
//     saveProducts(updated)
//     setProducts(updated)
//   }

//   return { products, addProduct, updateProduct, deleteProduct }
// }


import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase' // Ensure this path matches your firebase.js file

const PRODUCTS_COLLECTION = 'products'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Sync products from Firestore in real-time
  useEffect(() => {
    const productsRef = collection(db, PRODUCTS_COLLECTION)
    
    // Subscribe to the collection
    const unsubscribe = onSnapshot(productsRef, (querySnapshot) => {
      const productsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setProducts(productsArray)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching products:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const addProduct = async (productData) => {
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION)
      // Firestore creates a unique ID automatically; no need for uuidv4()
      const docRef = await addDoc(productsRef, {
        ...productData,
        discount: productData.discount || { enabled: false, type: 'percentage', value: 0 },
        createdAt: new Date().toISOString()
      })
      return { id: docRef.id, ...productData }
    } catch (error) {
      console.error("Error adding product:", error)
    }
  }

  const updateProduct = async (id, updates) => {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id)
      await updateDoc(productRef, updates)
    } catch (error) {
      console.error("Error updating product:", error)
    }
  }

  const deleteProduct = async (id) => {
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, id)
      await deleteDoc(productRef)
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  return { products, addProduct, updateProduct, deleteProduct, loading }
}