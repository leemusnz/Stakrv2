import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts raw avatar URLs (especially S3 URLs) to proxied URLs for consistent display
 * @param rawAvatarUrl - The original avatar URL from database/session
 * @returns Direct URL - S3 bucket is public for avatars for better performance
 */
export function getProxiedAvatarUrl(rawAvatarUrl?: string | null): string {
  if (!rawAvatarUrl) {
    return "/placeholder.svg"
  }
  
  // Return direct S3 URL - bucket is now public for avatars (faster loading)
  return rawAvatarUrl
}
