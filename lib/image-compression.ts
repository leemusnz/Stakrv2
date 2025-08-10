import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebWorker?: boolean
  fileType?: string
}

export interface CompressionPreset {
  thumbnail: CompressionOptions
  profile: CompressionOptions
  proof: CompressionOptions
  general: CompressionOptions
}

// Smart compression presets optimized for different use cases
export const COMPRESSION_PRESETS: CompressionPreset = {
  // Challenge thumbnails - small, fast loading
  thumbnail: {
    maxSizeMB: 0.5, // 500KB max
    maxWidthOrHeight: 800, // Good for thumbnails
    useWebWorker: true,
    fileType: 'image/webp'
  },
  
  // Profile pictures - balance of quality and size
  profile: {
    maxSizeMB: 1, // 1MB max
    maxWidthOrHeight: 1000, // Good for profile display
    useWebWorker: true,
    fileType: 'image/webp'
  },
  
  // Proof submissions - higher quality for verification
  proof: {
    maxSizeMB: 3, // 3MB max (readable details)
    maxWidthOrHeight: 2000, // High resolution for verification
    useWebWorker: true,
    fileType: 'image/webp'
  },
  
  // General uploads
  general: {
    maxSizeMB: 2, // 2MB max
    maxWidthOrHeight: 1500, // Good balance
    useWebWorker: true,
    fileType: 'image/webp'
  }
}

export type CompressionPresetKey = keyof CompressionPreset

/**
 * Compress an image file automatically with smart presets
 * @param file - The image file to compress
 * @param preset - Compression preset to use
 * @param customOptions - Optional custom compression options
 * @returns Promise<File> - Compressed file
 */
export async function compressImage(
  file: File, 
  preset: CompressionPresetKey = 'general',
  customOptions?: Partial<CompressionOptions>
): Promise<File> {
  try {
    // Get preset options
    const presetOptions = COMPRESSION_PRESETS[preset]
    
    // Merge with custom options if provided
    const options = {
      ...presetOptions,
      ...customOptions
    }

    console.log(`🖼️ Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) with ${preset} preset`)
    
    // Compress the image
    const compressedFile = await imageCompression(file, options)
    
    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2)
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2)
    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
    
    console.log(`✅ Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${compressionRatio}% reduction)`)
    
    return compressedFile
  } catch (error) {
    console.error('❌ Image compression failed:', error)
    throw new Error('Failed to compress image. Please try a different image.')
  }
}

/**
 * Check if a file needs compression based on size and preset
 * @param file - The file to check
 * @param preset - Compression preset to check against
 * @returns boolean - Whether the file needs compression
 */
export function shouldCompressImage(file: File, preset: CompressionPresetKey = 'general'): boolean {
  const presetOptions = COMPRESSION_PRESETS[preset]
  const fileSizeMB = file.size / 1024 / 1024
  
  // Compress if file is larger than preset limit
  return fileSizeMB > presetOptions.maxSizeMB
}

/**
 * Get human-readable file size
 * @param bytes - File size in bytes
 * @returns string - Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate that a file is an image
 * @param file - File to validate
 * @returns boolean - Whether the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Smart image compression with automatic fallback
 * Will attempt compression, but fall back to original if compression fails
 * @param file - The image file to process
 * @param preset - Compression preset to use
 * @returns Promise<File> - Compressed file or original if compression fails
 */
export async function smartCompressImage(
  file: File,
  preset: CompressionPresetKey = 'general'
): Promise<File> {
  // Check if it's an image file
  if (!isImageFile(file)) {
    throw new Error('File must be an image')
  }
  
  // Check if compression is needed
  if (!shouldCompressImage(file, preset)) {
    console.log(`📄 Image ${file.name} (${formatFileSize(file.size)}) is already within size limits`)
    return file
  }
  
  try {
    // Attempt compression
    return await compressImage(file, preset)
  } catch (error) {
    console.warn('⚠️ Compression failed, using original file:', error)
    // Fall back to original file if compression fails
    return file
  }
}
