import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'

  return {
  plugins: [
    react(),
    // Sentry plugin for error monitoring and source maps
    ...(isProduction && env.VITE_SENTRY_DSN ? [
      sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: './dist/**',
          ignore: ['node_modules/**'],
        },
        release: {
          name: env.VITE_APP_VERSION || '1.0.0',
          uploadLegacySourcemaps: false,
        },
      })
    ] : []),
    // PWA 플러그인 - 프로덕션에서만 활성화
    ...(isProduction && env.VITE_ENABLE_PWA === 'true' ? [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Plan4MyFit',
          short_name: 'Plan4MyFit',
          description: 'AI가 만들어주는 개인 맞춤형 헬스 루틴 플래너',
          theme_color: '#3182f6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'openai-api-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheKeyWillBeUsed: async ({ request }) => {
                  return `${request.url}`;
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 // 1 hour
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: isDevelopment
        }
      })
    ] : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: !isProduction, // 프로덕션에서는 소스맵 비활성화
    minify: isProduction ? 'terser' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components chunk
          ui: ['framer-motion', 'lucide-react'],
          // Utils chunk
          utils: ['clsx', 'tailwind-merge'],
          // Query chunk
          query: ['@tanstack/react-query'],
          // Supabase chunk
          supabase: ['@supabase/supabase-js'],
          // OpenAI chunk (프로덕션에서만 분리)
          ...(isProduction && { ai: ['openai'] })
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: isProduction ? 500 : 1000,
    // Enable asset inlining for small files
    assetsInlineLimit: 4096,
    // Production optimizations
    ...(isProduction && {
      terserOptions: {
        compress: {
          drop_console: true, // 프로덕션에서 console.log 제거
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      }
    })
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'clsx',
      'framer-motion'
    ],
  },
  
  // Environment-specific configurations
  define: {
    __DEV__: isDevelopment,
    __PROD__: isProduction,
    // 프로덕션에서 민감한 정보 숨기기
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  
  // 프로덕션에서 로그 레벨 조정
  logLevel: isProduction ? 'warn' : 'info',
  
  // Clear screen on file changes (개발 환경에서만)
  clearScreen: isDevelopment
  }
})