# CoreV2 Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Code Readiness
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Production build successful (`npm run build`)
- [ ] Service worker verified (`npm run verify:sw`)
- [ ] Bundle size optimized (<500KB initial)

### ✅ Environment Setup
- [ ] All environment variables configured
- [ ] Auth0 application configured
- [ ] Database (Neon) provisioned
- [ ] API endpoints tested
- [ ] SSL certificates ready
- [ ] Domain/subdomain configured

### ✅ Security Review
- [ ] No exposed secrets in code
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Rate limiting configured
- [ ] Input validation active

## 🚀 Netlify Deployment

### Initial Setup

1. **Create Netlify Account**
   ```
   https://app.netlify.com/signup
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

3. **Link Repository**
   ```bash
   netlify init
   # Or connect via GitHub in Netlify dashboard
   ```

### Configuration

1. **netlify.toml Configuration**
   ```toml
   [build]
     command = "npm run build"
     functions = "netlify/functions"
     publish = "dist"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       X-XSS-Protection = "1; mode=block"
       Referrer-Policy = "strict-origin-when-cross-origin"
   ```

2. **Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add all variables from ENVIRONMENT_VARIABLES_GUIDE.md
   - Set different values for production context

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### Deployment Methods

#### Method 1: Git Integration (Recommended)
```bash
# Push to main branch
git add .
git commit -m "Deploy to production"
git push origin main
# Netlify auto-deploys on push
```

#### Method 2: CLI Deployment
```bash
# Build locally
npm run build

# Deploy to draft URL
netlify deploy

# Deploy to production
netlify deploy --prod
```

#### Method 3: Drag & Drop
1. Build locally: `npm run build`
2. Go to Netlify dashboard
3. Drag `dist` folder to deployment area

## 🗄️ Database Setup (Neon)

1. **Create Neon Account**
   ```
   https://neon.tech
   ```

2. **Create Database**
   - Choose region closest to users
   - Select PostgreSQL version 15+
   - Enable connection pooling

3. **Run Migrations**
   ```sql
   -- Run schema from netlify/functions/db-init.sql
   ```

4. **Configure Connection**
   ```env
   DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
   ```

## 🔐 Auth0 Configuration

1. **Create Application**
   - Type: Single Page Application
   - Technology: React

2. **Configure Settings**
   ```
   Allowed Callback URLs: https://yourdomain.com
   Allowed Logout URLs: https://yourdomain.com
   Allowed Web Origins: https://yourdomain.com
   ```

3. **Enable Connections**
   - Username-Password-Authentication
   - Social connections (Google, etc.)

4. **Set Environment Variables**
   ```env
   VITE_AUTH0_DOMAIN=your-tenant.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   VITE_AUTH0_AUDIENCE=https://your-api
   ```

## 📊 Monitoring Setup

### Sentry Error Tracking
```javascript
// Already configured in src/services/errorTracking.ts
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production
```

### Analytics
```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Performance Monitoring
- Netlify Analytics (built-in)
- Lighthouse CI integration
- Core Web Vitals tracking

## 🔄 Continuous Deployment

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🎯 Post-Deployment

### Verification Steps
1. **Functional Testing**
   - [ ] Homepage loads
   - [ ] Authentication works
   - [ ] Crisis detection active
   - [ ] API endpoints respond
   - [ ] Offline mode works

2. **Performance Testing**
   ```bash
   # Run Lighthouse
   npx lighthouse https://yourdomain.com
   
   # Check bundle size
   npx bundle-analyzer
   ```

3. **Security Testing**
   - [ ] SSL certificate valid
   - [ ] Headers properly set
   - [ ] No console errors
   - [ ] No exposed secrets

### Monitoring
- Set up alerts in Sentry
- Configure uptime monitoring
- Review Netlify Analytics
- Monitor Core Web Vitals

## 🚨 Rollback Procedure

### Netlify Rollback
```bash
# List deployments
netlify deploy --list

# Rollback to previous
netlify rollback

# Or use dashboard to restore previous deploy
```

### Database Rollback
```sql
-- Keep migration rollback scripts ready
-- Example: rollback-v1.0.0.sql
```

## 📝 Deployment Checklist

### Before Deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Documentation updated

### During Deployment
- [ ] Monitor deployment logs
- [ ] Check build output
- [ ] Verify environment variables
- [ ] Test critical paths immediately

### After Deployment
- [ ] Smoke tests passed
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Announce deployment complete
- [ ] Update status page

## 🆘 Troubleshooting

### Build Failures
```bash
# Clear cache and retry
netlify build --clear-cache

# Check Node version
node --version # Should be 18+

# Verify dependencies
npm ci
```

### Runtime Errors
- Check environment variables
- Review Sentry for errors
- Check browser console
- Review Netlify function logs

### Performance Issues
- Analyze bundle size
- Check network tab
- Review caching headers
- Optimize images

## 📞 Support Contacts

- **DevOps Team**: devops@yourcompany.com
- **Netlify Support**: https://www.netlify.com/support/
- **Auth0 Support**: https://auth0.com/support
- **Neon Support**: https://neon.tech/support

## 📚 Additional Resources

- [Netlify Docs](https://docs.netlify.com)
- [Auth0 Docs](https://auth0.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Project Documentation](./docs)

---

*Last Updated: 2025-08-12*
*Version: 1.0.0*