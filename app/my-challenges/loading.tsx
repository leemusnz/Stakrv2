import { Skeleton } from "@/components/ui/skeleton"

export default function MyChallengesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>

        {/* Filter/Search Bar */}
        <Skeleton className="h-10 w-full" />

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-6 w-16" />
                ))}
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
