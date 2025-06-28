export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Header Skeleton */}
        <div className="text-center space-y-4">
          <div className="h-12 bg-muted rounded w-96 mx-auto animate-pulse" />
          <div className="h-6 bg-muted rounded w-128 mx-auto animate-pulse" />
          <div className="h-12 bg-muted rounded w-96 mx-auto animate-pulse" />
        </div>

        {/* Trending Skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="h-64 bg-muted rounded animate-pulse" />

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
