// Enhanced File Validation System for Stakr
// Comprehensive security, fraud detection, and content validation

import crypto from 'crypto'

export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  metadata: FileMetadata
  securityFlags: SecurityFlag[]
  riskScore: number // 0-100, higher = more risky
}

export interface FileMetadata {
  originalName: string
  sanitizedName: string
  size: number
  mimeType: string
  actualMimeType?: string // From magic number detection
  extension: string
  hash: string
  dimensions?: { width: number; height: number }
  duration?: number // For videos
  created?: Date
  modified?: Date
  hasExif: boolean
  isCompressed: boolean
  estimatedQuality: number // 0-100
}

export interface SecurityFlag {
  type: 'malware' | 'fraud' | 'stock' | 'ai_generated' | 'suspicious_metadata' | 'duplicate'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  evidence?: string[]
}

// File type definitions with magic number signatures
const FILE_SIGNATURES: { [key: string]: { signature: number[], offset: number, mimeType: string } } = {
  // Images
  'JPEG': { signature: [0xFF, 0xD8, 0xFF], offset: 0, mimeType: 'image/jpeg' },
  'PNG': { signature: [0x89, 0x50, 0x4E, 0x47], offset: 0, mimeType: 'image/png' },
  'WEBP': { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, mimeType: 'image/webp' },
  'GIF': { signature: [0x47, 0x49, 0x46, 0x38], offset: 0, mimeType: 'image/gif' },
  
  // Videos
  'MP4': { signature: [0x66, 0x74, 0x79, 0x70], offset: 4, mimeType: 'video/mp4' },
  'MOV': { signature: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4, mimeType: 'video/quicktime' },
  'WEBM': { signature: [0x1A, 0x45, 0xDF, 0xA3], offset: 0, mimeType: 'video/webm' },
  
  // Dangerous formats to reject
  'EXE': { signature: [0x4D, 0x5A], offset: 0, mimeType: 'application/x-msdownload' },
  'ZIP': { signature: [0x50, 0x4B, 0x03, 0x04], offset: 0, mimeType: 'application/zip' },
}

// Enhanced validation configuration
export const ENHANCED_VALIDATION_CONFIG = {
  // File limits
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB (increased for video)
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB for images
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB for videos
  
  // Image constraints
  MAX_IMAGE_DIMENSIONS: { width: 4096, height: 4096 },
  MIN_IMAGE_DIMENSIONS: { width: 100, height: 100 },
  MAX_VIDEO_DURATION: 60, // seconds
  
  // Quality thresholds
  MIN_IMAGE_QUALITY: 40, // JPEG quality
  MAX_COMPRESSION_RATIO: 0.95, // Detect over-compression
  
  // Security settings
  ALLOWED_MIME_TYPES: [
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm'
  ],
  BLOCKED_EXTENSIONS: ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.zip', '.rar'],
  
  // Fraud detection patterns
  SUSPICIOUS_FILENAME_PATTERNS: [
    /^(stock|shutterstock|getty|adobe|istockphoto|unsplash|pexels)/i,
    /fake|test|sample|demo|generated/i,
    /(ai_?generated|dall-?e|midjourney|stable_?diffusion)/i,
    /screenshot|screen_?shot|capture/i,
    /download|temp|tmp/i
  ],
  
  // Content analysis
  ENABLE_EXIF_ANALYSIS: true,
  ENABLE_DUPLICATE_DETECTION: true,
  ENABLE_AI_DETECTION: true, // Future: ML model for AI-generated content
}

/**
 * Comprehensive file validation with security and fraud detection
 */
export async function validateFileEnhanced(file: File): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    metadata: await extractFileMetadata(file),
    securityFlags: [],
    riskScore: 0
  }

  // Basic validation
  await validateBasicConstraints(file, result)
  
  // Security validation
  await validateSecurity(file, result)
  
  // Content validation
  await validateContent(file, result)
  
  // Fraud detection
  await detectFraud(file, result)
  
  // Calculate final risk score
  result.riskScore = calculateRiskScore(result)
  
  // Set final validity
  result.valid = result.errors.length === 0 && result.riskScore < 70

  return result
}

/**
 * Extract comprehensive file metadata
 */
async function extractFileMetadata(file: File): Promise<FileMetadata> {
  const hash = await calculateFileHash(file)
  const detectedMimeType = await detectMimeType(file)
  
  return {
    originalName: file.name,
    sanitizedName: sanitizeFileName(file.name),
    size: file.size,
    mimeType: file.type,
    actualMimeType: detectedMimeType || undefined,
    extension: getFileExtension(file.name),
    hash,
    modified: new Date(file.lastModified),
    hasExif: false, // Will be determined by content analysis
    isCompressed: false, // Will be determined by analysis
    estimatedQuality: 100 // Default, will be updated
  }
}

/**
 * Validate basic file constraints
 */
async function validateBasicConstraints(file: File, result: FileValidationResult): Promise<void> {
  const config = ENHANCED_VALIDATION_CONFIG
  
  // File size validation
  if (file.size > config.MAX_FILE_SIZE) {
    result.errors.push(`File size ${formatBytes(file.size)} exceeds maximum ${formatBytes(config.MAX_FILE_SIZE)}`)
  }
  
  if (file.size === 0) {
    result.errors.push('File is empty')
  }
  
  // Type-specific size limits
  if (file.type.startsWith('image/') && file.size > config.MAX_IMAGE_SIZE) {
    result.errors.push(`Image size ${formatBytes(file.size)} exceeds maximum ${formatBytes(config.MAX_IMAGE_SIZE)}`)
  }
  
  if (file.type.startsWith('video/') && file.size > config.MAX_VIDEO_SIZE) {
    result.errors.push(`Video size ${formatBytes(file.size)} exceeds maximum ${formatBytes(config.MAX_VIDEO_SIZE)}`)
  }
  
  // MIME type validation
  if (!config.ALLOWED_MIME_TYPES.includes(file.type)) {
    result.errors.push(`File type ${file.type} is not allowed`)
  }
  
  // Extension validation
  const extension = getFileExtension(file.name).toLowerCase()
  if (config.BLOCKED_EXTENSIONS.some(blocked => extension === blocked)) {
    result.errors.push(`File extension ${extension} is not allowed`)
  }
}

/**
 * Security validation including magic number verification
 */
async function validateSecurity(file: File, result: FileValidationResult): Promise<void> {
  try {
    // Magic number validation
    const actualMimeType = await detectMimeType(file)
    
    if (actualMimeType && actualMimeType !== file.type) {
      result.securityFlags.push({
        type: 'suspicious_metadata',
        severity: 'high',
        message: `File extension mismatch: claimed ${file.type}, actual ${actualMimeType}`,
        evidence: [`Claimed: ${file.type}`, `Detected: ${actualMimeType}`]
      })
    }
    
    // Check for executable signatures
    const header = await readFileHeader(file, 20)
    if (isExecutableFile(header)) {
      result.securityFlags.push({
        type: 'malware',
        severity: 'critical',
        message: 'File contains executable code signature',
        evidence: ['Executable file signature detected']
      })
      result.errors.push('File appears to be an executable and is not allowed')
    }
    
  } catch (error) {
    result.warnings.push('Could not perform complete security validation')
  }
}

/**
 * Content validation for images and videos
 */
async function validateContent(file: File, result: FileValidationResult): Promise<void> {
  if (file.type.startsWith('image/')) {
    await validateImageContent(file, result)
  } else if (file.type.startsWith('video/')) {
    await validateVideoContent(file, result)
  }
}

/**
 * Image-specific content validation
 */
async function validateImageContent(file: File, result: FileValidationResult): Promise<void> {
  try {
    const dimensions = await getImageDimensions(file)
    const config = ENHANCED_VALIDATION_CONFIG
    
    if (dimensions) {
      result.metadata.dimensions = dimensions
      
      // Dimension validation
      if (dimensions.width > config.MAX_IMAGE_DIMENSIONS.width || 
          dimensions.height > config.MAX_IMAGE_DIMENSIONS.height) {
        result.errors.push(`Image dimensions ${dimensions.width}x${dimensions.height} exceed maximum ${config.MAX_IMAGE_DIMENSIONS.width}x${config.MAX_IMAGE_DIMENSIONS.height}`)
      }
      
      if (dimensions.width < config.MIN_IMAGE_DIMENSIONS.width || 
          dimensions.height < config.MIN_IMAGE_DIMENSIONS.height) {
        result.errors.push(`Image dimensions ${dimensions.width}x${dimensions.height} below minimum ${config.MIN_IMAGE_DIMENSIONS.width}x${config.MIN_IMAGE_DIMENSIONS.height}`)
      }
      
      // Quality estimation
      const compressionRatio = file.size / (dimensions.width * dimensions.height * 3)
      if (compressionRatio > config.MAX_COMPRESSION_RATIO) {
        result.warnings.push('Image appears heavily compressed, may affect verification quality')
      }
    }
    
  } catch (error) {
    result.warnings.push('Could not analyze image content')
  }
}

/**
 * Video-specific content validation
 */
async function validateVideoContent(file: File, result: FileValidationResult): Promise<void> {
  // Note: Full video analysis requires additional libraries
  // For now, we'll do basic validation
  result.warnings.push('Video content analysis requires additional processing')
}

/**
 * Fraud detection using various heuristics
 */
async function detectFraud(file: File, result: FileValidationResult): Promise<void> {
  const config = ENHANCED_VALIDATION_CONFIG
  
  // Filename pattern analysis
  for (const pattern of config.SUSPICIOUS_FILENAME_PATTERNS) {
    if (pattern.test(file.name)) {
      result.securityFlags.push({
        type: 'fraud',
        severity: 'high',
        message: 'Filename suggests stock or generated content',
        evidence: [`Pattern matched: ${pattern.source}`]
      })
    }
  }
  
  // File size analysis
  if (file.size < 1000) {
    result.warnings.push('File is very small, may not contain sufficient proof')
  }
  
  // Timestamp analysis
  const now = Date.now()
  const fileAge = now - file.lastModified
  const oneHour = 60 * 60 * 1000
  
  if (fileAge > 7 * 24 * oneHour) {
    result.warnings.push('File is older than 7 days, may not represent recent activity')
  }
}

/**
 * Calculate overall risk score
 */
function calculateRiskScore(result: FileValidationResult): number {
  let score = 0
  
  // Security flags contribute to risk
  result.securityFlags.forEach(flag => {
    switch (flag.severity) {
      case 'critical': score += 50; break
      case 'high': score += 25; break
      case 'medium': score += 10; break
      case 'low': score += 5; break
    }
  })
  
  // Errors are high risk
  score += result.errors.length * 20
  
  // Warnings are medium risk
  score += result.warnings.length * 5
  
  return Math.min(100, score)
}

/**
 * Utility Functions
 */

async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function detectMimeType(file: File): Promise<string | null> {
  try {
    const header = await readFileHeader(file, 20)
    
    for (const [type, signature] of Object.entries(FILE_SIGNATURES)) {
      if (matchesSignature(header, signature.signature, signature.offset)) {
        return signature.mimeType
      }
    }
    
    return null
  } catch {
    return null
  }
}

async function readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
  const slice = file.slice(0, bytes)
  const arrayBuffer = await slice.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

function matchesSignature(data: Uint8Array, signature: number[], offset: number): boolean {
  if (data.length < offset + signature.length) return false
  
  for (let i = 0; i < signature.length; i++) {
    if (data[offset + i] !== signature[i]) return false
  }
  
  return true
}

function isExecutableFile(header: Uint8Array): boolean {
  const executableSignatures = [
    [0x4D, 0x5A], // Windows PE
    [0x7F, 0x45, 0x4C, 0x46], // Linux ELF
    [0xFE, 0xED, 0xFA, 0xCE], // macOS Mach-O
  ]
  
  return executableSignatures.some(sig => matchesSignature(header, sig, 0))
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot > 0 ? fileName.slice(lastDot) : ''
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
