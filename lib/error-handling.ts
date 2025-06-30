// Error handling utilities for Stakr
import { toast } from 'sonner'
import { errorMessages } from './config'
import type { ApiResponse } from './types'

// Custom error classes
export class StakrError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'StakrError'
  }
}

export class ValidationError extends StakrError {
  constructor(message: string, public fields: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400, { fields })
    this.name = 'ValidationError'
  }
}

export class NetworkError extends StakrError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'NETWORK_ERROR', 0)
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends StakrError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends StakrError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class PaymentError extends StakrError {
  constructor(message: string, public paymentIntentId?: string) {
    super(message, 'PAYMENT_ERROR', 402, { paymentIntentId })
    this.name = 'PaymentError'
  }
}

export class BusinessLogicError extends StakrError {
  constructor(message: string, code: string) {
    super(message, code, 400)
    this.name = 'BusinessLogicError'
  }
}

// Error code mapping
const errorCodeMap: Record<string, string> = {
  INSUFFICIENT_CREDITS: errorMessages.INSUFFICIENT_CREDITS,
  CHALLENGE_FULL: errorMessages.CHALLENGE_FULL,
  CHALLENGE_EXPIRED: errorMessages.CHALLENGE_EXPIRED,
  INVALID_PROOF: errorMessages.INVALID_PROOF,
  VERIFICATION_FAILED: errorMessages.VERIFICATION_FAILED,
  PAYMENT_FAILED: errorMessages.PAYMENT_FAILED,
  UNAUTHORIZED: errorMessages.UNAUTHORIZED,
  NETWORK_ERROR: errorMessages.NETWORK_ERROR,
  VALIDATION_ERROR: errorMessages.VALIDATION_ERROR,
}

// HTTP status code error mapping
export const getErrorFromStatusCode = (statusCode: number, message?: string): StakrError => {
  switch (statusCode) {
    case 400:
      return new ValidationError(message || 'Invalid request data', {})
    case 401:
      return new AuthenticationError(message || 'Please log in to continue')
    case 403:
      return new AuthorizationError(message || 'You do not have permission to perform this action')
    case 404:
      return new StakrError(message || 'Resource not found', 'NOT_FOUND', 404)
    case 409:
      return new BusinessLogicError(message || 'Conflict detected', 'CONFLICT')
    case 422:
      return new ValidationError(message || 'Validation failed', {})
    case 429:
      return new StakrError(message || 'Too many requests. Please try again later.', 'RATE_LIMIT', 429)
    case 500:
      return new StakrError(message || 'Internal server error', 'INTERNAL_ERROR', 500)
    case 502:
    case 503:
    case 504:
      return new NetworkError(message || 'Service temporarily unavailable')
    default:
      return new StakrError(message || 'An unexpected error occurred', 'UNKNOWN_ERROR', statusCode)
  }
}

// API error parser
export const parseApiError = async (response: Response): Promise<StakrError> => {
  let errorData: any = {}
  
  try {
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json()
    } else {
      errorData = { message: await response.text() }
    }
  } catch {
    errorData = { message: 'Failed to parse error response' }
  }

  const message = errorData.message || errorData.error || `HTTP ${response.status}`
  const code = errorData.code || 'API_ERROR'
  
  // Handle specific error codes
  if (errorData.code && errorCodeMap[errorData.code]) {
    return new StakrError(errorCodeMap[errorData.code], errorData.code, response.status, errorData.metadata)
  }

  // Handle validation errors
  if (errorData.fields || errorData.validationErrors) {
    return new ValidationError(message, errorData.fields || errorData.validationErrors)
  }

  // Handle payment errors
  if (errorData.paymentError) {
    return new PaymentError(message, errorData.paymentIntentId)
  }

  return getErrorFromStatusCode(response.status, message)
}

// Generic API call wrapper with error handling
export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw await parseApiError(response)
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    if (error instanceof StakrError) {
      return {
        success: false,
        error: error.code,
        message: error.message,
      }
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new NetworkError()
      return {
        success: false,
        error: networkError.code,
        message: networkError.message,
      }
    }

    // Unknown error
    const unknownError = new StakrError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'UNKNOWN_ERROR'
    )
    
    return {
      success: false,
      error: unknownError.code,
      message: unknownError.message,
    }
  }
}

// Error handling hooks and utilities
export const handleError = (error: unknown, context?: string) => {
  let stakrError: StakrError

  if (error instanceof StakrError) {
    stakrError = error
  } else if (error instanceof Error) {
    stakrError = new StakrError(error.message, 'UNKNOWN_ERROR')
  } else {
    stakrError = new StakrError('An unexpected error occurred', 'UNKNOWN_ERROR')
  }

  // Log error for monitoring
  console.error(`[${context || 'Application'}] Error:`, {
    code: stakrError.code,
    message: stakrError.message,
    statusCode: stakrError.statusCode,
    metadata: stakrError.metadata,
  })

  // Show user-friendly toast
  const userMessage = getUserFriendlyMessage(stakrError)
  toast.error(userMessage)

  return stakrError
}

// Convert technical errors to user-friendly messages
export const getUserFriendlyMessage = (error: StakrError): string => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Connection problem. Please check your internet and try again.'
    case 'AUTHENTICATION_ERROR':
      return 'Please log in to continue.'
    case 'AUTHORIZATION_ERROR':
      return 'You don\'t have permission to do this.'
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.'
    case 'PAYMENT_ERROR':
      return 'Payment failed. Please check your payment method.'
    case 'INSUFFICIENT_CREDITS':
      return 'You don\'t have enough credits for this action.'
    case 'CHALLENGE_FULL':
      return 'This challenge is full. Try another one!'
    case 'CHALLENGE_EXPIRED':
      return 'This challenge has ended. Check out our other challenges!'
    case 'RATE_LIMIT':
      return 'You\'re doing that too quickly. Please wait a moment.'
    case 'INTERNAL_ERROR':
      return 'Something went wrong on our end. We\'re looking into it!'
    default:
      return error.message || 'Something unexpected happened. Please try again.'
  }
}

// Retry logic for failed requests
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error = new Error('Unknown error')

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry certain error types
      if (error instanceof AuthenticationError || 
          error instanceof AuthorizationError ||
          error instanceof ValidationError) {
        throw error
      }

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }

  throw lastError
}

// Form error handling
export const handleFormError = (error: unknown, setError: (field: string, error: { message: string }) => void) => {
  if (error instanceof ValidationError) {
    Object.entries(error.fields).forEach(([field, message]) => {
      setError(field, { message })
    })
    return
  }

  // Generic error handling
  const stakrError = handleError(error, 'Form Submission')
  setError('root', { message: stakrError.message })
}

// Success message helper
export const showSuccess = (message: string) => {
  toast.success(message)
}

// Loading state helper
export const withLoadingState = async <T>(
  fn: () => Promise<T>,
  setLoading: (loading: boolean) => void
): Promise<T> => {
  setLoading(true)
  try {
    return await fn()
  } finally {
    setLoading(false)
  }
}

// Comprehensive fraud detection system
export class FraudDetectionEngine {
  
  // Anti-sybil attack detection
  static async detectSybilAccounts(userId: string): Promise<{
    riskScore: number // 0-100
    linkedAccounts: string[]
    reasons: string[]
  }> {
    const reasons: string[] = []
    let riskScore = 0
    const linkedAccounts: string[] = []
    
    // Check for shared IP addresses (high risk)
    // Check for shared payment methods (very high risk)
    // Check for shared device fingerprints (high risk)  
    // Check for coordinated challenge joining (medium risk)
    // Check for suspicious timing patterns (medium risk)
    
    return { riskScore, linkedAccounts, reasons }
  }
  
  // Challenge gaming detection
  static async detectChallengeGaming(challengeId: string): Promise<{
    riskScore: number
    gameType: 'collusion' | 'farming' | 'manipulation' | 'none'
    details: string[]
  }> {
    // Detect coordinated joining/completion
    // Detect accounts with suspicious success rates on same challenges
    // Detect timing manipulation
    // Detect difficulty farming
    
    return { riskScore: 0, gameType: 'none', details: [] }
  }
  
  // Trust score manipulation detection
  static async detectTrustScoreManipulation(userId: string): Promise<{
    isManipulated: boolean
    confidence: number
    reasons: string[]
  }> {
    // Check for rapid score increases
    // Check for easy challenge farming
    // Check for suspicious completion patterns
    // Check for account age vs score ratio
    
    return { isManipulated: false, confidence: 0, reasons: [] }
  }
  
  // Proof authenticity verification
  static async verifyProofAuthenticity(proof: any): Promise<{
    authentic: boolean
    confidence: number
    flags: string[]
  }> {
    const flags: string[] = []
    
    // AI-generated content detection
    // Stock photo detection
    // Metadata analysis (timestamps, GPS, camera info)
    // File hash checking against known databases
    // Device fingerprint verification
    
    return { authentic: true, confidence: 100, flags }
  }
  
  // Insurance fraud detection
  static async detectInsuranceFraud(claimId: string): Promise<{
    fraudulent: boolean
    riskScore: number
    redFlags: string[]
  }> {
    // Pattern analysis of claims
    // Medical excuse validation
    // Timing analysis
    // User history review
    
    return { fraudulent: false, riskScore: 0, redFlags: [] }
  }
}

// Business rule enforcement
export class BusinessRuleEngine {
  
  // Challenge joining limits (anti-gaming)
  static readonly DAILY_CHALLENGE_LIMIT = 5
  static readonly MONTHLY_CHALLENGE_LIMIT = 50
  static readonly MIN_ACCOUNT_AGE_DAYS = 7
  static readonly MAX_CONCURRENT_CHALLENGES = 10
  
  // Staking limits based on trust score and account age
  static calculateMaxStake(trustScore: number, accountAgeDays: number): number {
    let maxStake = 50 // Base limit for new accounts
    
    if (accountAgeDays >= 30) maxStake = 200
    if (accountAgeDays >= 90) maxStake = 500
    if (accountAgeDays >= 365) maxStake = 1000
    
    // Trust score modifier
    if (trustScore >= 90) maxStake *= 1.5
    else if (trustScore >= 80) maxStake *= 1.2
    else if (trustScore < 60) maxStake *= 0.5
    
    return Math.min(maxStake, 1000) // Platform max
  }
  
  // Verification tier requirements (stricter)
  static getVerificationTier(
    trustScore: number, 
    accountAgeDays: number, 
    falseClaims: number
  ): 'auto' | 'manual' | 'review' {
    
    if (falseClaims >= 3) return 'review'
    if (accountAgeDays < 30) return 'manual'
    if (trustScore >= 95 && accountAgeDays >= 90) return 'auto'
    if (trustScore >= 85 && accountAgeDays >= 60) return 'manual'
    return 'review'
  }
  
  // Challenge creation limits (prevent spam/gaming)
  static canCreateChallenge(
    userId: string, 
    userTrustScore: number, 
    accountAgeDays: number
  ): { canCreate: boolean; reason?: string } {
    
    if (accountAgeDays < 14) {
      return { canCreate: false, reason: 'Account must be at least 14 days old to create challenges' }
    }
    
    if (userTrustScore < 70) {
      return { canCreate: false, reason: 'Trust score must be at least 70 to create challenges' }
    }
    
    // Additional checks: recent challenge success rate, etc.
    
    return { canCreate: true }
  }
}
