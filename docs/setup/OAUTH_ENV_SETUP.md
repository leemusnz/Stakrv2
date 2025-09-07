# 🔑 OAuth Environment Variables Setup

## Required Environment Variables for Complete Integration System

Add these to your `.env.local` file:

\`\`\`bash
# ================================
# 🎵 SPOTIFY INTEGRATION
# ================================
# Get from: https://developer.spotify.com/dashboard
# 1. Create app at developer.spotify.com
# 2. Add redirect URI: http://localhost:3000/api/auth/callback/spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# ================================
# 🏃 STRAVA INTEGRATION  
# ================================
# Get from: https://developers.strava.com/
# 1. Create app at developers.strava.com
# 2. Add redirect URI: http://localhost:3000/api/integrations/callback/strava
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# ================================
# ⌚ FITBIT INTEGRATION
# ================================
# Get from: https://dev.fitbit.com/apps
# 1. Create app at dev.fitbit.com
# 2. Add redirect URI: http://localhost:3000/api/auth/callback/fitbit
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret

# ================================
# 🐙 GITHUB INTEGRATION
# ================================
# Get from: https://github.com/settings/developers
# 1. Create OAuth app at github.com/settings/developers
# 2. Add redirect URI: http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ================================
# ✅ TODOIST INTEGRATION
# ================================
# Get from: https://developer.todoist.com/appconsole.html
# 1. Create app at developer.todoist.com
# 2. Add redirect URI: http://localhost:3000/api/auth/callback/todoist
TODOIST_CLIENT_ID=your_todoist_client_id
TODOIST_CLIENT_SECRET=your_todoist_client_secret

# ================================
# 📱 GOOGLE FIT INTEGRATION
# ================================
# Get from: https://console.cloud.google.com/
# 1. Enable Google Fit API
# 2. Create OAuth client ID
# 3. Add redirect URI: http://localhost:3000/api/auth/callback/google-fit
GOOGLE_FIT_CLIENT_ID=your_google_fit_client_id
GOOGLE_FIT_CLIENT_SECRET=your_google_fit_client_secret

# ================================
# 🍎 MYFITNESSPAL INTEGRATION
# ================================
# Get from: https://www.underarmour.com/en-us/connected-fitness/partners
# 1. Apply for Under Armour Connected Fitness API
# 2. MyFitnessPal uses Under Armour's platform
MYFITNESSPAL_CLIENT_ID=your_myfitnesspal_client_id
MYFITNESSPAL_CLIENT_SECRET=your_myfitnesspal_client_secret
\`\`\`

## 🔧 Quick Setup Instructions

### 1. Spotify OAuth Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create an App"
3. Fill in app details
4. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
5. Copy Client ID and Client Secret

### 2. Strava OAuth Setup
1. Go to [Strava Developers](https://developers.strava.com/)
2. Click "Create & Manage Your App"
3. Set Authorization Callback Domain: `localhost:3000`
4. Add Redirect URI: `http://localhost:3000/api/integrations/callback/strava`
5. Copy Client ID and Client Secret

### 3. GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret

### 4. Fitbit OAuth Setup
1. Go to [Fitbit Dev Console](https://dev.fitbit.com/apps)
2. Click "Register an App"
3. Set OAuth 2.0 Application Type: "Personal"
4. Set Callback URL: `http://localhost:3000/api/auth/callback/fitbit`
5. Copy Client ID and Client Secret

### 5. Todoist OAuth Setup
1. Go to [Todoist App Console](https://developer.todoist.com/appconsole.html)
2. Click "Create a new app"
3. Set OAuth redirect URL: `http://localhost:3000/api/auth/callback/todoist`
4. Copy Client ID and Client Secret

## 🚨 Production Setup

For production, replace `localhost:3000` with your actual domain:
- `https://yourdomain.com/api/integrations/callback/strava` (Strava)
- `https://yourdomain.com/api/auth/callback/[provider]` (others)

## 🧪 Testing OAuth Flows

1. **Start dev server**: `npm run dev`
2. **Go to Settings**: `http://localhost:3000/settings`
3. **Click Integrations tab**
4. **Try adding an integration** - should redirect to OAuth provider
5. **Complete authorization** - should redirect back with success message

## 📋 Integration Status

**OAuth Implemented:**
- ✅ Spotify (Music tracking)
- ✅ Strava (Fitness tracking) 
- ✅ Fitbit (Health/fitness tracking)
- ✅ GitHub (Code commits)
- ✅ Todoist (Task completion)

**Manual Verification:**
- 📝 Headspace (Screenshot verification)
- 📝 Duolingo (Username lookup + screenshots)
- 📝 Noom (Screenshot verification)
- 📝 Other apps (Manual proof submission)

**Additional OAuth (TODO):**
- 🔄 Google Fit
- 🔄 MyFitnessPal (Under Armour API)
- 🔄 Garmin (Connect IQ)
- 🔄 YouTube Music
- 🔄 LinkedIn Learning

## 🛠️ Troubleshooting

**Common Issues:**
1. **"Redirect URI mismatch"**: Make sure callback URL matches exactly
2. **"Invalid client"**: Check client ID/secret are correct
3. **"Access denied"**: User declined authorization
4. **Token expired**: Implement refresh token logic (future enhancement)
