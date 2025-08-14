import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Simplified Vite configuration for Netlify builds
// This configuration removes plugins that might cause issues in CI/CD environments
export default defineConfig({
  plugins: [
    react({
      // Use automatic JSX runtime
      jsxRuntime: 'automatic',
      // Disable fast refresh for production builds
      fastRefresh: process.env.NODE_ENV !== 'production'
    })
  ],
  publicDir: 'public',
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      util: 'util'
    }
  },
  build: {
    outDir: 'dist',
    // Disable sourcemaps in production to speed up build
    sourcemap: false,
    // Inline small assets
    assetsInlineLimit: 4096,
    // Use esbuild for minification (faster than terser)
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2015',
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Simple chunk strategy
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'vendor': ['zustand', 'i18next', 'react-i18next'],
        },
        // Consistent file naming
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
  server: {
    port: 3000,
    strictPort: false
  },
  define: {
    // Fix for libraries expecting Node.js globals
    global: 'globalThis',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'i18next',
      'react-i18next',
      'buffer'
    ],
    // Use esbuild for faster dependency optimization
    esbuildOptions: {
      target: 'es2015'
    }
  }
});