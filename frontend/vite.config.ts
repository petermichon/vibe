import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  root: import.meta.dirname,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-black.svg',
        'favicon-white.svg',
        'favicon-white-small.svg',
      ],
      manifest: {
        name: 'Veodee',
        short_name: 'Veodee',
        description: 'Your video app',
        theme_color: '#0d0d0d',
        background_color: '#0d0d0d',
        display: 'standalone',
        icons: [
          {
            src: '/favicon-white-small.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, '../dist'),
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('plyr')) {
            return 'media';
          }
        },
      },
    },
  },
});
