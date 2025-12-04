# Avatar System

**Status:** ✅ Fixed and Working  
**Last Updated:** December 3, 2025

---

## Overview

The avatar system has been completely fixed and now works reliably across the entire site. Users can upload profile pictures that persist and display correctly everywhere.

### What Was Fixed

- ✅ Uploads work from profile page
- ✅ Uploads work from settings page
- ✅ Changes sync across all components
- ✅ Image proxy caching fixed
- ✅ Session updates work correctly
- ✅ No more stale avatar displays

---

## How It Works

### Architecture

```
User Upload → S3 Storage → Image Proxy → Display
                              ↓
                        Cache Busting
                              ↓
                      Real-Time Updates
```

### Components

1. **ProfilePictureUpload** - Upload component
2. **useAvatar** - Centralized avatar state hook
3. **Image Proxy** - Serves images with proper caching
4. **Avatar Event System** - Cross-component synchronization

---

## For Developers

### Using Avatar in Components

**Best Practice: Use `useAvatar` Hook**

```typescript
import { useAvatar } from '@/hooks/use-avatar'

export function MyComponent() {
  const { avatar, isLoading } = useAvatar()
  
  return (
    <img 
      src={avatar || '/default-avatar.png'} 
      alt="Profile"
      className="rounded-full w-10 h-10"
    />
  )
}
```

### Upload Component

```typescript
import { ProfilePictureUpload } from '@/components/profile-picture-upload'

export function ProfileSettings() {
  return (
    <div>
      <ProfilePictureUpload />
    </div>
  )
}
```

### Image Proxy

All S3 URLs are automatically converted to proxy URLs:

```
S3: https://stakr-uploads.s3.amazonaws.com/avatars/user123.jpg
↓
Proxy: /api/image-proxy?url=https://...&cache=timestamp
```

**Benefits:**
- Proper caching headers
- Cache busting on updates
- CORS handling
- Optimized delivery

---

## For Users

### Uploading Avatar

1. Go to Settings → Profile
2. Click on current avatar or "Edit" icon
3. Choose image file (JPG, PNG, GIF)
4. Image uploads automatically
5. Avatar updates across entire site

### Supported Formats

- **JPG/JPEG** - Recommended
- **PNG** - Supports transparency
- **GIF** - Animated supported
- **WebP** - Modern format

**Size Limits:**
- Max file size: 5MB
- Recommended: 500x500px or larger
- Will be displayed as: 40x40px to 200x200px depending on location

---

## Troubleshooting

### Avatar Not Updating

**Symptoms:** Upload succeeds but old avatar still shows

**Solutions:**

1. **Hard refresh browser:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**
3. **Check session is active:** Log out and log back in
4. **Verify upload succeeded:** Check S3 bucket for new image

### Upload Fails

**Symptoms:** Error message or upload doesn't start

**Solutions:**

1. **Check file size:** Must be under 5MB
2. **Check file format:** Must be JPG, PNG, GIF, or WebP
3. **Check S3 configuration:** Verify AWS credentials in environment
4. **Check network:** Ensure stable internet connection

**Error Messages:**

```
"File too large" → Reduce image size
"Invalid file type" → Use JPG, PNG, GIF, or WebP
"Upload failed" → Check S3 configuration
"Network error" → Check internet connection
```

### Avatar Not Syncing Across Tabs

**Symptoms:** Different avatar in different browser tabs

**Solutions:**

1. **Refresh all tabs:** Ctrl+R in each tab
2. **Use avatar event system:** Components should listen for changes
3. **Check useAvatar hook:** Make sure components use the hook

### Broken Image Icon

**Symptoms:** Avatar shows broken image icon

**Solutions:**

1. **Check S3 permissions:** Bucket must allow public read
2. **Check image URL:** Verify URL is accessible
3. **Check CORS:** S3 bucket must have CORS configured
4. **Check image exists:** Verify file uploaded to S3

---

## Testing Checklist

### Manual Testing

- [ ] Upload avatar from profile page
- [ ] Upload avatar from settings page
- [ ] Verify avatar displays in navigation
- [ ] Verify avatar displays on profile page
- [ ] Verify avatar displays in settings
- [ ] Refresh page - avatar persists
- [ ] Open new tab - avatar displays correctly
- [ ] Upload new avatar - old one replaced
- [ ] Check mobile view - avatar displays
- [ ] Test different image formats (JPG, PNG)
- [ ] Test large files (near 5MB limit)

### Automated Testing

```typescript
// tests/__tests__/avatar.test.tsx
describe('Avatar System', () => {
  it('uploads avatar successfully', async () => {
    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
    const result = await uploadAvatar(file)
    expect(result.success).toBe(true)
    expect(result.url).toContain('s3.amazonaws.com')
  })
  
  it('updates session with new avatar', async () => {
    const newAvatarUrl = 'https://example.com/avatar.jpg'
    await updateUserAvatar(userId, newAvatarUrl)
    
    const session = await getSession()
    expect(session.user.image).toBe(newAvatarUrl)
  })
  
  it('converts S3 URLs to proxy URLs', () => {
    const s3Url = 'https://stakr-uploads.s3.amazonaws.com/avatar.jpg'
    const proxyUrl = toProxyUrl(s3Url)
    expect(proxyUrl).toContain('/api/image-proxy')
  })
})
```

---

## Technical Details

### Database Schema

```sql
-- Avatar stored in users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(255),
  image TEXT,  -- Avatar URL
  avatar TEXT, -- Alternate field (alias)
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Session Format

```typescript
interface Session {
  user: {
    id: string
    email: string
    name: string
    image: string  // Avatar URL
    avatar: string // Alias
  }
}
```

### Upload Flow

```typescript
// 1. User selects file
const file = event.target.files[0]

// 2. Upload to S3
const formData = new FormData()
formData.append('file', file)
formData.append('folder', 'avatars')

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

const { url } = await response.json()

// 3. Update database
await fetch('/api/user/update-profile', {
  method: 'PATCH',
  body: JSON.stringify({ image: url })
})

// 4. Update session
await update({ user: { ...session.user, image: url } })

// 5. Emit event for other components
window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { url } }))
```

### Cache Busting

```typescript
// Add timestamp to URL to bust cache
function bustCache(url: string): string {
  const timestamp = Date.now()
  return `${url}?cache=${timestamp}`
}

// Example
const freshUrl = bustCache(avatarUrl)
// https://example.com/avatar.jpg?cache=1234567890
```

---

## Common Patterns

### Display Avatar with Fallback

```typescript
<img 
  src={user.avatar || user.image || '/default-avatar.png'}
  alt={user.name}
  onError={(e) => {
    e.currentTarget.src = '/default-avatar.png'
  }}
/>
```

### Avatar with Loading State

```typescript
const { avatar, isLoading } = useAvatar()

return isLoading ? (
  <Skeleton className="w-10 h-10 rounded-full" />
) : (
  <img src={avatar} alt="Avatar" />
)
```

### Responsive Avatar Sizes

```typescript
<img 
  src={avatar}
  alt="Avatar"
  className={cn(
    "rounded-full object-cover",
    size === "sm" && "w-8 h-8",
    size === "md" && "w-12 h-12",
    size === "lg" && "w-16 h-16",
    size === "xl" && "w-24 h-24"
  )}
/>
```

---

## API Endpoints

### Upload Avatar
```
POST /api/upload
Content-Type: multipart/form-data
Body: { file: File, folder: 'avatars' }
Response: { url: string }
```

### Update Profile
```
PATCH /api/user/update-profile
Body: { image: string }
Response: { success: boolean }
```

### Image Proxy
```
GET /api/image-proxy?url=<s3-url>&cache=<timestamp>
Response: Image file
```

---

## Best Practices

### 1. Always Use `useAvatar` Hook

✅ **DO:**
```typescript
const { avatar } = useAvatar()
```

❌ **DON'T:**
```typescript
const avatar = session?.user?.image  // May be stale
```

### 2. Provide Fallback Images

✅ **DO:**
```typescript
src={avatar || '/default-avatar.png'}
```

❌ **DON'T:**
```typescript
src={avatar}  // Breaks if undefined
```

### 3. Handle Loading States

✅ **DO:**
```typescript
{isLoading ? <Skeleton /> : <img src={avatar} />}
```

❌ **DON'T:**
```typescript
<img src={avatar} />  // May flash or show broken image
```

### 4. Use Image Proxy

✅ **DO:**
```typescript
const proxyUrl = toProxyUrl(s3Url)
```

❌ **DON'T:**
```typescript
<img src={s3Url} />  // Direct S3 URL bypasses proxy
```

---

## Resources

- **useAvatar Hook:** `hooks/use-avatar.tsx`
- **Upload Component:** `components/profile-picture-upload.tsx`
- **Image Proxy:** `app/api/image-proxy/route.ts`
- **Upload API:** `app/api/upload/route.ts`

---

**Status:** ✅ Fully Working  
**Known Issues:** None  
**Last Major Fix:** December 2025

