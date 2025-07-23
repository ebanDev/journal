// @ts-ignore
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@nuxtjs/supabase',
    'nuxt-swiper',
    '@vite-pwa/nuxt',
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

  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      cleanupOutdatedCaches: true,
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
        }
      ]
    },
    manifest: {
      name: 'Contradiction·s, le journal des luttes de Bordeaux',
      short_name: 'Contradictions·s',
      description: 'Le journal des luttes de Bordeaux, un espace pour partager et documenter les luttes sociales et politiques.',
      theme_color: '#fffbeb', // amber-50
      background_color: '#fffbeb', // amber-50
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
        action: '/la-veille',
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
    },
  }
})
