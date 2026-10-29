import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './client',
  base: './',
  publicDir: '../public',
  resolve: {
    alias: {
      '@shared': path.resolve(process.cwd(), 'shared'),
      '@client': path.resolve(process.cwd(), 'client/src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
