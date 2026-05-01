import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext'
import { useOrg } from '../contexts/OrgContext'
import { logCrudOperation } from '../utils/logger'

const CATEGORIES_COLLECTION = 'categories';

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const { userProfile, isSuperAdmin } = useAuth()
  const { selectedOrgId } = useOrg()

  // Determine which orgId to use - always use selectedOrgId when available
  const orgId = selectedOrgId || userProfile?.orgId

  // Sync categories from Firestore in real-time
  useEffect(() => {
    if (!orgId) {
      setCategories([])
      setLoading(false)
      return
    }

    const categoriesRef = collection(db, CATEGORIES_COLLECTION)
    // Query with orgId filter for better performance
    const q = query(categoriesRef, where('orgId', '==', orgId), orderBy('name'))
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoriesArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCategories(categoriesArray)
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
      
      const categoryData = { id: docRef.id, name, orgId }
      
      // Log the category creation
      await logCrudOperation('create', 'category', categoryData, userProfile, orgId)
      
      return categoryData
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const updateCategory = async (id, newName) => {
    try {
      const categoryRef = doc(db, CATEGORIES_COLLECTION, id)
      await updateDoc(categoryRef, { name: newName })
      
      // Log the category update
      await logCrudOperation('update', 'category', { id, name: newName }, userProfile, orgId)
    } catch (error) {
      console.error("Error updating category:", error)
    }
  }

  const deleteCategory = async (id) => {
    try {
      // Get category data before deletion for logging
      const categoryToDelete = categories.find(c => c.id === id)
      
      const categoryRef = doc(db, CATEGORIES_COLLECTION, id)
      await deleteDoc(categoryRef)
      
      // Log the category deletion
      if (categoryToDelete) {
        await logCrudOperation('delete', 'category', categoryToDelete, userProfile, orgId)
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  return { categories, addCategory, updateCategory, deleteCategory, loading }
}