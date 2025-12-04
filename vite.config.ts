import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // This plugin inlines all JS and CSS into the HTML file
  ],
  build: {
    minify: 'esbuild', // Minify code using esbuild (fast and effective obfuscation)
    target: 'es2015',
    assetsInlineLimit: 100000000, // Force inlining of assets
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false, // Do not split CSS
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // Necessary for single file build
      }
    }
  }
});