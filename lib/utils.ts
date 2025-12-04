import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts raw avatar URLs for consistent display
 * @param rawAvatarUrl - The original avatar URL from database/session
 * @returns Proxied URL for S3 images
 */
export function getProxiedAvatarUrl(rawAvatarUrl?: string | null): string {
  if (!rawAvatarUrl) {
    return "/placeholder.svg"
  }
  
  // Use proxy for S3 URLs (bucket access needs configuration)
  if (rawAvatarUrl.includes('stakr-verification-files.s3')) {
    const stableTimestamp = rawAvatarUrl.split('/').pop()?.split('-')[0] || 'default'
    return `/api/image-proxy?url=${encodeURIComponent(rawAvatarUrl)}&v=${stableTimestamp}`
  }
  
  return rawAvatarUrl
}
