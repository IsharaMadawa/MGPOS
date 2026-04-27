// import { useState } from 'react'

// const STORAGE_KEY = 'pos_categories'
// const DEFAULT_CATEGORIES = ['Beverages', 'Food', 'Electronics', 'Clothing', 'Other']

// function loadCategories() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY)
//     if (!raw) return DEFAULT_CATEGORIES
//     return JSON.parse(raw)
//   } catch {
//     return DEFAULT_CATEGORIES
//   }
// }

// export function useCategories() {
//   const [categories, setCategories] = useState(loadCategories)

//   const addCategory = (name) => {
//     const trimmed = name?.trim()
//     if (!trimmed || categories.includes(trimmed)) return false
//     const updated = [...categories, trimmed]
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
//     setCategories(updated)
//     return true
//   }

//   const deleteCategory = (name) => {
//     const updated = categories.filter(c => c !== name)
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
//     setCategories(updated)
//   }

//   return { categories, addCategory, deleteCategory }
// }

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'

const CATEGORIES_COLLECTION = 'categories';

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId } = useOrg()

  // Determine which orgId to use
  const orgId = isSuperAdmin ? selectedOrgId : userProfile?.orgId

  // Sync categories from Firestore in real-time
  useEffect(() => {
    if (!orgId) {
      setCategories([])
      setLoading(false)
      return
    }

    const categoriesRef = collection(db, CATEGORIES_COLLECTION)
    const q = query(categoriesRef, orderBy('name'))
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoriesArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Filter client-side: show categories for current org OR legacy categories (no orgId)
      const filtered = categoriesArray.filter(c => 
        c.orgId === orgId || 
        c.orgId === null || 
        c.orgId === undefined ||
        c.orgId === ''
      )
      setCategories(filtered)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching categories:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [orgId])

  const addCategory = async (name) => {
    if (!name || !orgId) return
    try {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION)
      const docRef = await addDoc(categoriesRef, {
        name,
        orgId,
        createdAt: new Date().toISOString()
      })
      return { id: docRef.id, name, orgId }
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const updateCategory = async (id, newName) => {
    try {
      const categoryRef = doc(db, CATEGORIES_COLLECTION, id)
      await updateDoc(categoryRef, { name: newName })
    } catch (error) {
      console.error("Error updating category:", error)
    }
  }

  const deleteCategory = async (id) => {
    try {
      const categoryRef = doc(db, CATEGORIES_COLLECTION, id)
      await deleteDoc(categoryRef)
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  return { categories, addCategory, updateCategory, deleteCategory, loading }
}