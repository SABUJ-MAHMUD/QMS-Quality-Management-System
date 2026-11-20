import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { transform as lightningTransform } from 'lightningcss';
import { transformSync as esbuildTransformSync } from 'esbuild';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const BASE_PATH = '/QMS-Quality-Management-System/';
const appBuildId = process.env.VITE_APP_BUILD_ID || Date.now().toString();
const appBuiltAt = new Date().toISOString();

const COMPAT_ESBUILD_TARGETS = ['chrome88', 'edge88', 'firefox85', 'safari14'];

function versionManifestPlugin(buildId: string, builtAt: string): Plugin {
  const payload = JSON.stringify({
    version: buildId,
    builtAt,
  });

  return {
    name: 'qms-version-manifest',
    configureServer(server) {
      server.middlewares.use(`${BASE_PATH}version.json`, (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.end(payload);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(`${BASE_PATH}version.json`, (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        const distVersionPath = path.resolve('dist/version.json');
        const currentPayload = fs.existsSync(distVersionPath)
          ? fs.readFileSync(distVersionPath, 'utf8')
          : payload;
        res.end(currentPayload);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload,
      });
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: `<!doctype html><html><head><meta charset="utf-8"><title>OQL: Analysis</title><script>(function(){try{if(!/\\.[a-z0-9]+$/i.test(window.location.pathname)){window.location.replace(${JSON.stringify(BASE_PATH)});}}catch(e){}})();</script></head><body>Redirecting to OQL: Analysis...</body></html>`,
      });
    },
  };
}

/**
 * Downlevels Tailwind v4 oklch() colors and modern CSS features to Chrome 88+ / Edge 88+ / Firefox 85+ / Safari 14+
 * so factory/office desktops running older browsers (e.g. Win7 Chrome 109) never drop text/border colors.
 */
function cssCompatDownlevelPlugin(): Plugin {
  return {
    name: 'qms-css-compat-downlevel',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'asset' && fileName.endsWith('.css')) {
          const rawCode =
            typeof item.source === 'string'
              ? Buffer.from(item.source, 'utf8')
              : Buffer.from(item.source);
          const result = lightningTransform({
            filename: fileName,
            code: rawCode,
            minify: true,
            targets: {
              chrome: 88 << 16,
              edge: 88 << 16,
              firefox: 85 << 16,
              safari: 14 << 16,
            },
          });
          item.source = Buffer.from(result.code).toString('utf8');
        }
      }
    },
  };
}

/**
 * Ensures all emitted JS chunks compile down cleanly to Chrome 88+ / Edge 88+ / Firefox 85+ / Safari 14+
 * (eliminating ES2022+ class static blocks in vendor-firebase, private fields, regex /v flags).
 */
function jsCompatDownlevelPlugin(): Plugin {
  return {
    name: 'qms-js-compat-downlevel',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'chunk' && (fileName.endsWith('.js') || fileName.endsWith('.mjs'))) {
          try {
            const transformed = esbuildTransformSync(item.code, {
              loader: 'js',
              target: COMPAT_ESBUILD_TARGETS,
              format: 'esm',
              minify: true,
              legalComments: 'none',
            });
            item.code = transformed.code;
          } catch (err) {
            console.warn(`[qms-js-compat] skipped downlevel on ${fileName}:`, err instanceof Error ? err.message : err);
          }
        }
      }
    },
  };
}

function excludeAiStudioAssetsPlugin(): Plugin {
  return {
    name: 'qms-exclude-aistudio-assets',
    closeBundle() {
      const aistudioOutDir = path.resolve('dist/assets/aistudio');
      if (fs.existsSync(aistudioOutDir)) {
        fs.rmSync(aistudioOutDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: BASE_PATH,
    define: {
      __APP_BUILD_ID__: JSON.stringify(appBuildId),
      __APP_BUILT_AT__: JSON.stringify(appBuiltAt),
    },
    plugins: [
      react(),
      tailwindcss(),
      versionManifestPlugin(appBuildId, appBuiltAt),
      cssCompatDownlevelPlugin(),
      jsCompatDownlevelPlugin(),
      excludeAiStudioAssetsPlugin(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'favicon.png', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: BASE_PATH,
          name: 'OQL: Analysis (NFL)',
          short_name: 'OQL: Analysis (NFL)',
          description:
            'OQL: Analysis (Garments Quality) for Northern Fashions Ltd. Real-time OQL inspection analysis, defect classification, and CAPA compliance.',
          theme_color: '#0284c7',
          background_color: '#07182e',
          display: 'standalone',
          orientation: 'portrait',
          start_url: BASE_PATH,
          scope: BASE_PATH,
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          clientsClaim: true,
          navigateFallback: `${BASE_PATH}index.html`,
          navigateFallbackDenylist: [
            new RegExp(`^${BASE_PATH}assets/`),
            new RegExp(`^${BASE_PATH}pdf\\.worker`),
            new RegExp(`^${BASE_PATH}tesseract-worker`),
            new RegExp(`^${BASE_PATH}version\\.json`),
            new RegExp(`^${BASE_PATH}api/`),
          ],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          globIgnores: [
            '**/assets/aistudio/**',
            '**/version.json',
            '**/pdf.worker*',
            '**/assets/pdf.worker*',
            '**/tesseract-worker*',
            '**/vendor-pdfjs*',
            '**/vendor-xlsx*',
            '**/vendor-pptx*',
            '**/UploadView*',
            '**/ReportsView*',
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
                  maxEntries: 30,
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
      target: COMPAT_ESBUILD_TARGETS,
      cssTarget: COMPAT_ESBUILD_TARGETS,
      modulePreload: {
        resolveDependencies: (_filename: string, deps: string[]) =>
          deps.filter(
            (d) =>
              !d.includes('vendor-pdfjs') &&
              !d.includes('vendor-pptx') &&
              !d.includes('vendor-xlsx')
          ),
      },
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
