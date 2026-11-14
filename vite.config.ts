import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const appBuildId = process.env.VITE_APP_BUILD_ID || Date.now().toString();

function versionManifestPlugin(buildId: string): Plugin {
  const payload = JSON.stringify({
    version: buildId,
    builtAt: new Date().toISOString(),
  });

  return {
    name: 'qms-version-manifest',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.end(payload);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.end(payload);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload,
      });
    },
  };
}

export default defineConfig(() => {
  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(appBuildId),
    },
    plugins: [
      react(),
      tailwindcss(),
      versionManifestPlugin(appBuildId),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.png', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'QMS - Quality Management System',
          short_name: 'QMS NFL',
          description:
            'Digital Quality Intelligence System for Northern Fashions Ltd. Real-time OQL inspection analysis, defect classification, and CAPA compliance.',
          theme_color: '#0284c7',
          background_color: '#07182e',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          navigateFallbackDenylist: [
            /^\/pdf\.worker/,
            /^\/tesseract-worker/,
            /^\/version\.json/,
            /^\/api\//,
          ],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: [
            '**/assets/aistudio/**',
            '**/version.json',
            '**/pdf.worker*',
            '**/assets/pdf.worker*',
            '**/tesseract-worker*',
          ],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /\/version\.json/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'vendor-recharts';
            }
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('node_modules/pptxgenjs')) {
              return 'vendor-pptx';
            }
            if (id.includes('node_modules/pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
