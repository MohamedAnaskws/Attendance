import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
        secure: false,
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            
            // UI libraries
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-ui';
            }
            
            // State management and utilities
            if (id.includes('zustand') || id.includes('axios') || id.includes('date-fns')) {
              return 'vendor-utils';
            }
            
            // Toast notifications
            if (id.includes('react-toastify')) {
              return 'vendor-toast';
            }
            
            // Default vendor chunk
            return 'vendor';
          }
        },
        
        // Optimize chunk size
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/css/[name]-[hash].[ext]',
      },
    },
    
    // Increase chunk size warning limit (optional)
    chunkSizeWarningLimit: 1000,
    
    // Minify options
    minify: 'esbuild',
    target: 'es2020',
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'zustand',
      'date-fns',
      'react-toastify',
      'antd',
    ],
  },
});