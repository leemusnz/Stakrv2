# Avatar System Testing Guide

## Overview
This guide covers how to test the avatar upload system, including AI moderation, to ensure everything works correctly across the Stakr platform.

## Testing Components

### 1. Avatar Upload System
- **File upload to S3**: Tests the ability to upload images to AWS S3
- **Session updates**: Verifies that avatar changes persist in user sessions
- **Cross-component synchronization**: Ensures avatar updates appear everywhere
- **Image proxy**: Tests the image proxy system for S3 URLs

### 2. AI Moderation System
- **Safe image detection**: Tests that appropriate images pass moderation
- **Inappropriate content detection**: Tests that inappropriate images are flagged
- **Violence detection**: Tests that violent images are flagged
- **Moderation accuracy**: Validates the AI's ability to correctly classify images

## How to Run Tests

### Option 1: Dev Tools Panel (Recommended)
1. **Access Dev Tools**: Go to `/dev-tools` (requires dev access)
2. **Enable Dev Mode**: If not already enabled, toggle dev mode in settings
3. **Navigate to Avatar Tab**: Click the "Avatar" tab in the dev tools
4. **Run Tests**: Use the test panel to run individual or all tests

### Option 2: Direct API Testing
\`\`\`bash
# Test upload functionality
curl -X POST http://localhost:3000/api/test-avatar-moderation \
  -H "Content-Type: application/json" \
  -d '{"testType": "upload_test"}'

# Test moderation system
curl -X POST http://localhost:3000/api/test-avatar-moderation \
  -H "Content-Type: application/json" \
  -d '{"testType": "moderation_test"}'

# Test full pipeline
curl -X POST http://localhost:3000/api/test-avatar-moderation \
  -H "Content-Type: application/json" \
  -d '{"testType": "full_pipeline_test"}'
\`\`\`

### Option 3: Browser Console
\`\`\`javascript
// Test upload
fetch('/api/test-avatar-moderation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testType: 'upload_test' })
}).then(r => r.json()).then(console.log)

// Test moderation
fetch('/api/test-avatar-moderation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testType: 'moderation_test' })
}).then(r => r.json()).then(console.log)
\`\`\`

## Available Tests

### 1. Upload Test (`upload_test`)
**Purpose**: Tests the basic avatar upload functionality
**What it tests**:
- File upload to S3
- File URL generation
- Upload time measurement
- Error handling

**Expected Results**:
- ✅ Upload success: true
- ✅ File URL generated
- ✅ Upload time < 5000ms
- ✅ No errors

### 2. Moderation Test (`moderation_test`)
**Purpose**: Tests the AI moderation system
**What it tests**:
- Safe image detection (should pass)
- Inappropriate content detection (should be flagged)
- Violence detection (should be flagged)
- Moderation API response times

**Expected Results**:
- ✅ Safe image: PASS
- ✅ Inappropriate image: FAIL (flagged)
- ✅ Violence image: FAIL (flagged)
- ✅ Moderation API responds quickly

### 3. Session Update Test (`session_update_test`)
**Purpose**: Tests session and profile update functionality
**What it tests**:
- Profile API updates
- Session state management
- Avatar URL persistence

**Expected Results**:
- ✅ Session update: Success
- ✅ Profile update: Success
- ✅ Avatar URL saved correctly

### 4. Image Proxy Test (`proxy_test`)
**Purpose**: Tests the image proxy system
**What it tests**:
- S3 URL to proxy URL conversion
- Image proxy response times
- CORS handling
- Cache headers

**Expected Results**:
- ✅ Proxy success: true
- ✅ Response time < 2000ms
- ✅ Proper cache headers
- ✅ No CORS errors

### 5. Full Pipeline Test (`full_pipeline_test`)
**Purpose**: Tests the complete avatar upload pipeline
**What it tests**:
- Upload → Moderation → Session Update → Proxy
- End-to-end functionality
- Error handling at each step
- Total processing time

**Expected Results**:
- ✅ All steps: PASS
- ✅ Total time < 10000ms
- ✅ No errors in pipeline
- ✅ Avatar appears everywhere

## Manual Testing Checklist

### Profile Page Testing
- [ ] Click edit icon on avatar
- [ ] Upload new image
- [ ] Verify immediate visual update
- [ ] Refresh page and verify persistence
- [ ] Check navigation avatar updates
- [ ] Test with inappropriate image (should be rejected)

### Settings Page Testing
- [ ] Go to settings page
- [ ] Upload new avatar in profile section
- [ ] Verify immediate update
- [ ] Navigate to other pages
- [ ] Verify avatar appears consistently
- [ ] Test avatar removal functionality

### Cross-Component Testing
- [ ] Upload avatar on profile page
- [ ] Check navigation avatar updates
- [ ] Go to settings page - verify avatar
- [ ] Go to dashboard - verify avatar
- [ ] Go to social page - verify avatar
- [ ] Refresh browser - verify persistence

### Moderation Testing
- [ ] Upload safe image (should work)
- [ ] Upload inappropriate image (should be rejected)
- [ ] Upload violent image (should be rejected)
- [ ] Upload text-heavy image (should be rejected)
- [ ] Upload multiple people image (should be rejected)
- [ ] Verify appropriate error messages

## Troubleshooting

### Common Issues

#### 1. Upload Fails
**Symptoms**: Upload button doesn't work, no error message
**Solutions**:
- Check browser console for errors
- Verify AWS credentials are configured
- Check network connectivity
- Ensure file size < 10MB
- Verify file type is image (JPG, PNG, WebP)

#### 2. Avatar Not Updating
**Symptoms**: Upload succeeds but avatar doesn't change
**Solutions**:
- Check session update logs
- Verify avatar events system
- Clear browser cache
- Check image proxy functionality
- Verify S3 URL is accessible

#### 3. Moderation Not Working
**Symptoms**: Inappropriate images pass moderation
**Solutions**:
- Check moderation API logs
- Verify OpenAI API key is configured
- Check moderation service status
- Verify image URLs are accessible
- Check moderation thresholds

#### 4. Cross-Component Sync Issues
**Symptoms**: Avatar updates on one page but not others
**Solutions**:
- Check avatar events system
- Verify useAvatar hook integration
- Check session update format
- Verify image proxy caching
- Check component re-render logic

### Debug Commands

#### Check Avatar System Status
\`\`\`bash
curl http://localhost:3000/api/test-avatar-system
\`\`\`

#### Check Moderation API
\`\`\`bash
curl -X POST http://localhost:3000/api/moderate/image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://via.placeholder.com/100x100"}'
\`\`\`

#### Check Image Proxy
\`\`\`bash
curl "http://localhost:3000/api/image-proxy?url=YOUR_S3_URL&v=test"
\`\`\`

#### Check Session State
\`\`\`javascript
// In browser console
console.log('Session:', session)
console.log('Avatar URL:', session?.user?.image)
\`\`\`

## Performance Benchmarks

### Expected Performance
- **Upload time**: < 5 seconds
- **Moderation time**: < 3 seconds
- **Session update**: < 1 second
- **Image proxy response**: < 2 seconds
- **Full pipeline**: < 10 seconds

### Performance Monitoring
\`\`\`javascript
// Monitor upload performance
const startTime = Date.now()
// ... upload code ...
console.log('Upload time:', Date.now() - startTime)

// Monitor moderation performance
const startTime = Date.now()
// ... moderation code ...
console.log('Moderation time:', Date.now() - startTime)
\`\`\`

## Security Testing

### File Upload Security
- [ ] Test with oversized files (>10MB)
- [ ] Test with non-image files
- [ ] Test with malicious file names
- [ ] Test with empty files
- [ ] Verify file type validation

### Moderation Security
- [ ] Test with various inappropriate content types
- [ ] Test moderation bypass attempts
- [ ] Verify error handling for moderation failures
- [ ] Test with malformed image URLs

### Session Security
- [ ] Test session hijacking scenarios
- [ ] Verify proper authentication checks
- [ ] Test with invalid session tokens
- [ ] Verify avatar URL validation

## Integration Testing

### With Other Systems
- [ ] Test with notification system
- [ ] Test with social features
- [ ] Test with challenge system
- [ ] Test with admin dashboard
- [ ] Test with analytics system

### Database Integration
- [ ] Verify avatar URLs are saved to database
- [ ] Test avatar retrieval from database
- [ ] Test avatar update in database
- [ ] Test avatar deletion from database

## Continuous Testing

### Automated Testing Setup
\`\`\`javascript
// Example automated test
async function testAvatarPipeline() {
  const results = await fetch('/api/test-avatar-moderation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testType: 'full_pipeline_test' })
  }).then(r => r.json())
  
  if (!results.results.pipelineSuccess) {
    throw new Error('Avatar pipeline test failed')
  }
  
  console.log('✅ Avatar pipeline test passed')
}
\`\`\`

### Monitoring and Alerts
- Set up monitoring for upload success rates
- Monitor moderation accuracy
- Track avatar update performance
- Alert on system failures

## Conclusion

The avatar testing system provides comprehensive coverage of:
1. **Upload functionality** - File upload to S3
2. **AI moderation** - Content safety checks
3. **Session management** - User state updates
4. **Cross-component sync** - Avatar consistency
5. **Performance** - Response time monitoring
6. **Security** - File validation and moderation

Regular testing ensures the avatar system remains reliable, secure, and performant for all users.
