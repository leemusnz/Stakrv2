'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MyChallengesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('My challenges error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/20 px-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Challenges Load Failed</CardTitle>
          </div>
          <CardDescription>Unable to load your challenges</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We had trouble loading your challenge list. Please try again to view your progress.
          </p>
          {error.message && (
            <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
              <p className="text-xs text-destructive font-mono">{error.message}</p>
            </div>
          )}
          <Button
            onClick={() => reset()}
            className="w-full gap-2"
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
