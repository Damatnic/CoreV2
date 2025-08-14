<todos title="Critical Site Errors - ACTUAL FIX NEEDED" rule="Review steps frequently throughout the conversation and DO NOT stop between steps unless they explicitly require it.">
- [x] fix-environment-validation-colors: Fix PWA theme color validation - must be 6-digit hex format 🔴
  _Fixed PWA theme colors to use uppercase hex format #667EEA and #FFFFFF for proper validation_
- [x] fix-auth0-client-secret-length: Fix AUTH0_CLIENT_SECRET length validation - appears too short 🔴
  _Removed AUTH0_CLIENT_SECRET and VITE_AUTH0_CLIENT_SECRET from client-side configuration as they should not be exposed to the browser. Used proper SPA (Single Page Application) setup without client secret._
- [x] fix-notification-provider-order: Fix NotificationProvider ordering in App.tsx - must wrap AuthProvider 🔴
  _Moved NotificationProvider outside AuthProvider in App.tsx to fix useNotification hook context error_
- [x] fix-api-port-connection: Fix API port 3847 connection refused errors 🔴
  _Updated all API endpoints from localhost:3847 to localhost:3000 to match actual server port_
</todos>

<!-- Auto-generated todo section -->
<!-- Add your custom Copilot instructions below -->
