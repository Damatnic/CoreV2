# 🚀 DEPLOY NOW - Quick Deployment Commands

## Option 1: Deploy with Existing Build (FASTEST - 2 minutes)

Since your build is already complete, you can deploy immediately:

```bash
# Deploy the existing build to Netlify
npx netlify deploy --prod --dir=dist
```

When prompted:
1. Choose "Create & configure a new site"
2. Team: Select "Astral Productions"
3. Site name: Enter `corev2-mental-health` (or your preferred name)

Then set the JWT secret:
```bash
npx netlify env:set JWT_SECRET "generated-secure-random-32-char-string-abc123xyz"
```

Your site will be live at: `https://corev2-mental-health.netlify.app`

---

## Option 2: Manual Drag & Drop (EASIEST - 1 minute)

1. Open https://app.netlify.com in your browser
2. Click "Add new site" → "Deploy manually"
3. Drag the `dist` folder from `C:\Users\damat\_REPOS\CoreV2\dist` to the browser
4. Your site will be live immediately!
5. Go to Site settings → Environment variables
6. Add: `JWT_SECRET` = `your-secure-32-char-string`

---

## Option 3: Full Deployment with Fresh Build

```bash
# 1. Clean and rebuild
npm run clean
npm run build

# 2. Create new Netlify site
npx netlify sites:create --name corev2-mental-health

# 3. Link to site
npx netlify link

# 4. Set environment variable
npx netlify env:set JWT_SECRET "your-secure-32-char-string-minimum-32-chars"

# 5. Deploy
npx netlify deploy --prod --dir=dist
```

---

## 🔐 Generate a Secure JWT Secret

Use one of these methods to generate a secure JWT secret:

### PowerShell (Windows):
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Online Generator:
Visit: https://randomkeygen.com/ (use a 256-bit key)

---

## ✅ Post-Deployment Checklist

After deployment, verify:

1. **Visit your site**: `https://[your-site-name].netlify.app`
2. **Test login**: Use demo@example.com / demo123
3. **Check crisis resources**: Verify 988 hotline is displayed
4. **Test PWA**: Try "Install app" in browser
5. **Mobile check**: Open on phone and test responsive design
6. **Offline test**: Go offline and verify fallback page

---

## 🆘 If Something Goes Wrong

### Build fails on Netlify:
- Check that Node version is set to 18+ in Netlify settings
- Verify all dependencies are in package.json

### Functions not working:
- Ensure JWT_SECRET is set in environment variables
- Check function logs in Netlify dashboard

### Site not loading:
- Clear browser cache
- Check browser console for errors
- Verify service worker is registered

---

## 📞 Crisis Resources Must Work

**CRITICAL**: After deployment, immediately verify:
- 988 Suicide & Crisis Lifeline is visible
- Crisis Text Line info is displayed
- Emergency resources load offline

---

## 🎉 You're Ready!

Your mental health platform is built and ready to deploy. Choose any option above and your site will be live in minutes, ready to help people in crisis.

**Every minute counts when someone needs help. Deploy now! 💙**