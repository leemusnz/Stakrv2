import { useState, useCallback } from 'react'
import { compressImage, smartCompressImage, CompressionPresetKey, formatFileSize } from '@/lib/image-compression'

export interface CompressionState {
  isCompressing: boolean
  compressionProgress: number
  originalSize?: string
  compressedSize?: string
  compressionRatio?: string
  error?: string
}

export function useImageCompression() {
  const [compressionState, setCompressionState] = useState<CompressionState>({
    isCompressing: false,
    compressionProgress: 0
  })

  const resetState = useCallback(() => {
    setCompressionState({
      isCompressing: false,
      compressionProgress: 0
    })
  }, [])

  const compressImageFile = useCallback(async (
    file: File,
    preset: CompressionPresetKey = 'general',
    onProgress?: (progress: number) => void
  ): Promise<File> => {
    try {
      setCompressionState(prev => ({
        ...prev,
        isCompressing: true,
        compressionProgress: 0,
        error: undefined,
        originalSize: formatFileSize(file.size)
      }))

      // Simulate progress for UX (compression library doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setCompressionState(prev => {
          const newProgress = Math.min(prev.compressionProgress + 10, 90)
          onProgress?.(newProgress)
          return { ...prev, compressionProgress: newProgress }
        })
      }, 100)

      const compressedFile = await smartCompressImage(file, preset)

      // Clear interval and set to 100%
      clearInterval(progressInterval)
      
      const compressionRatio = file.size > 0 
        ? ((1 - compressedFile.size / file.size) * 100).toFixed(1)
        : '0'

      setCompressionState(prev => ({
        ...prev,
        isCompressing: false,
        compressionProgress: 100,
        compressedSize: formatFileSize(compressedFile.size),
        compressionRatio: compressionRatio + '%'
      }))

      onProgress?.(100)
      
      return compressedFile
    } catch (error) {
      setCompressionState(prev => ({
        ...prev,
        isCompressing: false,
        compressionProgress: 0,
        error: error instanceof Error ? error.message : 'Compression failed'
      }))
      throw error
    }
  }, [])

  const compressMultipleImages = useCallback(async (
    files: File[],
    preset: CompressionPresetKey = 'general',
    onProgress?: (current: number, total: number) => void
  ): Promise<File[]> => {
    const compressedFiles: File[] = []
    
    for (let i = 0; i < files.length; i++) {
      try {
        onProgress?.(i, files.length)
        const compressedFile = await compressImageFile(files[i], preset)
        compressedFiles.push(compressedFile)
      } catch (error) {
        console.error(`Failed to compress file ${files[i].name}:`, error)
        // Include original file if compression fails
        compressedFiles.push(files[i])
      }
    }
    
    onProgress?.(files.length, files.length)
    return compressedFiles
  }, [compressImageFile])

  return {
    compressionState,
    compressImageFile,
    compressMultipleImages,
    resetState,
    
    // Convenience getters
    isCompressing: compressionState.isCompressing,
    compressionProgress: compressionState.compressionProgress,
    compressionError: compressionState.error,
    compressionStats: {
      originalSize: compressionState.originalSize,
      compressedSize: compressionState.compressedSize,
      ratio: compressionState.compressionRatio
    }
  }
}


