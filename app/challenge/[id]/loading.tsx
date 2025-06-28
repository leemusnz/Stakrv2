export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          <div className="h-8 bg-muted rounded w-96 animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-muted rounded animate-pulse" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-muted rounded animate-pulse" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
