# ⚡ Quick Google OAuth Setup

## 🚀 **30-Second Setup Checklist**

### 1. Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project "Stakr App"
3. Enable "Google+ API"
4. Set up OAuth consent screen (External)
5. Create Web Application credentials

### 2. Copy These Exact Settings

**Authorized JavaScript origins:**
\`\`\`
https://stakr.app
https://www.stakr.app
http://localhost:3000
\`\`\`

**Authorized redirect URIs:**
\`\`\`
https://stakr.app/api/auth/callback/google
https://www.stakr.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
\`\`\`

### 3. Environment Variables
Add to `.env.local`:
\`\`\`bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000
\`\`\`

### 4. Test
1. Visit: `http://localhost:3000/api/debug/google-oauth`
2. Should show: `"ready_for_google_oauth": true`
3. Test sign-in: `http://localhost:3000/auth/signin`

---

## 🆘 **Quick Fixes**

**Error 400**: Check redirect URIs match exactly  
**"App not verified"**: Click "Advanced" → "Go to Stakr (unsafe)"  
**Variables not working**: Restart dev server  

---

**📖 Full Guide**: See `GOOGLE_OAUTH_SETUP.md` for detailed instructions
