# File Storage Setup Guide for Stakr

## Overview
Stakr's verification system uses secure cloud storage for proof files (images/videos). This guide covers setting up AWS S3 or Cloudinary.

## Option 1: AWS S3 Setup (Recommended)

### Step 1: Create AWS Account & S3 Bucket
1. Sign up for AWS account at https://aws.amazon.com
2. Go to S3 Console: https://s3.console.aws.amazon.com
3. Create new bucket: `stakr-verification-files` (or your preferred name)
4. Set region: `us-east-1` (or your preferred region)
5. **Important**: Block all public access initially (we'll use presigned URLs)

### Step 2: Create IAM User for Stakr
1. Go to IAM Console: https://console.aws.amazon.com/iam
2. Create new user: `stakr-s3-user`
3. Attach policy with these permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::stakr-verification-files/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::stakr-verification-files"
        }
    ]
}
```

### Step 3: Get Access Keys
1. In IAM, go to your user
2. Go to "Security credentials" tab
3. Create access key for "Application running outside AWS"
4. **Save these securely - you won't see them again!**

### Step 4: Environment Variables
Add to your `.env.local`:
```env
# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="stakr-verification-files"
AWS_ACCESS_KEY_ID="your-access-key-here"
AWS_SECRET_ACCESS_KEY="your-secret-key-here"
```

## Option 2: Cloudinary Setup (Alternative)

### Step 1: Create Cloudinary Account
1. Sign up at https://cloudinary.com
2. Go to Dashboard to get your credentials

### Step 2: Create Upload Preset
1. Go to Settings > Upload
2. Create upload preset: `stakr_verification`
3. Set to "Unsigned" if you want client-side uploads
4. Configure folder: `verification-files`

### Step 3: Environment Variables
Add to your `.env.local`:
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## Testing Your Setup

### 1. Check Storage Health
Visit: `http://localhost:3000/api/admin/storage-health`
(Requires admin access)

### 2. Test File Upload
1. Go to `/proof-demo` page
2. Try uploading a test image
3. Check browser network tab for successful uploads
4. Verify files appear in your S3 bucket/Cloudinary

### 3. Common Issues

**❌ Error: "AWS credentials not configured"**
- Check your `.env.local` file exists and has correct AWS keys
- Restart your dev server after adding env vars

**❌ Error: "Access Denied" on S3**
- Verify IAM policy has correct permissions
- Check bucket name matches exactly

**❌ Error: "File too large"**
- Default limit is 10MB
- Adjust `MAX_FILE_SIZE` in `lib/storage.ts` if needed

**❌ Error: "CORS error" in browser**
- S3 bucket needs CORS policy:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "POST", "GET"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

## Security Features

✅ **Presigned URLs** - No credentials exposed to client
✅ **File Validation** - Size, type, and anti-fraud checks  
✅ **Time-limited Access** - URLs expire in 1 hour
✅ **Organized Storage** - Files sorted by challenge/user
✅ **Metadata Tracking** - Upload details saved to database

## File Structure in Storage

```
verification-files/
├── images/
│   └── challenge-id/
│       └── user-id/
│           └── timestamp-randomid.jpg
└── videos/
    └── challenge-id/
        └── user-id/
            └── timestamp-randomid.mp4
```

## Production Checklist

- [ ] Set up production AWS/Cloudinary account
- [ ] Update environment variables for production
- [ ] Configure CDN (CloudFront for S3)
- [ ] Set up backup/lifecycle policies
- [ ] Monitor storage costs
- [ ] Test file cleanup for failed uploads

## Next Steps

1. **Run Database Migration**: Apply the `proof-submission-schema.sql`
2. **Test Uploads**: Try the `/proof-demo` page
3. **Configure Webhooks**: Set up file processing pipelines
4. **Monitor Usage**: Set up AWS billing alerts

Your file storage system is production-ready! 🚀 