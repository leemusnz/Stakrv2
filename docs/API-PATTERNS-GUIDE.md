# API Patterns & Error Handling Guide

This guide demonstrates the new patterns for API calls, loading states, and error handling in Stakr.

## Table of Contents
1. [useApi Hook](#useapi-hook)
2. [useMutation Hook](#usemutation-hook)
3. [Loading Components](#loading-components)
4. [Error Boundaries](#error-boundaries)
5. [Toast Notifications](#toast-notifications)
6. [Best Practices](#best-practices)

## useApi Hook

The `useApi` hook provides automatic loading states, error handling, and toast notifications for GET requests.

### Basic Usage

```tsx
import { useApi } from "@/hooks/use-api"
import { LoadingSpinner } from "@/components/loading-spinner"

function MyComponent() {
  const { data, loading, error, execute } = useApi<UserProfile>('/api/user/profile')
  
  useEffect(() => {
    execute()
  }, [])
  
  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error}</div>
  
  return <div>{data?.name}</div>
}
```

### With Options

```tsx
const { data, loading, error, execute } = useApi<UserProfile>(
  '/api/user/profile',
  {
    onSuccess: (data) => {
      console.log('Profile loaded!', data)
    },
    onError: (error) => {
      console.error('Failed to load:', error)
    },
    showSuccessToast: false, // Don't show toast on load
    showErrorToast: true, // Show error toast (default)
    silent: false // If true, no toasts at all
  }
)
```

## useMutation Hook

The `useMutation` hook is for POST/PUT/DELETE requests with optimistic updates.

### Basic Usage

```tsx
import { useMutation } from "@/hooks/use-api"
import { toast } from "sonner"

function UpdateProfile() {
  const [name, setName] = useState("")
  
  const { loading, error, mutate } = useMutation<{ success: boolean }, { name: string }>(
    '/api/user/profile',
    {
      showSuccessToast: 'Profile updated successfully!',
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
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

### With Optimistic Updates

```tsx
const { loading, mutate } = useMutation('/api/challenges/join', {
  optimisticUpdate: (variables) => {
    // Immediately update UI
    setChallenges(prev => [...prev, { id: variables.challengeId }])
  },
  onOptimisticError: () => {
    // Revert on error
    setChallenges(prev => prev.filter(c => c.id !== variables.challengeId))
  },
  showSuccessToast: 'Challenge joined!'
})
```

## Loading Components

### LoadingSpinner

```tsx
import { LoadingSpinner } from "@/components/loading-spinner"

// Small spinner
<LoadingSpinner size="sm" />

// With text
<LoadingSpinner size="md" text="Loading..." />

// Full screen
<LoadingSpinner fullScreen text="Loading your dashboard..." />
```

### LoadingOverlay

```tsx
import { LoadingOverlay } from "@/components/loading-spinner"

<Card className="relative">
  <CardHeader>My Challenges</CardHeader>
  <CardContent>
    <LoadingOverlay isLoading={loading} text="Loading challenges..." />
    {/* Your content here */}
  </CardContent>
</Card>
```

### SkeletonLoader

```tsx
import { SkeletonLoader } from "@/components/loading-spinner"

{loading ? (
  <div className="space-y-4">
    <SkeletonLoader className="h-6 w-48" />
    <SkeletonLoader className="h-4 w-full" />
  </div>
) : (
  <div>{/* Actual content */}</div>
)}
```

### LoadingButton

```tsx
import { LoadingButton } from "@/components/loading-spinner"

<LoadingButton loading={isSaving} onClick={handleSave}>
  Save Changes
</LoadingButton>
```

## Error Boundaries

Error boundaries are automatically integrated into the root layout. They catch React component errors and display a user-friendly error page.

### Custom Error Boundary

```tsx
import { ErrorBoundary } from "@/components/error-boundary"

function CustomErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}

<ErrorBoundary fallback={CustomErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

## Toast Notifications

Toast notifications are automatically shown for API errors and can be manually triggered for success messages.

### Automatic Toasts

The `useApi` and `useMutation` hooks automatically show error toasts. Success toasts are optional:

```tsx
const { execute } = useApi('/api/data', {
  showSuccessToast: 'Data loaded successfully!', // Custom message
  // or
  showSuccessToast: true, // Default message
  // or
  showSuccessToast: false, // No toast
})
```

### Manual Toasts

```tsx
import { toast } from "sonner"
import { showSuccess } from "@/lib/error-handling"

// Success
toast.success("Profile updated!")
showSuccess("Profile updated!") // Uses error handling system

// Error
toast.error("Something went wrong")

// Info
toast.info("New challenge available")

// Warning
toast.warning("Low balance")
```

## Best Practices

### 1. Always Show Loading States

```tsx
// ✅ Good
if (loading) return <LoadingSpinner />
if (error) return <ErrorDisplay error={error} />

// ❌ Bad
const data = await fetch('/api/data') // Blocks UI
```

### 2. Use Optimistic Updates for Better UX

```tsx
// ✅ Good - Immediate feedback
const { mutate } = useMutation('/api/like', {
  optimisticUpdate: () => setLiked(true),
  showSuccessToast: false // Don't need toast for likes
})

// ❌ Bad - Wait for server
await mutate()
setLiked(true) // Too slow
```

### 3. Handle Errors Gracefully

```tsx
// ✅ Good
const { error, execute } = useApi('/api/data', {
  onError: (error) => {
    // Log to monitoring service
    console.error('API Error:', error)
  }
})

// ❌ Bad
try {
  await fetch('/api/data')
} catch (e) {
  // Silent failure
}
```

### 4. Use Skeleton Loaders for Lists

```tsx
// ✅ Good - Shows structure
{loading ? (
  <SkeletonLoader count={5} className="h-20 w-full" />
) : (
  <ChallengeList challenges={data} />
)}

// ❌ Bad - Just spinner
{loading ? <Spinner /> : <ChallengeList />}
```

### 5. Disable Buttons During Loading

```tsx
// ✅ Good
<Button disabled={loading} onClick={handleSubmit}>
  {loading ? 'Saving...' : 'Save'}
</Button>

// ❌ Bad
<Button onClick={handleSubmit}>Save</Button> // Can click multiple times
```

## Migration Guide

### Before (Manual)

```tsx
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
const [data, setData] = useState(null)

const fetchData = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/data')
    const json = await res.json()
    setData(json)
  } catch (e) {
    setError(e.message)
    toast.error(e.message)
  } finally {
    setLoading(false)
  }
}
```

### After (With Hook)

```tsx
const { data, loading, error, execute } = useApi('/api/data', {
  showErrorToast: true
})

useEffect(() => {
  execute()
}, [])
```

## Examples

See `components/examples/api-usage-example.tsx` for complete working examples.

