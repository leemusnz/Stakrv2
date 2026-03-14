# Mobile Testing Quick Start Guide

**Start Here:** Fast-track mobile testing for Stakr v2

---

## 🚀 Quick Automated Tests (5 minutes)

### 1. Run the Mobile Test Script
```bash
# From project root
node scripts/mobile-test.js
```

**What it checks:**
- ✅ Service worker exists and has correct strategies
- ✅ PWA manifest is valid
- ✅ Mobile meta tags present
- ✅ Icons configured correctly

---

### 2. Run Lighthouse Audit
```bash
# Mobile performance audit
npx lighthouse https://stakr.app --preset=mobile --view

# Desktop for comparison
npx lighthouse https://stakr.app --preset=desktop --view
```

**Target Scores (Mobile):**
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- PWA: > 90

---

## 📱 Physical Device Testing (15-30 minutes)

### iPhone (iOS Safari) - **CRITICAL**

**Test Service Worker Fix:**
1. Open Safari on iPhone
2. Navigate to `https://stakr.app`
3. ✅ **First Load:** App loads without errors
4. ✅ Pull to refresh or navigate away and back
5. ✅ **Second Load:** Should load instantly from cache
6. ✅ **No ERR_FAILED errors in console**
7. Wait 5+ minutes for update check
8. ✅ Update banner should appear if there's a new version

**Test PWA Installation:**
1. Safari → Share button (bottom center)
2. Scroll down → "Add to Home Screen"
3. ✅ See Stakr icon and name
4. Tap "Add"
5. ✅ Icon appears on home screen
6. Tap icon to open
7. ✅ App opens without Safari UI (standalone mode)
8. ✅ Splash screen shows briefly
9. ✅ App works normally

**Test Responsive Design:**
1. Navigate through key pages:
   - Alpha Gate
   - Sign In
   - Onboarding
   - Dashboard
   - Discover
   - Profile
   
2. Check for:
   - ✅ No horizontal scroll
   - ✅ All text readable
   - ✅ Buttons easily tappable
   - ✅ Forms usable with mobile keyboard
   - ✅ Glass morphism looks good (not too blurry)

**Screenshot Issues:**
- Take screenshots of any layout problems
- Note specific pages/viewports where issues occur

---

### Android (Chrome) - **IMPORTANT**

**Test Service Worker Fix:**
1. Open Chrome on Android
2. Navigate to `https://stakr.app`
3. ✅ First load works
4. ✅ Subsequent loads use cache
5. ✅ No errors in DevTools (chrome://inspect)

**Test PWA Installation:**
1. Chrome → Menu (⋮) → "Install app" or "Add to Home screen"
2. ✅ Install prompt appears
3. ✅ App installs successfully
4. ✅ Opens in standalone mode
5. ✅ Works as expected

---

## 🔍 DevTools Inspection (Desktop Chrome/Safari)

### Check Service Worker Status

**Chrome DevTools:**
1. Open `https://stakr.app`
2. F12 → Application tab → Service Workers
3. ✅ Service worker registered and activated
4. ✅ "Update on reload" checkbox (for testing)
5. Check cache:
   - Application → Cache Storage
   - ✅ See `stakr-v2.0.0-[timestamp]` caches
   - ✅ Assets cached correctly

**Safari Web Inspector:**
1. Open Safari with Developer menu enabled
2. Develop → Show Web Inspector
3. Storage tab → Service Workers
4. ✅ Service worker registered

---

## 🐛 Common Issues to Check

### Service Worker
- [ ] ERR_FAILED errors on reload? → Check network-first strategy
- [ ] Stale content? → Check cache versioning (timestamp)
- [ ] Update not detected? → Check 5-minute interval timer

### PWA
- [ ] Install prompt not showing? → Check manifest.json validity
- [ ] App icon wrong? → Check icon paths and sizes
- [ ] Won't open standalone? → Check `display: "standalone"` in manifest

### Responsive Design
- [ ] Horizontal scroll? → Check container widths
- [ ] Text too small? → Check font sizes (min 16px)
- [ ] Buttons too small? → Check touch targets (min 48px)
- [ ] Overlapping content? → Check z-index and positioning

### Performance
- [ ] Slow load? → Check bundle size, images
- [ ] Janky animations? → Check will-change, transform usage
- [ ] Blur lag? → Backdrop-filter performance on older devices

---

## 📊 Testing Checklist

### Critical Path (Must Test)
- [ ] Alpha gate loads
- [ ] Sign in works
- [ ] Onboarding completes
- [ ] Dashboard displays
- [ ] Service worker registers
- [ ] PWA installs on iOS
- [ ] PWA installs on Android
- [ ] No ERR_FAILED errors

### Important (Should Test)
- [ ] Discover page responsive
- [ ] Profile page loads
- [ ] Settings accessible
- [ ] Forms work with mobile keyboard
- [ ] Touch interactions smooth
- [ ] Offline mode works

### Nice to Have
- [ ] All pages checked at 375px viewport
- [ ] Tested on iPad
- [ ] Tested on older iOS (14, 15)
- [ ] Battery consumption reasonable

---

## 📸 Document Issues

When you find a bug:
1. **Screenshot it** (especially on mobile)
2. **Note the device:** iPhone 14, iOS 17.2, Safari
3. **Note the viewport size:** 375px x 667px
4. **Describe the issue:** "Sign in button partially obscured by keyboard"
5. **Record in GitHub Issues** or send to development team

---

## ✅ Success Criteria

**PASS if:**
- ✅ No ERR_FAILED errors on mobile
- ✅ PWA installs on iPhone Safari
- ✅ All critical pages usable at 375px width
- ✅ Touch targets meet accessibility standards
- ✅ Service worker update mechanism works

**Minor issues okay:**
- Minor layout quirks on specific devices
- Performance slightly below target on low-end devices
- Non-critical features need keyboard adjustment

---

## 🆘 Getting Help

**If service worker issues:**
1. Check browser console for errors
2. Clear cache: DevTools → Application → Clear storage
3. Unregister service worker and retry
4. Check `/sw.js` file loads correctly

**If PWA won't install:**
1. Verify HTTPS (required for PWA)
2. Check manifest.json is valid JSON
3. Verify icons exist and are correct size
4. Try in Private/Incognito mode

**If performance issues:**
1. Run Lighthouse to identify bottlenecks
2. Check Network tab for slow requests
3. Test on WiFi vs 4G
4. Compare to working reference site

---

**Last Updated:** 2026-03-14  
**Next Review:** After physical device testing complete
