import OneSignalVuePlugin from '@onesignal/onesignal-vue3'

export default defineNuxtPlugin((nuxtApp) => {
  // Only initialize on client side and mobile
  if (import.meta.client) {
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
      nuxtApp.vueApp.use(OneSignalVuePlugin, {
        appId: process.env.ONESIGNAL_APP_ID || "1dfcfc2c-46a0-4f97-9edd-e6618ead6697",
        safari_web_id: process.env.ONESIGNAL_SAFARI_WEB_ID || "web.onesignal.auto.1f7edc6b-077e-4a04-b244-6d0a0c671761",
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: 'OneSignal/OneSignalSDKWorker.js',
        serviceWorkerParam: {
          scope: '/OneSignal/',
        },
      })
    }
  }
})
