'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to debounce a value
 *
 * Delays updating the returned value until after the specified delay.
 * Useful for search inputs to reduce API calls.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [search, setSearch] = useState('')
 *   const debouncedSearch = useDebounce(search, 300)
 *
 *   useEffect(() => {
 *     // Only called after 300ms of no typing
 *     fetchResults(debouncedSearch)
 *   }, [debouncedSearch])
 *
 *   return <input value={search} onChange={(e) => setSearch(e.target.value)} />
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup timeout if value changes before delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
