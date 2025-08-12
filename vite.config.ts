import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react({
        fastRefresh: true,
        babel: {
          plugins: isProduction ? [
            ['@babel/plugin-transform-react-constant-elements'],
            ['@babel/plugin-transform-react-inline-elements'],
          ] : [],
        },
      }),
      splitVendorChunkPlugin(),
      // Compression plugins for production
      isProduction && viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
      }),
      isProduction && viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      // PWA support
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'Astral Core Mental Health',
          short_name: 'Astral Core',
          theme_color: '#4A90E2',
          background_color: '#ffffff',
          display: 'standalone',
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      }),
      // Legacy browser support
      legacy({
        targets: ['defaults', 'not IE 11'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      }),
      // Bundle visualizer (only in analyze mode)
      process.env.ANALYZE === 'true' && visualizer({
        open: true,
        filename: 'dist/bundle-stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    publicDir: 'public',
    resolve: {
      alias: {
        buffer: 'buffer',
        crypto: 'crypto-js',
        stream: 'stream-browserify',
        util: 'util'
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction, // No sourcemaps in production to reduce size
      assetsInlineLimit: 4096, // Inline small assets
      cssCodeSplit: true, // Split CSS for better caching
      manifest: false,
      minify: isProduction ? 'terser' : false, // Aggressive minification with terser
      target: 'es2015', // Support older browsers while maintaining performance
      rollupOptions: {
        // Exclude video files from bundling completely
        external: (id) => {
          return /\.(mp4|webm|mov|avi)$/.test(id);
        },
        output: {
          // Optimize chunk sizes for mobile
          manualChunks: (id) => {
            // Vendor chunk for node_modules
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // State management
              if (id.includes('zustand') || id.includes('immer')) {
                return 'state-vendor';
              }
              // UI libraries
              if (id.includes('@mui') || id.includes('@emotion') || id.includes('styled-components')) {
                return 'ui-vendor';
              }
              // Utilities
              if (id.includes('lodash') || id.includes('date-fns') || id.includes('axios')) {
                return 'utils-vendor';
              }
              // Other vendor dependencies
              return 'vendor';
            }
            
            // Crisis features (always loaded)
            if (id.includes('services/crisis') || id.includes('components/Crisis')) {
              return 'crisis-core';
            }
            
            // Components chunk
            if (id.includes('/components/')) {
              return 'components';
            }
            
            // Views chunk  
            if (id.includes('/views/')) {
              return 'views';
            }
            
            // Stores chunk
            if (id.includes('/stores/')) {
              return 'stores';
            }
            
            // Wellness features
            if (id.includes('wellness') || id.includes('mood') || id.includes('assessment')) {
              return 'wellness';
            }
            
            // Communication features
            if (id.includes('chat') || id.includes('message') || id.includes('websocket')) {
              return 'communication';
            }
            
            // Utils chunk
            if (id.includes('/utils/') || id.includes('/services/')) {
              return 'utils';
            }
          },
          assetFileNames: (assetInfo) => {
            // Organize assets by type using facadeModuleId when available
            const ext = assetInfo.names?.[0]?.split('.').pop() || '';
            
            // Exclude videos from build assets - handle via VideoLoader
            if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
              return 'excluded/videos/[name].[ext]';
            }
            
            if (ext === 'css') {
              return 'assets/css/[name]-[hash].css';
            }
            if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'avif'].includes(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        }
      },
      // Optimize for mobile networks
      terserOptions: {
        compress: {
          drop_console: isProduction, // Remove console.log in production
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info'] : []
        }
      }
    },
    server: {
      port: 3000,
      strictPort: false,
      fs: {
        allow: ['..']
      },
      hmr: {
        overlay: false,
        host: 'localhost'
      }
    },
    define: {
      // Fix CommonJS compatibility issues
      global: 'globalThis',
      'process.env': JSON.stringify(env)
    },
    // Optimize dependencies for mobile with CommonJS compatibility
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'react-markdown',
        'buffer',
        // Force bundling of potential CommonJS modules
        'crypto-js',
        'compromise',
        'i18next',
        'react-i18next'
      ],
      exclude: [
        // Exclude service worker related files
        'src/services/serviceWorkerManager.ts',
        // Exclude server-side dependencies
        'natural',
        'sentiment',
        'pg',
        'pg-protocol',
        'crypto'
      ],
      esbuildOptions: {
        target: 'esnext',
        define: {
          global: 'globalThis'
        }
      }
    }
  };
});