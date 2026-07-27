import { useSyncExternalStore } from 'react'
import { getAllCategories, getCustomCategories, subscribeCategories } from '@/data/categories'

export function useCategories() {
  return useSyncExternalStore(subscribeCategories, getAllCategories, getAllCategories)
}

export function useCustomCategories() {
  return useSyncExternalStore(subscribeCategories, getCustomCategories, getCustomCategories)
}

export default useCategories
