# 🚀 Deploy AstralCore to Netlify - Quick Guide

## ✅ What's Ready
- ✅ API key secured in `.env.production`
- ✅ Build tested and working
- ✅ `.gitignore` created to protect secrets
- ✅ Deployment scripts created

## 🔐 Your API Key is Secured
Your Google API key (`AIzaSyAEpBsYR4n54DmT1h2vm8ZO_448x5s6uMs`) has been saved securely in `.env.production` and will NOT be committed to GitHub.

## 📋 Deploy Now - 3 Simple Steps

### Step 1: Link to Netlify
Run this command and follow the prompts:
```bash
npx netlify link
```
Choose: **"Use current git remote origin (https://github.com/Damatnic/C)"**

### Step 2: Deploy Your Site
Run the deployment script:
```bash
# On Windows:
deploy.bat

# Or manually:
npx netlify deploy --prod --dir dist
```

### Step 3: Set Environment Variables in Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site Settings → Environment Variables**
4. Add these variables:

```
VITE_API_URL = /.netlify/functions
VITE_GOOGLE_API_KEY = AIzaSyAEpBsYR4n54DmT1h2vm8ZO_448x5s6uMs
NODE_ENV = production
```

## 🌐 Your Site URLs
- **Live Site**: https://astral-core-react.netlify.app
- **Netlify Dashboard**: https://app.netlify.com

## 🔄 Alternative: One-Command Deploy
If you're already linked to Netlify:
```bash
npm run build && npx netlify deploy --prod --dir dist
```

## ⚠️ Important Security Notes
- Never commit `.env.production` to GitHub
- Keep your API keys secret
- The `.gitignore` file now protects your environment files

## 📱 After Deployment
Your site will have:
- ✅ PWA support (installable app)
- ✅ Offline crisis resources
- ✅ Service worker for caching
- ✅ Mobile-optimized interface
- ✅ Google AI integration (with your API key)

---

**Ready to go live?** Run `deploy.bat` now!