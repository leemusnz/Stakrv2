import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts raw avatar URLs for consistent display
 * @param rawAvatarUrl - The original avatar URL from database/session
 * @returns Direct URL - S3 bucket is now public for fast loading
 */
export function getProxiedAvatarUrl(rawAvatarUrl?: string | null): string {
  if (!rawAvatarUrl) {
    return "/placeholder.svg"
  }
  
  // Return direct S3 URLs - bucket is public for avatars (5-10x faster!)
  return rawAvatarUrl
}
