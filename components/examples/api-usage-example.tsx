"use client"

/**
 * Example component demonstrating the new API patterns with loading states and toast notifications
 * 
 * This file shows best practices for:
 * - Using useApi hook for GET requests
 * - Using useMutation hook for POST/PUT/DELETE requests
 * - Loading states with LoadingSpinner
 * - Error handling with toast notifications
 */

import { useApi, useMutation } from "@/hooks/use-api"
import { LoadingSpinner, LoadingOverlay, SkeletonLoader } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"

// Example 1: Simple GET request with loading state
export function UserProfileExample() {
  const { data, loading, error, execute } = useApi<{ name: string; email: string }>(
    '/api/user/profile',
    {
      showSuccessToast: false, // Don't show toast on load
      onSuccess: (data) => {
        console.log('Profile loaded:', data)
      }
    }
  )

  // Auto-load on mount
  useState(() => {
    execute()
  })

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Name: {data?.name}</p>
        <p>Email: {data?.email}</p>
      </CardContent>
    </Card>
  )
}

// Example 2: Mutation with optimistic updates
export function UpdateProfileExample() {
  const [name, setName] = useState("")
  const [optimisticName, setOptimisticName] = useState("")

  const { loading, error, mutate } = useMutation<{ success: boolean }, { name: string }>(
    '/api/user/profile',
    {
      showSuccessToast: 'Profile updated successfully!',
      optimisticUpdate: (variables) => {
        // Optimistically update UI
        setOptimisticName(variables.name)
      },
      onOptimisticError: () => {
        // Revert on error
        setOptimisticName("")
      },
      onSuccess: () => {
        setName("") // Clear form
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await mutate({ name })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !name}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          {optimisticName && (
            <p className="text-sm text-muted-foreground">
              Updating to: {optimisticName}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// Example 3: Loading overlay for card content
export function ChallengeListExample() {
  const { data, loading, error, execute } = useApi<Array<{ id: string; title: string }>>(
    '/api/user/challenges',
    {
      showSuccessToast: false
    }
  )

  useState(() => {
    execute()
  })

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>My Challenges</CardTitle>
      </CardHeader>
      <CardContent>
        <LoadingOverlay isLoading={loading} text="Loading challenges..." />
        
        {error && (
          <div className="text-destructive">Error: {error}</div>
        )}
        
        {data && data.length === 0 && (
          <p className="text-muted-foreground">No challenges yet</p>
        )}
        
        {data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((challenge) => (
              <li key={challenge.id}>{challenge.title}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// Example 4: Skeleton loaders for better UX
export function SkeletonExample() {
  const { data, loading } = useApi<Array<{ id: string; title: string }>>(
    '/api/user/challenges'
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <SkeletonLoader className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <SkeletonLoader className="h-4 w-full mb-2" />
              <SkeletonLoader className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div>
      {data?.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

