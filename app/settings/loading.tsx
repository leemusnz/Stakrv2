import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-28" />
          ))}
        </div>

        {/* Settings Form */}
        <div className="space-y-8">
          {/* Account Settings */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-40" />

            {/* Form Fields */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            <Skeleton className="h-10 w-32" />
          </div>

          {/* Notification Settings */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-40" />

            {/* Toggle Options */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-40" />

            {/* Privacy Options */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>

            <Skeleton className="h-10 w-32" />
          </div>

          {/* Danger Zone */}
          <div className="space-y-4 p-4 border border-destructive/20 rounded-lg">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-40 bg-destructive/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
