import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Alert/Status */}
        <Skeleton className="h-16 w-full" />

        {/* Tabs */}
        <div className="flex gap-4 border-b overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-28 flex-shrink-0" />
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Charts/Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-64 w-full" />
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />

          {/* Table Header */}
          <div className="flex gap-4 p-4 border rounded-lg">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-4 w-24 flex-1" />
            ))}
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-4 w-20 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
