# Stakr Testing Setup Guide

## 🚀 Quick Setup for Testing

### 1. Environment Variables Setup

Create a `.env.local` file in your project root with the following:

```bash
# Database Configuration (Required)
DATABASE_URL="postgresql://your_username:your_password@your_host/your_database?sslmode=require"

# NextAuth Configuration (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-change-this-in-production"

# Development Configuration
NODE_ENV="development"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 2. Testing Access Points

Once your server is running (`npm run dev`), you can access:

- **Testing Dashboard**: http://localhost:3000/test-dashboard
- **Onboarding Flow**: http://localhost:3000/onboarding
- **Main App**: http://localhost:3000

### 3. Demo Accounts for Testing

**Admin Account:**
- Email: `alex@stakr.app`
- Password: `password123`
- Features: Full admin access, high trust score, premium features

**Regular User:**
- Email: `demo@stakr.app` 
- Password: `demo123`
- Features: Standard user access, normal trust score

## 🧪 Testing Scenarios

### Authentication Flow Testing

1. **Login Test**
   - Go to testing dashboard → Authentication tab
   - Use demo credentials to test login
   - Verify session information appears correctly

2. **Onboarding Flow**
   - Start at `/onboarding`
   - Test each step of the onboarding process
   - Verify authentication step works with demo accounts

3. **Session Persistence**
   - Login and navigate between pages
   - Refresh the page and verify session persists
   - Test logout functionality

### System Health Testing

1. **Database Connection**
   - Visit testing dashboard → System Tests tab
   - Check database connection status
   - Review environment variable configuration

2. **API Endpoints**
   - Test user creation simulation
   - Verify authentication configuration
   - Check demo user availability

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure `DATABASE_URL` is set in `.env.local`
   - Verify your Neon database is running
   - Check connection string format

2. **NextAuth Errors**
   - Ensure `NEXTAUTH_SECRET` is set
   - Verify `NEXTAUTH_URL` matches your development URL
   - Check that demo users are configured in `lib/auth.ts`

3. **Environment Variables Not Loading**
   - Restart your development server
   - Ensure `.env.local` is in the project root
   - Check that variables don't have extra spaces

## 📝 Test Checklist

- [ ] Environment variables configured
- [ ] Development server running
- [ ] Database connection successful
- [ ] Demo accounts working
- [ ] Login/logout flow working
- [ ] Onboarding steps navigating correctly
- [ ] Session persistence working
- [ ] Testing dashboard accessible

## 🔍 Detailed Testing Steps

### Step 1: Environment Setup
1. Copy the environment template above to `.env.local`
2. Add your actual database URL (or use demo mode)
3. Generate a random string for `NEXTAUTH_SECRET`
4. Restart your development server

### Step 2: System Verification
1. Open http://localhost:3000/test-dashboard
2. Check "System Tests" tab - all should be green
3. If any tests fail, check the details for troubleshooting

### Step 3: Authentication Testing
1. In testing dashboard, go to "Authentication" tab
2. Try logging in with both demo accounts
3. Verify the session information appears correctly
4. Test logout functionality

### Step 4: Onboarding Flow
1. Go to http://localhost:3000/onboarding
2. Complete each step of the onboarding process
3. At the authentication step, use demo credentials
4. Verify you can navigate through all steps

### Step 5: Manual Testing
1. Test user creation simulation
2. Verify error handling (try invalid credentials)
3. Check session persistence across page reloads
4. Test navigation while authenticated vs. not authenticated

## 🎯 What Each Test Validates

- **Database Connection**: Verifies Neon database connectivity
- **Authentication Config**: Ensures NextAuth is properly configured
- **Demo Users**: Tests hardcoded user authentication
- **Session Management**: Validates JWT token handling
- **Environment Variables**: Checks required configuration
- **User Creation**: Tests user registration simulation
- **Onboarding Flow**: Validates multi-step user journey

## 📊 Expected Results

When everything is working correctly:
- All system tests should show green/pass status
- Demo login should work immediately
- Session should persist across page navigation
- Onboarding flow should complete without errors
- User creation test should simulate successful account creation

## 🔄 Next Steps

After basic testing is complete:
1. Set up real database connection with Neon
2. Implement real user registration (not just simulation)
3. Add Google OAuth configuration
4. Set up email verification
5. Implement password reset functionality
6. Add user profile management
7. Connect to real challenge creation flow 