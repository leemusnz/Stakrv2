# 📸 Profile Picture Upload Troubleshooting Guide

## 🚨 Common Issues in Deployed Environment

### **Issue: Fetch Error When Changing Profile Picture**

This error typically occurs due to one of the following reasons:

---

## 🔍 **Step 1: Check Environment Variables**

Visit your deployed app at: `https://stakr.app/api/test-deployment`

Look for these critical environment variables:

### **Required for File Upload:**
- ✅ `AWS_ACCESS_KEY_ID` - Must be set
- ✅ `AWS_SECRET_ACCESS_KEY` - Must be set  
- ✅ `AWS_REGION` - Must be set (e.g., `ap-southeast-2`)
- ✅ `AWS_BUCKET_NAME` - Must be set (e.g., `stakr-verification-files`)

### **Required for Authentication:**
- ✅ `NEXTAUTH_SECRET` - Must be set
- ✅ `NEXTAUTH_URL` - Must match your deployment URL

---

## 🛠️ **Step 2: Fix Environment Variables**

### **In Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add missing variables:

\`\`\`env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-2
AWS_BUCKET_NAME=stakr-verification-files
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
\`\`\`

### **Test Environment Setup:**
After adding variables, redeploy and visit:
- `https://your-app.vercel.app/api/test-deployment`

Should show: `"fileUploadReady": true`

---

## 🔐 **Step 3: AWS S3 Setup**

### **Create S3 Bucket:**
1. Go to AWS S3 Console
2. Create bucket named: `stakr-verification-files`
3. Set region: `ap-southeast-2` (or your preferred region)
4. **Important:** Configure CORS policy:

\`\`\`json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://your-app.vercel.app",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
\`\`\`

### **Create IAM User:**
1. Go to AWS IAM Console
2. Create user: `stakr-s3-upload`
3. Attach policy: `AmazonS3FullAccess` (or create custom policy)
4. Generate Access Keys
5. Use these keys in your environment variables

---

## 🧪 **Step 4: Test the Fix**

### **Test Authentication:**
1. Visit your app and sign in
2. Check: `https://your-app.vercel.app/api/test-deployment`
3. Should show: `"authenticationWorking": true`

### **Test File Upload:**
1. Go to Profile or Settings page
2. Try uploading a small test image (< 1MB)
3. Monitor browser console for errors

### **Test API Endpoints Individually:**
\`\`\`bash
# Test presigned URL generation (requires authentication)
curl -X POST https://your-app.vercel.app/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "fileType": "image/jpeg", 
    "fileSize": 50000,
    "challengeId": "profile-images"
  }'
\`\`\`

---

## 🐛 **Step 5: Common Error Messages & Solutions**

### **"Unauthorized" / 401 Error**
- **Cause:** Authentication not working
- **Fix:** Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

### **"File storage service not available" / 503 Error**
- **Cause:** AWS credentials missing
- **Fix:** Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### **"Failed to generate upload URL"**
- **Cause:** AWS S3 bucket or region misconfigured
- **Fix:** Verify `AWS_BUCKET_NAME` and `AWS_REGION`

### **"Session expired. Please refresh the page"**
- **Cause:** NextAuth session expired
- **Fix:** Refresh page and try again

### **CORS Errors in Browser Console**
- **Cause:** S3 bucket CORS not configured
- **Fix:** Add CORS policy to S3 bucket (see Step 3)

---

## 🔧 **Step 6: Recent Code Fixes Applied**

The following fixes have been applied to resolve the issue:

### **✅ Authentication Re-enabled**
- Removed temporary auth bypass in upload endpoint
- Now requires valid user session for all uploads

### **✅ Better Error Handling**
- Added specific error messages for AWS credential issues
- Added user-friendly error messages in the UI

### **✅ Environment Validation**
- Enhanced deployment test endpoint
- Better diagnostics for missing configurations

---

## 🚀 **Step 7: Deploy & Test**

1. **Deploy the fixes:**
   \`\`\`bash
   git add .
   git commit -m "Fix profile picture upload authentication and error handling"
   git push
   \`\`\`

2. **Wait for deployment to complete**

3. **Test the complete flow:**
   - Sign in to your app
   - Go to profile settings
   - Upload a profile picture
   - Verify it appears correctly

---

## 📞 **Still Having Issues?**

### **Check Browser Console:**
Open Developer Tools → Console tab and look for:
- Network errors (red entries)
- JavaScript errors
- Failed fetch requests

### **Check Server Logs:**
In Vercel dashboard:
- Go to Functions tab
- Check logs for upload-related API calls
- Look for AWS or authentication errors

### **Manual Verification:**
1. Visit: `https://your-app.vercel.app/api/test-deployment`
2. Confirm all checks are green
3. Test authentication by signing in
4. Try uploading from an incognito window

---

## 🎯 **Quick Checklist**

- [ ] AWS credentials set in Vercel environment variables
- [ ] S3 bucket created with correct name and region
- [ ] S3 CORS policy configured
- [ ] NextAuth environment variables set
- [ ] App redeployed after environment changes
- [ ] Authentication working (can sign in)
- [ ] Test deployment endpoint shows all green
- [ ] Profile picture upload tested end-to-end

**Once all items are checked, profile picture uploads should work correctly!** ✅
