import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SignInLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-teal-500 flex items-center justify-center">
              <Skeleton className="w-8 h-8 rounded" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">
                <Skeleton className="h-8 w-32 mx-auto" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-48 mx-auto" />
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Sign In Button Skeleton */}
            <Skeleton className="w-full h-12 rounded-lg" />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Skeleton className="w-full h-px" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2">
                  <Skeleton className="h-3 w-8" />
                </span>
              </div>
            </div>

            {/* Email Input Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="w-full h-12 rounded-lg" />
            </div>

            {/* Password Input Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="w-full h-12 rounded-lg" />
            </div>

            {/* Forgot Password Link Skeleton */}
            <div className="text-right">
              <Skeleton className="h-4 w-32 ml-auto" />
            </div>

            {/* Sign In Button Skeleton */}
            <Skeleton className="w-full h-12 rounded-lg" />

            {/* Sign Up Link Skeleton */}
            <div className="text-center space-y-2">
              <Skeleton className="h-4 w-40 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
