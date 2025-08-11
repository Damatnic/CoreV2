import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
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
              // Split react and react-dom into their own chunk
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              // Other vendor dependencies
              return 'vendor';
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