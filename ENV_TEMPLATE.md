# 🔐 Environment Variables Template

## 📋 **Copy and paste this into your `.env.local` file:**

\`\`\`bash
# ====================================
# GOOGLE OAUTH CONFIGURATION  
# ====================================
# Get these from Google Cloud Console:
# 1. Go to console.cloud.google.com
# 2. Create project "Stakr App" 
# 3. APIs & Services → Credentials → Create OAuth client ID
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# ====================================
# NEXTAUTH CONFIGURATION
# ====================================
# For development
NEXTAUTH_URL=http://localhost:3000
# For production: https://stakr.app

# Generate a random secret (minimum 32 characters):
# You can use: openssl rand -base64 32
NEXTAUTH_SECRET=your_random_secret_here_minimum_32_characters

# ====================================
# DATABASE CONFIGURATION
# ====================================
# Your Neon PostgreSQL connection string
DATABASE_URL=your_database_connection_string_here

# ====================================
# EMAIL CONFIGURATION (RESEND)
# ====================================
# Get from resend.com dashboard
RESEND_API_KEY=your_resend_api_key_here

# ====================================
# FILE UPLOAD CONFIGURATION
# ====================================
# AWS S3 credentials for file uploads
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name_here

# ====================================
# CONTENT MODERATION
# ====================================
# OpenAI API key for content moderation
OPENAI_API_KEY=your_openai_api_key_here

# ====================================
# OPTIONAL: DEVELOPMENT SETTINGS
# ====================================
# Set to 'development' for local work
NODE_ENV=development

# Enable debug logging for NextAuth (uncomment if needed)
# NEXTAUTH_DEBUG=true
\`\`\`

## 🎯 **Quick Setup Steps:**

1. **Create `.env.local`** in your project root
2. **Copy the template above** into the file
3. **Replace the placeholder values** with your actual credentials
4. **Restart your development server**: `npm run dev`
5. **Test**: Visit `http://localhost:3000/api/debug/google-oauth`

## 🔒 **Security Notes:**

- ✅ `.env.local` is already in your `.gitignore`
- ❌ Never commit real credentials to version control
- 🔄 Use different values for development vs production
