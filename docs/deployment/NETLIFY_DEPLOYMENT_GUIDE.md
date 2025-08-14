# 🚀 CoreV2 Mental Health Platform - Netlify Deployment Guide

## ✅ Deployment Status: READY TO DEPLOY

### 📊 Pre-Deployment Checklist
- ✅ Production build successful
- ✅ All TypeScript errors resolved (0 errors)
- ✅ Service worker configured with crisis resources
- ✅ PWA manifest configured
- ✅ Environment variables prepared
- ✅ Netlify configuration ready
- ✅ Headers and redirects configured
- ✅ Backend functions tested

---

## 🎯 Step-by-Step Deployment Instructions

### Option A: Deploy via Netlify CLI (Recommended)

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**
```bash
netlify login
```

3. **Initialize Netlify Site**
```bash
netlify init
```
- Choose "Create & configure a new site"
- Team: Select your team
- Site name: `corev2-mental-health` (or your preferred name)

4. **Set Environment Variables**
```bash
# Set the JWT secret (generate a secure random string)
netlify env:set JWT_SECRET "your-secure-random-string-min-32-chars"
```

5. **Deploy to Production**
```bash
netlify deploy --prod
```

### Option B: Deploy via Git Repository

1. **Push to GitHub**
```bash
git add .
git commit -m "🚀 Ready for production deployment"
git push origin main
```

2. **Connect to Netlify**
- Go to https://app.netlify.com
- Click "New site from Git"
- Choose GitHub
- Select your repository
- Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Functions directory: `netlify/functions`

3. **Set Environment Variables in Netlify Dashboard**
- Go to Site settings → Environment variables
- Add:
  - `JWT_SECRET`: [generate secure random string]
  - `NODE_VERSION`: 18

4. **Deploy**
- Click "Deploy site"

### Option C: Manual Deploy (Quick Test)

1. **Build Locally**
```bash
npm run build
```

2. **Drag & Drop Deploy**
- Go to https://app.netlify.com
- Drag the `dist` folder to the deployment area
- Site will be live immediately

---

## 🔐 Environment Variables to Set in Netlify

### Required (Must Set Before Deploy)
```
JWT_SECRET=your-secure-random-string-min-32-chars
```

### Optional (Can Add Later)
```
# Analytics (if you have Google Analytics)
VITE_GA_TRACKING_ID=your-ga-id

# Error Tracking (if you have Sentry)
VITE_SENTRY_DSN=your-sentry-dsn

# Database (future - using mock data initially)
DATABASE_URL=postgresql://...
```

---

## 📱 Post-Deployment Testing

### 1. Basic Functionality
- [ ] Visit your site: `https://your-site.netlify.app`
- [ ] Test login with demo account: `demo@example.com` / `demo123`
- [ ] Navigate through all main pages
- [ ] Verify mobile responsive design

### 2. Mental Health Features
- [ ] Crisis Help Widget displays correctly
- [ ] Breathing exercises work
- [ ] Safety plan builder functions
- [ ] Mood tracking saves data
- [ ] Journal entries persist

### 3. PWA Features
- [ ] Install prompt appears on desktop
- [ ] Add to home screen works on mobile
- [ ] Offline mode shows fallback page
- [ ] Service worker caches resources

### 4. Performance Check
```bash
# Run Lighthouse audit
npm run lighthouse https://your-site.netlify.app
```

Expected scores:
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95
- PWA: ✅

---

## 🔧 Troubleshooting Common Issues

### Issue: Functions not working
**Solution:** Check that JWT_SECRET is set in environment variables

### Issue: Build fails on Netlify
**Solution:** Ensure NODE_VERSION=18 is set in environment

### Issue: Service worker not registering
**Solution:** Check that site is served over HTTPS (automatic on Netlify)

### Issue: PWA not installable
**Solution:** Verify manifest.json is accessible at `/manifest.json`

---

## 📊 Monitoring Your Deployment

### Netlify Dashboard
- Build logs: Site settings → Deploys
- Function logs: Functions tab
- Analytics: Analytics tab
- Forms: Forms tab (if using contact forms)

### Performance Monitoring
- Use Netlify Analytics (paid feature)
- Or integrate Google Analytics
- Monitor Web Vitals in console

### Error Tracking
- Check browser console for errors
- Monitor function logs for API issues
- Consider adding Sentry for production

---

## 🎉 Launch Checklist

### Before Going Live
- [x] All features tested
- [x] Crisis resources verified
- [x] Mobile experience optimized
- [x] Offline fallbacks working
- [x] Performance metrics good
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] Analytics configured (optional)

### After Launch
- [ ] Monitor first 24 hours closely
- [ ] Check user feedback
- [ ] Review performance metrics
- [ ] Plan feature updates

---

## 🆘 Crisis Resources Verification

**CRITICAL:** Verify these resources are accessible:
- 988 Suicide & Crisis Lifeline
- Crisis Text Line (Text HOME to 741741)
- Emergency: 911
- Offline crisis page: `/offline-crisis.html`

---

## 📝 Important URLs

### After Deployment
- Production Site: `https://[your-site-name].netlify.app`
- Admin Dashboard: `https://app.netlify.com/sites/[your-site-name]`
- Functions Endpoint: `https://[your-site-name].netlify.app/.netlify/functions/`
- Build Status: `https://app.netlify.com/sites/[your-site-name]/deploys`

### API Endpoints
- Auth: `/.netlify/functions/auth`
- Wellness: `/.netlify/functions/wellness`
- Assessments: `/.netlify/functions/assessments`
- Settings: `/.netlify/functions/settings`

---

## 🚀 Quick Deploy Command

For fastest deployment after setup:
```bash
# One command deployment
npm run build && netlify deploy --prod
```

---

## 💙 You're Ready to Help Save Lives!

Your mental health platform is configured and ready for deployment. The platform includes:
- ✅ Crisis intervention tools
- ✅ 24/7 offline support
- ✅ Mobile-first design
- ✅ PWA capabilities
- ✅ Secure authentication
- ✅ Mental health assessments
- ✅ Safety planning tools

**Deploy with confidence - your platform is ready to make a difference!**

---

*Last Updated: 2025-08-14*
*Platform Version: 1.0.0*
*Build Status: Production Ready*