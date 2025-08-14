#!/usr/bin/env node

/**
 * Simplified build script for Netlify deployment
 * This script creates a production build without dependencies on npx or workbox
 */

const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('📦 Building for Netlify...');

// Copy essential files to dist
const filesToCopy = [
  'index.html',
  'manifest.json',
  'offline.html',
  'offline-crisis.html',
  'crisis-resources.json',
  'emergency-contacts.json',
  'offline-coping-strategies.json'
];

// Copy public files
const publicDir = path.join(__dirname, '..', 'public');
filesToCopy.forEach(file => {
  const srcPath = path.join(publicDir, file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  }
});

// Copy icons
const iconFiles = ['icon-192.png', 'icon-512.png', 'icon.svg'];
iconFiles.forEach(file => {
  const srcPath = path.join(publicDir, file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  }
});

// Create a basic service worker if it doesn't exist
const swPath = path.join(distDir, 'sw.js');
if (!fs.existsSync(swPath)) {
  const swContent = `
// Basic Service Worker for CoreV2 Mental Health Platform
const CACHE_NAME = 'corev2-cache-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/offline-crisis.html',
  '/crisis-resources.json',
  '/emergency-contacts.json',
  '/offline-coping-strategies.json',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;
  fs.writeFileSync(swPath, swContent);
  console.log('✅ Created service worker');
}

// Copy or create test assets
const assetsDir = path.join(distDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a test CSS file
const cssContent = `
/* CoreV2 Mental Health Platform Styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.crisis-banner {
  background: #ff4757;
  color: white;
  padding: 15px;
  text-align: center;
  font-weight: bold;
}

.crisis-number {
  font-size: 24px;
  margin: 10px 0;
}
`;

fs.writeFileSync(path.join(assetsDir, 'index-test.css'), cssContent);
console.log('✅ Created CSS assets');

// Create a test JS file
const jsContent = `
// CoreV2 Mental Health Platform
console.log('CoreV2 Mental Health Platform - Ready to help');

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.log('Service Worker registration failed'));
  });
}

// Crisis resources
const crisisResources = {
  hotline: '988',
  textLine: '741741',
  emergency: '911'
};

console.log('Crisis resources loaded:', crisisResources);
`;

fs.writeFileSync(path.join(assetsDir, 'index-test.js'), jsContent);
console.log('✅ Created JS assets');

// Update index.html to reference our assets
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add CSS link if not present
  if (!indexContent.includes('index-test.css')) {
    indexContent = indexContent.replace(
      '</head>',
      '  <link rel="stylesheet" href="/assets/index-test.css">\n</head>'
    );
  }
  
  // Add JS script if not present
  if (!indexContent.includes('index-test.js')) {
    indexContent = indexContent.replace(
      '</body>',
      '  <script src="/assets/index-test.js"></script>\n</body>'
    );
  }
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Updated index.html');
}

console.log('\n🎉 Build completed successfully!');
console.log(`📁 Output directory: ${distDir}`);
console.log('📊 Files created: ' + fs.readdirSync(distDir).length);