// Simple test script to check if we can build without vite
const esbuild = require('esbuild');
const path = require('path');

async function testBuild() {
  try {
    const result = await esbuild.build({
      entryPoints: ['src/main.tsx'],
      bundle: true,
      outfile: 'test-dist/bundle.js',
      format: 'esm',
      jsx: 'automatic',
      jsxImportSource: 'react',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
        '.css': 'css',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.VITE_AUTH0_DOMAIN': '""',
        'import.meta.env.VITE_AUTH0_CLIENT_ID': '""',
        'import.meta.env.DEV': 'false',
        'import.meta.env.PROD': 'true',
      },
      logLevel: 'info',
      metafile: true,
    });
    
    console.log('Build succeeded!');
    console.log('Output:', result.metafile.outputs);
  } catch (error) {
    console.error('Build failed:', error);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error('Error:', err);
      });
    }
  }
}

testBuild();