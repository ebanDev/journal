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
  ],

  supabase: {
    redirectOptions: {
      include: ["/internal"]
    },
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})