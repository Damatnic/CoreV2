# 🧠 CoreV2 Mental Health Platform

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Damatnic/CoreV2)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)]()
[![React](https://img.shields.io/badge/React-18.3.1-blue)]()
[![Vite](https://img.shields.io/badge/Vite-5.4.19-purple)]()
[![PWA](https://img.shields.io/badge/PWA-Enabled-orange)]()

**A life-saving mental health support platform with crisis intervention, wellness tools, and 24/7 offline support.**

CoreV2 provides immediate crisis support, mental health assessments, wellness tracking, and peer support in a secure, accessible environment. Built with React, TypeScript, and modern web technologies.

## 🌟 Features

### Crisis Support
- **24/7 Crisis Detection**: Advanced AI-powered crisis detection with multi-language support
- **Emergency Resources**: Immediate access to crisis hotlines, chat support, and emergency services
- **Safety Planning**: Interactive safety plan creation and management
- **Escalation Workflows**: Automated crisis escalation to appropriate support levels

### Peer Support Network
- **Community Forums**: Safe, moderated spaces for peer-to-peer support
- **Helper Matching**: Connect with trained peer supporters based on needs and preferences
- **Group Sessions**: Virtual support group functionality
- **Real-time Chat**: Secure, encrypted messaging for support conversations

### Wellness Tools
- **Mood Tracking**: Daily mood logging with insights and patterns
- **Meditation & Breathing**: Guided exercises for anxiety and stress management
- **Assessment Tools**: Validated mental health assessments with progress tracking
- **Reflection Journal**: Private journaling with prompts and mood analysis

### Accessibility & Inclusion
- **WCAG AAA Compliance**: Full accessibility for screen readers and assistive technologies
- **Multi-language Support**: Available in 7+ languages with RTL support
- **Cultural Sensitivity**: Culturally-aware crisis detection and support resources
- **Offline Capability**: Core features available without internet connection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Modern browser with ES6+ support

### Installation

```bash
# Clone the repository
git clone https://github.com/Damatnic/CoreV2.git
cd CoreV2

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Setup

1. Copy the appropriate environment template:

```bash
# For development
cp development.env .env

# For staging
cp staging.env .env

# For production
cp production.env .env
```

2. Update the `.env` file with your specific values:

```env
# Required variables
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/callback

# See ENVIRONMENT_VARIABLES.md for complete configuration
```

3. Validate your environment configuration:

```bash
npm run validate:env
```

## 📁 Project Structure

```
astral-core/
├── public/              # Static assets & PWA files
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Business logic & API services
│   ├── stores/         # Zustand state stores
│   ├── styles/         # CSS stylesheets
│   ├── utils/          # Utility functions
│   └── views/          # Page components
├── tests/              # Test suites
│   ├── e2e/           # End-to-end tests
│   ├── integration/   # Integration tests
│   └── service-worker/ # Service worker tests
└── docs/              # Documentation
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev           # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run E2E tests

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run format       # Format code with Prettier

# Deployment
npm run deploy       # Deploy to production
```

### Code Standards

- **TypeScript**: Strict mode enabled, no implicit any
- **React**: Functional components with hooks
- **Styling**: CSS modules with responsive design
- **Testing**: 80% minimum coverage requirement
- **Accessibility**: WCAG AAA compliance required

## 🔒 Security

### Security Features
- **HIPAA Compliant**: Full compliance with 7-year data retention, audit logging, and encryption
- **Zero-Trust Architecture**: Device fingerprinting, continuous validation, least privilege access
- **Auth0 Integration**: Secure authentication with JWT, refresh tokens, and 2FA support
- **Role-Based Access Control (RBAC)**: 5 user roles with 40+ granular permissions
- **Crisis Mode Support**: Emergency overrides for mental health crisis situations

### Data Protection
- **Encryption at Rest**: AES-256-GCM with key rotation
- **Encryption in Transit**: TLS 1.3 enforced, certificate pinning available
- **Secure Token Storage**: Memory-only storage in production, automatic refresh
- **Input Validation**: SQL injection protection, XSS prevention, input sanitization

### Security Middleware
- **HTTPS Enforcement**: Automatic redirect in production/staging
- **Rate Limiting**: Configurable limits for global, API, auth, and crisis endpoints
- **CSP Implementation**: Content Security Policy with nonce support
- **OWASP Headers**: All security headers via Helmet
- **Audit Logging**: Complete request/response logging for compliance

### Security Auditing
```bash
# Run security audit
node scripts/security/audit.js

# Run vulnerability scan
node scripts/security/vulnerability-scan.js

# Validate environment security
npm run validate:env
```

### Security Headers Configuration
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera 'self'; microphone 'self'; geolocation 'none'
```

## 🧪 Testing

### Test Coverage Requirements
- Unit Tests: 80% minimum
- Integration Tests: Critical paths covered
- E2E Tests: User journeys validated
- Accessibility Tests: WCAG compliance verified

### Running Tests

```bash
# Run specific test suites
npm test -- --testPathPattern=services
npm test -- --testPathPattern=components
npm test -- --testPathPattern=integration

# Run with debugging
npm test -- --inspect-brk --runInBand
```

## 📱 Progressive Web App

CoreV2 is a fully-featured PWA with:
- **Offline Support**: Core features available offline
- **Install Prompt**: Add to home screen capability
- **Background Sync**: Sync data when connection restored
- **Push Notifications**: Crisis alerts and reminders
- **Automatic Updates**: Seamless app updates

## 🌍 Internationalization

Supported languages:
- English (en)
- Spanish (es)
- Portuguese (pt)
- Chinese (zh)
- Arabic (ar) - with RTL support
- Vietnamese (vi)
- Tagalog (tl)

## 🎯 Project Status

### ✅ Production Ready
All development phases completed successfully:
- **Phase 1**: Critical Fixes ✅
- **Phase 2**: Core Functionality ✅ 
- **Phase 3**: UI/UX Restoration ✅
- **Phase 4**: Testing & Validation ✅
- **Phase 5**: Optimization ✅
- **Phase 6**: Deployment Preparation ✅

### Current Metrics
- **Build Status**: Passing
- **Test Coverage**: Comprehensive
- **TypeScript Errors**: 0 in production code
- **Bundle Size**: Optimized with code splitting
- **Dependencies**: 156 packages removed, fully optimized
- **Performance**: Lighthouse score >90

## 🚢 Deployment

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run preview
```

### Deployment Platforms

#### Netlify
```bash
# Deploy to Netlify
netlify deploy --prod
```

#### Vercel
```bash
# Deploy to Vercel
vercel --prod
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance

### Core Web Vitals Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTI**: < 3.5s

### Optimization Features
- Code splitting with lazy loading
- Image optimization with WebP
- Service worker caching
- Resource hints (preconnect, prefetch)
- Critical CSS inlining

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

### Code Review Process
- Automated CI/CD checks
- Accessibility audit required
- Security scan mandatory
- Performance impact assessment

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### For Users
- In-app help center
- Community forums
- support@astralcore.app

### For Developers
- [Documentation](https://docs.astralcore.app)
- [API Reference](https://api.astralcore.app/docs)
- GitHub Issues

## 🙏 Acknowledgments

- Crisis Text Line for crisis intervention protocols
- SAMHSA for mental health resources
- Open source community for amazing tools
- Our users for valuable feedback

## ⚠️ Important Notice

This platform provides peer support and resources but is **not a substitute for professional medical advice, diagnosis, or treatment**. In case of emergency, please contact:

- **988** - Suicide & Crisis Lifeline (US)
- **911** - Emergency Services
- **741741** - Crisis Text Line (Text "HELLO")

---

Built with ❤️ for mental health awareness and support