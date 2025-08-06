// @ts-ignore
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  css: ['~/assets/css/main.css'],
  
  // Enable SSR and prerendering for better performance
  ssr: true,
  nitro: {
    prerender: {
      routes: ['/sitemap.xml', '/robots.txt']
    }
  },

  sitemap: {
    exclude: ['/internal/**', '/confirm', '/login'],
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false // Reduce JS payload size
  },

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
  },

  // Enhanced caching and performance headers
  routeRules: {
    // Homepage pre-rendered at build time
    '/': { isr: 300, headers: { 'cache-control': 's-maxage=60' } },
    // Articles page cached for 10 minutes with ISR
    '/articles': { isr: 600, headers: { 'cache-control': 's-maxage=300' } },
    // Individual articles cached for 1 hour
    '/articles/**': { isr: 3600, headers: { 'cache-control': 's-maxage=1800' } },
    // Radar page short-term cache (5 minutes)
    '/radar': { isr: 300, headers: { 'cache-control': 's-maxage=150' } },
    // Search page client-side only
    '/search': { prerender: false },
    // Admin pages always server-side rendered
    '/internal/**': { headers: { 'cache-control': 'no-cache' } },
    // API routes with appropriate caching
    '/api/**': { cors: true, headers: { 'cache-control': 's-maxage=60' } },
    // Specific nuxt icon API route
    '/api/_nuxt_icon/**': { cors: true, headers: { 'cache-control': 's-maxage=31536000' } }
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@nuxtjs/supabase',
    'nuxt-swiper',
    '@vite-pwa/nuxt',
    '@nuxtjs/seo',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'nuxt-schema-org',
    'nuxt-umami'
  ],

  supabase: {
    redirectOptions: {
      include: ["/internal"],
      login:  '/login',
      callback: '/login',
    },
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  typescript: {
    typeCheck: true
  },

  ui: {
    colorMode: false,
  },

  icon: {
    clientBundle: {
      scan: true,
    }
  },

  seo: {
    fallbackTitle: false,
    redirectToCanonicalSiteUrl: true,
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://sursaut-revue.fr',
    name: 'Revue Sursaut!',
    description: 'Le journal des luttes de Bordeaux, un espace pour partager et documenter les luttes sociales et politiques.',
    defaultLocale: 'fr',
  },

  umami: {
    id: "779e00d4-6269-4d73-8c5b-950948c25b18",
    host: "https://stats.sursaut-revue.fr",
    autoTrack: true,
  },

  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      cleanupOutdatedCaches: true,
      navigateFallbackDenylist: [/^\/login/, /^\/api/, /^\/internal/],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(articles|categories|issues|laveille)(\?.*)?$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'supabase-content-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 5 // 5 minutes for content
            },
            plugins: [{
              cacheWillUpdate: async ({ response }: { response: Response }) => {
                return response.status === 200 ? response : null
              }
            }]
          }
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'supabase-images-cache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week for images
            }
          }
        }
      ]
    },
    manifest: {
      name: 'Revue Sursaut!',
      short_name: 'Sursaut!',
      description: 'Le journal des luttes de Bordeaux, un espace pour partager et documenter les luttes sociales et politiques.',
      theme_color: '#FCFAF8', // amber-50
      background_color: '#FCFAF8', // amber-50
      display: 'standalone',
      start_url: '/',
      scope: '/',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
        },
      ],
      share_target: {
        action: '/radar',
        method: 'GET',
        enctype: 'application/x-www-form-urlencoded',
        params: {
          text: 'url',
        }
      }
    },
    devOptions: {
      enabled: true,
      type: 'module',
      navigateFallbackAllowlist: [/^\/$/]
    },
  }
})
