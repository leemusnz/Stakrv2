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

/**
 * Checks if a string is a valid UUID
 * @param str - The string to check
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
