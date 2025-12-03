/**
 * Retry utility with exponential backoff for handling transient failures
 */

export interface RetryOptions {
  maxAttempts?: number
  backoff?: 'constant' | 'exponential' | 'fibonacci'
  initialDelay?: number
  maxDelay?: number
  retryOn?: number[] // HTTP status codes to retry
  onRetry?: (error: Error, attempt: number) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  backoff: 'exponential',
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryOn: [408, 429, 500, 502, 503, 504], // Timeout, rate limit, server errors
  onRetry: () => {}
}

export class RetryError extends Error {
  constructor(
    message: string, 
    public readonly lastError: Error, 
    public readonly attempts: number
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

/**
 * Calculates delay based on backoff strategy
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  let delay: number
  
  switch (options.backoff) {
    case 'constant':
      delay = options.initialDelay
      break
    case 'exponential':
      delay = options.initialDelay * Math.pow(2, attempt - 1)
      break
    case 'fibonacci':
      delay = options.initialDelay * fibonacci(attempt)
      break
  }
  
  // Cap at max delay
  return Math.min(delay, options.maxDelay)
}

/**
 * Fibonacci sequence helper
 */
function fibonacci(n: number): number {
  if (n <= 1) return 1
  let a = 1, b = 1
  for (let i = 2; i < n; i++) {
    [a, b] = [b, a + b]
  }
  return b
}

/**
 * Retries an async function with configurable backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Check if error is retryable
      if (error instanceof Error) {
        // For fetch errors, check status code
        if ('status' in error) {
          const status = (error as any).status
          if (!opts.retryOn.includes(status)) {
            console.log(`❌ Non-retryable status ${status}, throwing immediately`)
            throw error // Don't retry non-retryable status codes
          }
        }
      }
      
      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        console.log(`❌ Max attempts (${opts.maxAttempts}) reached, giving up`)
        break
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts)
      console.log(`⏱️  Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms delay...`)
      
      // Call retry callback
      opts.onRetry(error as Error, attempt)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new RetryError(
    `Failed after ${opts.maxAttempts} attempts`,
    lastError!,
    opts.maxAttempts
  )
}

/**
 * Helper for fetch requests with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retry(async () => {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`)
      error.status = response.status
      error.response = response
      throw error
    }
    
    return response
  }, retryOptions)
}

/**
 * Example usage:
 * 
 * // Basic retry
 * const result = await retry(async () => {
 *   return await someAsyncOperation()
 * })
 * 
 * // Fetch with retry
 * const response = await fetchWithRetry('https://api.example.com/data', {
 *   headers: { 'Authorization': 'Bearer token' }
 * }, {
 *   maxAttempts: 5,
 *   backoff: 'exponential',
 *   onRetry: (error, attempt) => {
 *     console.log(`Retry ${attempt}: ${error.message}`)
 *   }
 * })
 */


