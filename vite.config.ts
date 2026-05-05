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
        manualChunks: {
          // React vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries chunk
          'vendor-ui': ['antd', '@ant-design/icons'],
          
          // State management and utilities chunk
          'vendor-utils': ['zustand', 'axios', 'date-fns'],
          
          // Toast and notifications
          'vendor-toast': ['react-toastify'],
          
          // Everything else
          'vendor-other': ['@vitejs/plugin-react'],
        },
        
        // Alternative: dynamic chunking based on node_modules
        // Uncomment this if you prefer automatic chunking
        /*
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
            
            // State management
            if (id.includes('zustand') || id.includes('axios')) {
              return 'vendor-state';
            }
            
            // Utilities
            if (id.includes('date-fns') || id.includes('lodash')) {
              return 'vendor-utils';
            }
            
            // Default vendor chunk
            return 'vendor';
          }
        },
        */
        
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
  
  // Define environment variables
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000'),
    'import.meta.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL || 'ws://localhost:8000'),
  },
});