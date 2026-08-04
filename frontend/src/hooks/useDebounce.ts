import { useEffect, useState } from "react"

/**
 * Returns a debounced version of the provided value that only updates
 * after `delayMs` milliseconds of no changes to the value.
 *
 * Default delay is 300ms.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debouncedValue
}
