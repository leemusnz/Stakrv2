"use client"

import { useState, useCallback } from 'react'
import { apiCall, handleError, showSuccess, type ApiResponse } from '@/lib/error-handling'
import { toast } from 'sonner'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  showSuccessToast?: boolean | string // true = default message, string = custom message
  showErrorToast?: boolean // default true
  silent?: boolean // if true, no toasts at all
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

/**
 * Custom hook for API calls with automatic loading states and toast notifications
 * 
 * @example
 * const { data, loading, error, execute } = useApi<User>('/api/user/profile')
 * 
 * // In component
 * useEffect(() => {
 *   execute()
 * }, [])
 * 
 * // With options
 * const { execute: saveProfile } = useApi('/api/user/profile', {
 *   onSuccess: (data) => console.log('Saved!', data),
 *   showSuccessToast: 'Profile saved successfully!'
 * })
 */
export function useApi<T = any>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      // Support both GET and POST requests
      const requestOptions: RequestInit = args.length > 0 
        ? { method: 'POST', body: JSON.stringify(args[0]) }
        : { method: 'GET' }

      const response = await apiCall<T>(url, requestOptions)

      if (response.success && response.data) {
        setData(response.data)
        
        // Show success toast if enabled
        if (!options.silent) {
          if (options.showSuccessToast === true) {
            showSuccess('Operation completed successfully!')
          } else if (typeof options.showSuccessToast === 'string') {
            showSuccess(options.showSuccessToast)
          }
        }

        // Call success callback
        options.onSuccess?.(response.data)
        return response.data
      } else {
        const errorMessage = response.message || 'An error occurred'
        setError(errorMessage)

        // Show error toast if enabled (default: true)
        if (!options.silent && options.showErrorToast !== false) {
          toast.error(errorMessage)
        }

        // Call error callback
        options.onError?.(errorMessage)
        return null
      }
    } catch (err) {
      const stakrError = handleError(err, 'API Call')
      setError(stakrError.message)

      // Show error toast if enabled (default: true)
      if (!options.silent && options.showErrorToast !== false) {
        toast.error(stakrError.message)
      }

      // Call error callback
      options.onError?.(stakrError.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [url, options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}

/**
 * Hook for mutations (POST/PUT/DELETE) with optimistic updates
 */
export function useMutation<T = any, P = any>(
  url: string,
  options: UseApiOptions<T> & {
    optimisticUpdate?: (variables: P) => void
    onOptimisticError?: () => void
  } = {}
): Omit<UseApiReturn<T>, 'data'> & { mutate: (variables: P) => Promise<T | null> } {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (variables: P): Promise<T | null> => {
    setLoading(true)
    setError(null)

    // Optimistic update
    if (options.optimisticUpdate) {
      try {
        options.optimisticUpdate(variables)
      } catch (err) {
        options.onOptimisticError?.()
      }
    }

    try {
      const response = await apiCall<T>(url, {
        method: 'POST',
        body: JSON.stringify(variables),
      })

      if (response.success && response.data) {
        // Show success toast if enabled
        if (!options.silent) {
          if (options.showSuccessToast === true) {
            showSuccess('Operation completed successfully!')
          } else if (typeof options.showSuccessToast === 'string') {
            showSuccess(options.showSuccessToast)
          }
        }

        options.onSuccess?.(response.data)
        return response.data
      } else {
        const errorMessage = response.message || 'An error occurred'
        setError(errorMessage)

        // Revert optimistic update on error
        if (options.optimisticUpdate && options.onOptimisticError) {
          options.onOptimisticError()
        }

        // Show error toast if enabled
        if (!options.silent && options.showErrorToast !== false) {
          toast.error(errorMessage)
        }

        options.onError?.(errorMessage)
        return null
      }
    } catch (err) {
      const stakrError = handleError(err, 'Mutation')
      setError(stakrError.message)

      // Revert optimistic update on error
      if (options.optimisticUpdate && options.onOptimisticError) {
        options.onOptimisticError()
      }

      // Show error toast if enabled
      if (!options.silent && options.showErrorToast !== false) {
        toast.error(stakrError.message)
      }

      options.onError?.(stakrError.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [url, options])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return {
    loading,
    error,
    mutate,
    reset,
  }
}

