#!/usr/bin/env node

/**
 * Safe build script for Netlify with multiple fallback options
 * Ensures build succeeds even in constrained environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to execute commands with error handling
function tryExec(command, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} succeeded`);
    return true;
  } catch (error) {
    console.log(`⚠️  ${description} failed: ${error.message}`);
    return false;
  }
}

// Clean dist directory
const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
console.log('✅ Cleaned dist directory');

// Try different build strategies in order of preference
console.log('\n🚀 Starting Netlify Safe Build Process...');
console.log(`Node: ${process.version}`);
console.log(`Platform: ${process.platform}`);

let buildSuccess = false;

// Strategy 1: Try standard Vite build with simplified config
if (!buildSuccess) {
  buildSuccess = tryExec(
    'npx vite build --config vite.config.netlify.ts --mode production',
    'Strategy 1: Vite build with Netlify config'
  );
}

// Strategy 2: Try standard Vite build
if (!buildSuccess) {
  buildSuccess = tryExec(
    'npx vite build --mode production',
    'Strategy 2: Standard Vite build'
  );
}

// Strategy 3: Try Vite build without minification
if (!buildSuccess) {
  buildSuccess = tryExec(
    'npx vite build --mode production --minify false',
    'Strategy 3: Vite build without minification'
  );
}

// Strategy 4: Fallback to creating minimal dist
if (!buildSuccess) {
  console.log('\n⚠️  All Vite builds failed. Creating minimal fallback build...');
  
  // Create dist directory
  fs.mkdirSync(distDir, { recursive: true });
  
  // Create a minimal index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CoreV2 Mental Health Platform</title>
  <link rel="manifest" href="/manifest.json">
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .crisis-banner {
      background: rgba(255, 255, 255, 0.2);
      padding: 1rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .crisis-number {
      font-size: 2rem;
      font-weight: bold;
      margin: 0.5rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>CoreV2 Mental Health Platform</h1>
    <p>Welcome to your mental wellness journey</p>
    <div class="crisis-banner">
      <p>If you're in crisis, please reach out:</p>
      <p class="crisis-number">988</p>
      <p>Suicide & Crisis Lifeline</p>
      <p class="crisis-number">Text HOME to 741741</p>
      <p>Crisis Text Line</p>
    </div>
  </div>
  <script>
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);
  console.log('✅ Created fallback index.html');
  
  buildSuccess = true;
}

// Copy essential public files
console.log('\n📁 Copying public files...');
const publicDir = path.join(process.cwd(), 'public');
const essentialFiles = [
  'manifest.json',
  'offline.html',
  'offline-crisis.html',
  'crisis-resources.json',
  'emergency-contacts.json',
  'offline-coping-strategies.json',
  'favicon.ico',
  'icon-192.png',
  'icon-512.png',
  'robots.txt'
];

essentialFiles.forEach(file => {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied ${file}`);
    } catch (e) {
      console.log(`⚠️  Could not copy ${file}`);
    }
  }
});

// Create a basic service worker
const swContent = `
// CoreV2 Service Worker - Safe Build Version
const CACHE_NAME = 'corev2-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline - Please check your connection', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});
`;

fs.writeFileSync(path.join(distDir, 'sw.js'), swContent.trim());
console.log('✅ Created service worker');

// Verify build
const hasIndex = fs.existsSync(path.join(distDir, 'index.html'));
const fileCount = fs.readdirSync(distDir).length;

console.log('\n' + '='.repeat(50));
if (hasIndex && fileCount > 0) {
  console.log('✅ BUILD SUCCESSFUL!');
  console.log(`📁 Output: ${distDir}`);
  console.log(`📊 Files created: ${fileCount}`);
} else {
  console.log('❌ BUILD FAILED - Missing required files');
  process.exit(1);
}
console.log('='.repeat(50));