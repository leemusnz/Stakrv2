import { Card, CardContent } from "@/components/ui/card"

export default function ResetPasswordLoading() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <h2 className="text-xl font-semibold">Loading Reset Password</h2>
          <p className="text-muted-foreground text-center">Please wait while we prepare the password reset page...</p>
        </CardContent>
      </Card>
    </div>
  )
}
