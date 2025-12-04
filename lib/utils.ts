import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts raw avatar URLs (especially S3 URLs) to proxied URLs for consistent display
 * @param rawAvatarUrl - The original avatar URL from database/session
 * @returns Direct URL if S3 is public, proxied URL as fallback
 */
export function getProxiedAvatarUrl(rawAvatarUrl?: string | null): string {
  if (!rawAvatarUrl) {
    return "/placeholder.svg"
  }
  
  // For S3 URLs, use proxy until bucket is made public
  // TODO: Remove proxy once S3 bucket policy is updated
  if (rawAvatarUrl.includes('stakr-verification-files.s3')) {
    const stableTimestamp = rawAvatarUrl.split('/').pop()?.split('-')[0] || 'default'
    return `/api/image-proxy?url=${encodeURIComponent(rawAvatarUrl)}&v=${stableTimestamp}`
  }
  
  return rawAvatarUrl
}
