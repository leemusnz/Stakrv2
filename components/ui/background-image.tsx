import Image from 'next/image'

interface BackgroundImageProps {
  src: string
  alt?: string
  priority?: boolean
  className?: string
}

/**
 * Optimized background image component using Next.js Image
 * 
 * Features:
 * - Automatic WebP conversion
 * - Responsive image loading
 * - Better performance vs raw <img> tags
 * - Lazy loading by default (can be overridden with priority)
 */
export function BackgroundImage({ 
  src, 
  alt = "Background", 
  priority = false,
  className = "w-full h-full object-cover grayscale-[40%] dark:grayscale-[60%]"
}: BackgroundImageProps) {
  return (
    <Image 
      src={src}
      alt={alt}
      fill
      priority={priority}
      quality={80}
      sizes="100vw"
      className={className}
      style={{ objectFit: 'cover' }}
    />
  )
}
