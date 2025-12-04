import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts raw avatar URLs for consistent display
 * @param rawAvatarUrl - The original avatar URL from database/session
 * @returns Direct S3 URL for fast loading (profile-images folder is public)
 */
export function getProxiedAvatarUrl(rawAvatarUrl?: string | null): string {
  if (!rawAvatarUrl) {
    return "/placeholder.svg"
  }
  
  // Return direct S3 URLs - profile-images folder is public (5-10x faster!)
  return rawAvatarUrl
}
