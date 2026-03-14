import { Skeleton } from "@/components/ui/skeleton"

export default function ChallengeLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-96" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-6 w-48" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Description & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Tabs */}
            <div className="space-y-4">
              <div className="flex gap-4 border-b">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Stake Section */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Challenge Info */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Host Info */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
