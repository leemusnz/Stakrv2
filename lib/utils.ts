import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts raw avatar URLs (especially S3 URLs) to proxied URLs for consistent display
 * @param rawAvatarUrl - The original avatar URL from database/session
 * @returns Proxied URL for S3 images, or original URL for other sources  
 */
export function getProxiedAvatarUrl(rawAvatarUrl?: string | null): string {
  if (!rawAvatarUrl) {
    return "/placeholder.svg"
  }
  
  // If it's an S3 URL, proxy it through our image-proxy API
  if (rawAvatarUrl.includes('stakr-verification-files.s3')) {
    // Extract stable timestamp from filename to prevent constant re-fetching
    const stableTimestamp = rawAvatarUrl.split('/').pop()?.split('-')[0] || 'default'
    return `/api/image-proxy?url=${encodeURIComponent(rawAvatarUrl)}&v=${stableTimestamp}`
  }
  
  // For other URLs (generated avatars, placeholders, etc), return as-is
  return rawAvatarUrl
}
