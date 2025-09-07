# 🔐 Google OAuth Setup Guide for Stakr

## Overview
This guide will help you set up Google sign-in for your Stakr application. Users will be able to sign in with their Google accounts alongside the existing email/password authentication.

## ⏱️ Estimated Time: 15-20 minutes

---

## 📋 **Prerequisites**
- Google account (personal or business)
- Access to your domain DNS settings (for production)
- Admin access to your hosting platform (Vercel, etc.)

---

## 🚀 **Step 1: Google Cloud Console Setup**

### 1.1 Create a New Project
1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Click the project dropdown** at the top of the page
3. **Click "New Project"**
4. **Fill out the form**:
   \`\`\`
   Project Name: Stakr App
   Organization: (leave as default or select your org)
   Location: (leave as default)
   \`\`\`
5. **Click "Create"**
6. **Wait for the project to be created** (30-60 seconds)
7. **Select your new project** from the dropdown

### 1.2 Enable Required APIs
1. **Go to "APIs & Services" → "Library"** (left sidebar)
2. **Search for "Google+ API"**
3. **Click on "Google+ API"** result
4. **Click "Enable"**
5. **Wait for activation** (usually instant)

---

## 🔧 **Step 2: Configure OAuth Consent Screen**

### 2.1 Set Up Consent Screen
1. **Go to "APIs & Services" → "OAuth consent screen"** (left sidebar)
2. **Choose "External"** (allows any Google user to sign in)
3. **Click "Create"**

### 2.2 Fill Out App Information
**On the "OAuth consent screen" tab, enter:**

\`\`\`
App name: Stakr
User support email: [your-email@stakr.app]
App logo: [Upload your logo - optional but recommended]

App domain (optional but recommended):
- Application home page: https://stakr.app
- Application privacy policy link: https://stakr.app/privacy
- Application terms of service link: https://stakr.app/terms

Developer contact information:
Email addresses: [your-email@stakr.app]
\`\`\`

4. **Click "Save and Continue"**

### 2.3 Add Scopes
1. **On the "Scopes" tab, click "Add or Remove Scopes"**
2. **Select these scopes**:
   - `../auth/userinfo.email` (Show your email address)
   - `../auth/userinfo.profile` (See your personal info)
   - `openid` (Associate you with your personal info)
3. **Click "Update"**
4. **Click "Save and Continue"**

### 2.4 Test Users (Development Only)
1. **On "Test users" tab, click "Add Users"**
2. **Add your email** and any other emails that need to test
3. **Click "Save and Continue"**

### 2.5 Summary
1. **Review your settings**
2. **Click "Back to Dashboard"**

---

## 🔑 **Step 3: Create OAuth Credentials**

### 3.1 Create Credentials
1. **Go to "APIs & Services" → "Credentials"** (left sidebar)
2. **Click "Create Credentials" → "OAuth client ID"**
3. **Choose "Web application"**

### 3.2 Configure Web Application
**Fill out the form:**

\`\`\`
Name: Stakr Web App

Authorized JavaScript origins:
https://stakr.app
https://www.stakr.app
http://localhost:3000
http://localhost:3001

Authorized redirect URIs:
https://stakr.app/api/auth/callback/google
https://www.stakr.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
\`\`\`

4. **Click "Create"**

### 3.3 Save Your Credentials
1. **A modal will appear with your credentials**
2. **Copy the "Client ID"** - save it somewhere safe
3. **Copy the "Client Secret"** - save it somewhere safe
4. **Click "OK"**

**⚠️ IMPORTANT**: Keep these credentials secure! Don't share them publicly.

---

## 🌍 **Step 4: Environment Variables Setup**

### 4.1 Local Development
1. **Open your `.env.local` file** (create if it doesn't exist)
2. **Add these variables**:

\`\`\`bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration (if not already set)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here_minimum_32_characters
\`\`\`

### 4.2 Production Environment
**Add the same variables to your hosting platform:**

#### For Vercel:
1. **Go to your Vercel dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add each variable**:
   \`\`\`
   Name: GOOGLE_CLIENT_ID
   Value: [your_client_id]
   Environment: Production, Preview, Development
   \`\`\`
   \`\`\`
   Name: GOOGLE_CLIENT_SECRET
   Value: [your_client_secret]
   Environment: Production, Preview, Development
   \`\`\`
   \`\`\`
   Name: NEXTAUTH_URL
   Value: https://stakr.app
   Environment: Production
   \`\`\`

#### For Other Hosting Platforms:
- **Netlify**: Site settings → Environment variables
- **Railway**: Variables tab in your project
- **DigitalOcean**: App Platform → Settings → Environment

---

## 🧪 **Step 5: Testing Your Setup**

### 5.1 Check Configuration
1. **Visit your app**: `http://localhost:3000/api/debug/google-oauth`
2. **You should see**:
   \`\`\`json
   {
     "google_oauth_config": {
       "client_id_configured": true,
       "client_secret_configured": true,
       "ready_for_google_oauth": true
     }
   }
   \`\`\`

### 5.2 Test Google Sign-In
1. **Go to**: `http://localhost:3000/auth/signin`
2. **Click "Continue with Google"**
3. **You should be redirected to Google's consent screen**
4. **Grant permissions**
5. **You should be redirected back and signed in**

---

## 🚨 **Troubleshooting**

### Common Issues:

#### "Error 400: redirect_uri_mismatch"
**Problem**: Your redirect URI doesn't match what's configured in Google Cloud Console
**Solution**: 
1. Check the exact URL in the error message
2. Add that exact URL to your "Authorized redirect URIs" in Google Cloud Console
3. Make sure there are no trailing slashes or typos

#### "This app isn't verified"
**Problem**: Google shows a warning because your app isn't verified yet
**Solution**: 
1. Click "Advanced" → "Go to Stakr (unsafe)" for testing
2. For production, submit your app for verification (optional for internal use)

#### "Access blocked: This app's request is invalid"
**Problem**: Missing or incorrect scopes
**Solution**:
1. Check your OAuth consent screen scopes
2. Make sure you have `email`, `profile`, and `openid` scopes

#### Environment Variables Not Working
**Problem**: Variables aren't being loaded
**Solution**:
1. Restart your development server
2. Check for typos in variable names
3. Make sure `.env.local` is in your project root
4. For production, redeploy after adding environment variables

### Debug Commands:
\`\`\`bash
# Check if environment variables are loaded
npm run dev
# Then visit: http://localhost:3000/api/debug/google-oauth

# Check NextAuth configuration
# Visit: http://localhost:3000/api/auth/providers
\`\`\`

---

## 📱 **Step 6: Mobile App Setup (Future)**

When you create a mobile app, you'll need to:

1. **Add mobile redirect URIs** to your Google Cloud Console:
   \`\`\`
   com.stakr.app://oauth/callback
   \`\`\`

2. **Configure deep linking** in your mobile app

3. **Use the same Client ID** for consistency

---

## 🔒 **Security Best Practices**

### ✅ Do:
- Keep your Client Secret secure and never expose it publicly
- Use HTTPS in production
- Regularly rotate your secrets
- Monitor your Google Cloud Console for unusual activity
- Set up proper error handling

### ❌ Don't:
- Commit secrets to version control
- Share credentials in chat/email
- Use development credentials in production
- Allow unlimited redirect URIs

---

## 🎯 **What Happens After Setup**

Once configured, users can:
1. **Click "Continue with Google"** on your sign-in page
2. **Authorize your app** (one-time consent)
3. **Get automatically signed in** with their Google account
4. **Have their profile created** in your database
5. **Access all features** just like email/password users

---

## 📞 **Need Help?**

If you run into issues:
1. **Check the troubleshooting section above**
2. **Visit the debug endpoint**: `/api/debug/google-oauth`
3. **Check browser developer console** for error messages
4. **Review Google Cloud Console logs**

---

## ✅ **Verification Checklist**

Before going live, ensure:
- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] Credentials created with correct redirect URIs
- [ ] Environment variables set in development
- [ ] Environment variables set in production
- [ ] Local testing successful
- [ ] Production testing successful
- [ ] Error handling tested
- [ ] Mobile responsiveness verified

---

**🎉 Congratulations!** Your users can now sign in with Google for a seamless authentication experience!
