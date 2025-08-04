<template>
  <div v-if="showInstallBanner && isMobile" ref="installBannerRef"
    class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-amber-200 rounded-lg shadow-lg p-4 z-200"
    :class="{
      'transition-transform duration-300': !isDragging,
      'animate-spring-up': hasTriggered && showInstallBanner
    }" :style="{ transform: `translateY(${swipeOffset}px)` }" @touchstart="handleTouchStart"
    @touchmove="handleTouchMove" @touchend="handleTouchEnd">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <Icon name="mingcute:download-line" class="text-amber-600 text-xl" />
        <div>
          <h3 class="font-medium text-gray-900">Installer l'application</h3>
          <p class="text-sm text-gray-600">Accès rapide et notifications</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <UButton size="xs" @click="installApp" :loading="installing">
          Installer
        </UButton>
      </div>
    </div>
    <!-- Swipe indicator -->
    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-300 rounded-full"></div>
  </div>

  <!-- Update prompt -->
  <div v-if="$pwa?.needRefresh"
    class="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <Icon name="mingcute:refresh-line" class="text-white text-xl" />
        <div>
          <h3 class="font-medium">Mise à jour disponible</h3>
          <p class="text-sm opacity-90">Une nouvelle version est prête</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <UButton size="xs" variant="outline" class="!text-white !border-white hover:!bg-white hover:!text-blue-600"
          @click="$pwa?.cancelPrompt()">
          Plus tard
        </UButton>
        <UButton size="xs" variant="solid" class="!bg-white !text-blue-600 hover:!bg-gray-100" @click="updateApp"
          :loading="updating">
          Mettre à jour
        </UButton>
      </div>
    </div>
  </div>

  <!-- iOS Installation Instructions Drawer -->
  <UDrawer v-model:open="showIosInstructions" title="">
    <template #body>
      <div class="flex flex-col space-y-6">
        <div class="text-center">
          <Icon name="mingcute:apple-line" class="text-amber-600 text-4xl mx-auto mb-2" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Installation sur iOS</h3>
          <p class="text-gray-600 text-sm">Suivez ces étapes simples pour installer l'application sur votre iPhone ou
            iPad</p>
        </div>

        <div class="space-y-4">
          <div class="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
            <div
              class="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              1</div>
            <div>
              <p class="font-medium text-gray-900">Ouvrez le menu de partage</p>
              <p class="text-sm text-gray-600 mt-1">Appuyez sur le bouton de partage
                <Icon name="mingcute:share-3-line" class="inline" /> en bas de votre écran Safari
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
            <div
              class="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              2</div>
            <div>
              <p class="font-medium text-gray-900">Ajouter à l'écran d'accueil</p>
              <p class="text-sm text-gray-600 mt-1">Faites défiler et sélectionnez "Ajouter à l'écran d'accueil"
                <Icon name="mingcute:add-square-line" class="inline" />
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
            <div
              class="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              3</div>
            <div>
              <p class="font-medium text-gray-900">Confirmer l'installation</p>
              <p class="text-sm text-gray-600 mt-1">Appuyez sur "Ajouter" en haut à droite pour terminer l'installation
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-center">
        <UButton label="J'ai compris" @click="showIosInstructions = false" class="flex-1" icon="mingcute:check-line" />
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { UDrawer } from '#components'
const { $pwa } = useNuxtApp()
import { useOneSignal } from "@onesignal/onesignal-vue3";

const showInstallBanner = ref(false)
const installing = ref(false)
const updating = ref(false)
const installBannerRef = ref<HTMLElement>()
const hasTriggered = ref(false)
const hasScrolled = ref(false)
const isMobile = ref(false)
const showIosInstructions = ref(false)

// Manual PWA install prompt handling (fix for @vite-pwa/nuxt issue #130)
const deferredPrompt = ref<any>(null)
const canInstall = ref(false)

// Swipe functionality
const swipeOffset = ref(0)
const startY = ref(0)
const isDragging = ref(false)
const SWIPE_THRESHOLD = 75 // pixels to swipe before dismissing
const SCROLL_THRESHOLD = 1 // pixels to scroll before showing prompt

// Local storage keys
const DISMISSED_DATE_KEY = 'pwa-install-dismissed-date'

// Check if prompt was dismissed today
function wasDismissedToday(): boolean {
  if (import.meta.client) {
    const dismissedDate = localStorage.getItem(DISMISSED_DATE_KEY)
    const today = new Date().toDateString()
    if (dismissedDate) {
      return dismissedDate === today
    }
  }
  return false
}

// Set dismissed date to today
function setDismissedToday(): void {
  if (import.meta.client) {
    const today = new Date().toDateString()
    localStorage.setItem(DISMISSED_DATE_KEY, today)
  }
}

// Check scroll position and show banner if conditions are met
function checkScrollTrigger(): void {
  if (hasScrolled.value || !import.meta.client || !isMobile.value) return

  const scrollY = window.scrollY || document.documentElement.scrollTop

  if (scrollY > SCROLL_THRESHOLD) {
    hasScrolled.value = true

    // Check if this is iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (navigator as any).standalone === true
    const isIOSSafari = isIOS && !isInStandaloneMode

    // For iOS Safari, show banner regardless of $pwa.showInstallPrompt
    // since iOS handles PWA installation differently
    const shouldShowForPWA = (canInstall.value || $pwa?.showInstallPrompt) && !$pwa?.isPWAInstalled && !wasDismissedToday()
    const shouldShowForIOS = isIOSSafari && !wasDismissedToday()

    // Show banner after scroll if PWA is installable and not dismissed today
    if (shouldShowForPWA || shouldShowForIOS) {
      setTimeout(() => {
        hasTriggered.value = true
        showInstallBanner.value = true
      }, 500) // Small delay for better UX
    }
  }
}

// Show install prompt based on scroll and dismissal state
watchEffect(() => {
  if (import.meta.client && $pwa && isMobile.value) {
    // Only show if PWA is installable, not dismissed today, user has scrolled, and on mobile
    const shouldShow = (canInstall.value || $pwa.showInstallPrompt) &&
      !$pwa.isPWAInstalled &&
      !wasDismissedToday() &&
      hasScrolled.value

    if (shouldShow && !showInstallBanner.value) {
      hasTriggered.value = true
      showInstallBanner.value = true
    }
  }
})

// Event listener references for cleanup
let beforeInstallPromptListener: ((e: Event) => void) | null = null
let appInstalledListener: ((e: Event) => void) | null = null

// Clean up event listeners
function removeEventListeners() {
  if (beforeInstallPromptListener) {
    window.removeEventListener('beforeinstallprompt', beforeInstallPromptListener)
    beforeInstallPromptListener = null
  }
  if (appInstalledListener) {
    window.removeEventListener('appinstalled', appInstalledListener)
    appInstalledListener = null
  }
}

// Check if device is mobile
function checkIsMobile() {
  if (import.meta.client) {
    // Check screen width only
    isMobile.value = window.innerWidth <= 768
  }
}

// Set up scroll listener
onMounted(() => {
  if (import.meta.client) {
    // Check if device is mobile
    checkIsMobile()

    // Check if app is already installed - if so, don't set up listeners
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (navigator as any).standalone === true

    if (isStandalone || isIOSStandalone || $pwa?.isPWAInstalled) {
      return // App is already installed, no need for install prompt
    }
    window.addEventListener('scroll', checkScrollTrigger, { passive: true })

    // For mobile devices, set canInstall to true (especially for iOS Safari where beforeinstallprompt doesn't fire)
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      canInstall.value = true
    } else {
      // Listen for beforeinstallprompt event (Chrome/Edge) - Manual handling
      beforeInstallPromptListener = (e: Event) => {
        e.preventDefault() // Prevent the default prompt
        // Store the event so it can be triggered later
        deferredPrompt.value = e
        canInstall.value = true
      }
      window.addEventListener('beforeinstallprompt', beforeInstallPromptListener)

      // Listen for appinstalled event
      appInstalledListener = (e: Event) => {
        // Track PWA installation
        umTrackEvent('pwa-installed')

        // After successful installation, prompt for notifications on mobile
        if (isMobile.value) {
          setTimeout(() => {
            promptForNotifications()
          }, 500)
        }      // Reset the deferred prompt
        deferredPrompt.value = null
        canInstall.value = false
        showInstallBanner.value = false
        // Clean up event listeners since app is now installed
        removeEventListeners()
      }
      window.addEventListener('appinstalled', appInstalledListener)
    }
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', checkScrollTrigger)
    removeEventListeners()
  }
})

function handleTouchStart(event: TouchEvent) {
  // Don't interfere with button clicks
  const target = event.target as HTMLElement
  if (target?.tagName === 'BUTTON' || target?.closest('button')) {
    return
  }

  startY.value = event.touches[0].clientY
  isDragging.value = true
  swipeOffset.value = 0
  // Prevent page scrolling while swiping the banner
  event.preventDefault()
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value) return

  // Don't interfere with button interactions
  const target = event.target as HTMLElement
  if (target?.tagName === 'BUTTON' || target?.closest('button')) {
    return
  }

  const currentY = event.touches[0].clientY
  const deltaY = currentY - startY.value

  // Only allow downward swipes (positive deltaY)
  if (deltaY > 0) {
    swipeOffset.value = deltaY
    // Prevent page scrolling during swipe
    event.preventDefault()
  }
}

function handleTouchEnd() {
  if (!isDragging.value) return

  isDragging.value = false

  // If swiped down far enough, dismiss the banner
  if (swipeOffset.value > SWIPE_THRESHOLD) {
    dismissInstallPrompt()
  } else {
    // Snap back to original position
    swipeOffset.value = 0
  }
}

async function installApp() {
  // Check if this is iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isInStandaloneMode = (navigator as any).standalone === true
  const isIOSSafari = isIOS && !isInStandaloneMode

  if (isIOSSafari) {
    // For iOS Safari, show instructions drawer instead of trying to install programmatically
    showIosInstructions.value = true
    return
  }

  installing.value = true
  try {
    // Try manual prompt first (fix for @vite-pwa/nuxt issue)
    if (deferredPrompt.value) {
      await deferredPrompt.value.prompt()

      // Wait for the user's choice
      const choiceResult = await deferredPrompt.value.userChoice

      if (choiceResult.outcome === 'accepted') {
        // Track PWA installation
        umTrackEvent('pwa-installed')

        // After successful installation, prompt for notifications on mobile
        if (isMobile.value) {
          setTimeout(() => {
            promptForNotifications()
          }, 300)
        }
        showInstallBanner.value = false
      }

      // Clear the deferred prompt
      deferredPrompt.value = null
      canInstall.value = false
    } else if ($pwa?.install) {
      await $pwa.install()
      // Track PWA installation
      umTrackEvent('pwa-installed')
      showInstallBanner.value = false
    }
  } catch (error) {
    console.error('Installation failed:', error)
  } finally {
    installing.value = false
  }
}

function dismissInstallPrompt() {
  if ($pwa?.cancelInstall) {
    $pwa.cancelInstall()
  }

  // Set dismissed date and hide banner
  setDismissedToday()
  showInstallBanner.value = false
  swipeOffset.value = 0
}

async function updateApp() {
  if (!$pwa?.updateServiceWorker) return

  updating.value = true
  try {
    await $pwa.updateServiceWorker(true)
  } catch (error) {
    console.error('Update failed:', error)
  } finally {
    updating.value = false
  }
}

// Simple notification prompt for mobile PWA users
async function promptForNotifications() {
  if (import.meta.client && isMobile.value) {
    // Check if OneSignal is available (injected by the plugin)
    const onesignal = useOneSignal()
    if (onesignal) {
      await onesignal.Notifications.requestPermission()
    }
  }
}
</script>

<style scoped>
@keyframes spring-up {
  0% {
    transform: translateY(200px);
    opacity: 0;
  }

  60% {
    transform: translateY(-10px);
    opacity: 1;
  }

  80% {
    transform: translateY(5px);
  }

  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-spring-up {
  animation: spring-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
