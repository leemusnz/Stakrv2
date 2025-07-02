# 🔒 Alpha Access Setup Guide

Your Stakr app is now protected with a simple password gate that blocks **all public access** to `stakr.app` during alpha testing.

## 🚀 Quick Setup

### **1. Set Your Alpha Password**

Add this to your `.env.local` (local) and Vercel environment variables (production):

```env
ALPHA_ACCESS_PASSWORD=your-secure-alpha-password-here
```

**Default password (if not set):** `stakr-alpha-2025`

### **2. Deploy the Changes**

```bash
git add .
git commit -m "Add alpha access gate to protect app during testing"
git push
```

### **3. Update Vercel Environment Variable**

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add: `ALPHA_ACCESS_PASSWORD` = `your-secure-password`
5. Redeploy your app

## 🎯 How It Works

### **Complete App Protection**
- 🚫 **Public cannot access ANY part** of stakr.app
- 🔒 **Password gate appears** for all visitors
- ✅ **Access granted** for 7 days after entering password
- 🔄 **Automatic redirect** to gate if access expires

### **What Users See**
1. **Visit stakr.app** → Redirected to password gate
2. **Enter access code** → Gain full app access
3. **Access expires** → Redirected back to gate

## 📱 User Experience

### **Alpha Gate Page**
- Professional "Private Alpha Testing" message
- Password input with show/hide toggle
- Clear instructions for getting access
- Stakr branding and styling

### **Error Handling**
- Invalid password: "Invalid access code. Please check your code and try again."
- Network errors: "Connection error. Please try again."
- Missing password: "Access code required"

## 🔧 Managing Access

### **Change the Password**
1. Update `ALPHA_ACCESS_PASSWORD` in Vercel
2. Redeploy the app
3. Share new password with your testers

### **Temporary Disable Gate (for testing)**
1. Remove `ALPHA_ACCESS_PASSWORD` from environment
2. App will use default: `stakr-alpha-2025`
3. Or set to an easy value like `test123`

### **Remove Alpha Gate Completely**
When ready for public launch:
1. Delete `middleware.ts`
2. Delete `app/alpha-gate/page.tsx`
3. Delete `app/api/alpha-access/route.ts`
4. Deploy changes

## 🛡️ Security Features

### **Secure Cookie Management**
- 7-day expiration
- Secure & HttpOnly flags
- SameSite strict policy

### **Protected Endpoints**
- All pages redirect to gate
- API endpoints return 401 if no access
- Static assets allowed (images, CSS, JS)

### **No Backend Required**
- Simple password check
- No database needed
- Lightweight and fast

## 🧪 Testing Your Setup

### **1. Test the Gate**
- Visit `https://stakr.app` in incognito mode
- Should see the alpha gate page
- Enter your password to gain access

### **2. Test API Protection**
- Try accessing `https://stakr.app/api/any-endpoint` without access
- Should return 401 error

### **3. Test Access Expiry**
- Clear cookies and revisit
- Should be redirected to gate again

## 👥 Sharing Access

### **Give Access to Testers**
Simply share the alpha password:

> "Hi! Stakr is in private alpha testing. 
> 
> Visit: https://stakr.app
> Access Code: `your-password-here`
> 
> This will give you full access to test the app. Let me know what you think!"

### **Revoking Access**
1. Change the `ALPHA_ACCESS_PASSWORD`
2. All existing sessions will expire within 7 days
3. Users will need the new password

## 🔍 Monitoring & Analytics

### **Check Access Logs**
- Monitor Vercel function logs
- See failed password attempts
- Track successful access grants

### **User Feedback**
- Ask testers about the gate experience
- Ensure password sharing is working
- Monitor for any access issues

## ⚡ Quick Commands

### **Change Password**
```bash
# In Vercel Dashboard
ALPHA_ACCESS_PASSWORD=new-secure-password-2025
```

### **Check Current Setup**
```bash
# Visit this endpoint to test
https://stakr.app/api/alpha-access
# Should return 400: "Access code required"
```

### **Emergency Access**
If locked out, you can:
1. Use Vercel CLI to update environment variable
2. Or deploy with a new default password in the code

---

## 🎉 You're All Set!

Your Stakr app is now completely protected during alpha testing. Only people with the password can access **any part** of the application.

**Perfect for:** Alpha testing, private demos, stakeholder previews, team testing

**Security Level:** Medium (suitable for private testing, not production secrets) 