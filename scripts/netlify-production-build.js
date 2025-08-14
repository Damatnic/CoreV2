#!/usr/bin/env node

/**
 * Production-ready build script for Netlify deployment
 * This script runs a proper Vite build with fallback options
 * Ensures compatibility with Netlify's build environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to execute commands safely
function safeExec(command, description) {
  try {
    log(`\n${description}...`, 'cyan');
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

// Main build process
async function build() {
  log('\n🚀 Starting Netlify Production Build', 'bright');
  log(`Node version: ${process.version}`, 'yellow');
  log(`NPM version: ${execSync('npm --version').toString().trim()}`, 'yellow');
  
  // Step 1: Clean previous build
  log('\n📦 Step 1: Cleaning previous build...', 'cyan');
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    log('✓ Cleaned dist directory', 'green');
  }
  
  // Step 2: Install dependencies (with clean install for production)
  log('\n📦 Step 2: Installing dependencies...', 'cyan');
  const installSuccess = safeExec(
    'npm ci --prefer-offline --no-audit --no-fund',
    'Installing dependencies'
  );
  
  if (!installSuccess) {
    // Fallback to regular install if ci fails
    log('Falling back to npm install...', 'yellow');
    safeExec('npm install --no-audit --no-fund', 'Installing dependencies (fallback)');
  }
  
  // Step 3: Run Vite build
  log('\n📦 Step 3: Building with Vite...', 'cyan');
  const viteBuildSuccess = safeExec(
    'npx vite build --mode production',
    'Vite production build'
  );
  
  if (!viteBuildSuccess) {
    log('❌ Vite build failed, attempting recovery...', 'red');
    
    // Try to build with simpler configuration
    log('Attempting simplified build...', 'yellow');
    const simpleBuildSuccess = safeExec(
      'npx vite build --mode production --minify false',
      'Vite simplified build'
    );
    
    if (!simpleBuildSuccess) {
      log('❌ Build failed. Please check the error messages above.', 'red');
      process.exit(1);
    }
  }
  
  // Step 4: Generate Service Worker (optional, with fallback)
  log('\n📦 Step 4: Generating Service Worker...', 'cyan');
  
  // Check if workbox config exists
  const workboxConfigPath = path.join(process.cwd(), 'workbox-config.js');
  const workboxEnhancedPath = path.join(process.cwd(), 'workbox-enhanced.js');
  
  let swGenerated = false;
  
  if (fs.existsSync(workboxEnhancedPath)) {
    swGenerated = safeExec(
      'npx workbox-cli generateSW workbox-enhanced.js',
      'Generating enhanced service worker'
    );
  } else if (fs.existsSync(workboxConfigPath)) {
    swGenerated = safeExec(
      'npx workbox-cli generateSW workbox-config.js',
      'Generating service worker'
    );
  }
  
  if (!swGenerated) {
    log('⚠️  Service Worker generation skipped or failed, using fallback...', 'yellow');
    
    // Create a basic service worker as fallback
    const swContent = `
// Basic Service Worker for CoreV2 Mental Health Platform
// Auto-generated fallback version

const CACHE_NAME = 'corev2-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/offline-crisis.html',
  '/crisis-resources.json',
  '/emergency-contacts.json',
  '/offline-coping-strategies.json',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
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

self.addEventListener('fetch', event => {
  // Network first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Cache first strategy for assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});
`;
    
    const swPath = path.join(distDir, 'sw.js');
    fs.writeFileSync(swPath, swContent.trim());
    log('✓ Created fallback service worker', 'green');
  }
  
  // Step 5: Copy critical files
  log('\n📦 Step 5: Copying critical files...', 'cyan');
  const publicDir = path.join(process.cwd(), 'public');
  const criticalFiles = [
    'manifest.json',
    'offline.html',
    'offline-crisis.html',
    'crisis-resources.json',
    'emergency-contacts.json',
    'offline-coping-strategies.json',
    'robots.txt',
    'sitemap.xml',
    'favicon.ico',
    'icon-192.png',
    'icon-512.png',
    'icon.svg'
  ];
  
  let copiedCount = 0;
  criticalFiles.forEach(file => {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(distDir, file);
    
    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
      } catch (error) {
        log(`⚠️  Could not copy ${file}: ${error.message}`, 'yellow');
      }
    }
  });
  
  log(`✓ Copied ${copiedCount} critical files`, 'green');
  
  // Step 6: Verify build output
  log('\n📦 Step 6: Verifying build output...', 'cyan');
  
  const requiredFiles = ['index.html'];
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    log(`❌ Missing required files: ${missingFiles.join(', ')}`, 'red');
    process.exit(1);
  }
  
  // Count output files
  const countFiles = (dir) => {
    let count = 0;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        count += countFiles(filePath);
      } else {
        count++;
      }
    });
    return count;
  };
  
  const totalFiles = countFiles(distDir);
  const distSize = execSync(`du -sh ${distDir} 2>/dev/null || echo "N/A"`).toString().trim();
  
  // Final summary
  log('\n' + '='.repeat(50), 'bright');
  log('✅ Build completed successfully!', 'green');
  log('='.repeat(50), 'bright');
  log(`📁 Output directory: ${distDir}`, 'cyan');
  log(`📊 Total files: ${totalFiles}`, 'cyan');
  log(`💾 Build size: ${distSize}`, 'cyan');
  log(`⏱️  Build time: ${new Date().toLocaleTimeString()}`, 'cyan');
  log('='.repeat(50) + '\n', 'bright');
}

// Run the build
build().catch(error => {
  log(`\n❌ Build failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});