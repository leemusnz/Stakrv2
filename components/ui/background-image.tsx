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
      quality={75}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
      className={className}
      style={{ objectFit: 'cover' }}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzIi8+PC9zdmc+"
      // @ts-ignore - fetchPriority is valid but not in Next.js types yet
      fetchPriority={priority ? "high" : "auto"}
    />
  )
}
