<template>
  <BaseActionPopup
    v-if="isMobile"
    :visible="showInstallBanner"
    :has-triggered="hasTriggered"
    :loading="installing"
    :stack-index="0"
    title="Installer l\'application"
    description="Accès rapide et lecture hors ligne"
    icon="mingcute:download-line"
    dismissal-key="pwa-install-dismissed-date"
    :primary-action="{ label: 'Installer', action: installApp }"
    @dismiss="dismissInstallPrompt"
    @update:has-triggered="hasTriggered = $event"
  />

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
          <p class="text-gray-600 text-sm">Suivez ces étapes simples pour installer l\'application sur votre iPhone ou iPad</p>
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
              <p class="font-medium text-gray-900">Ajouter à l\'écran d\'accueil</p>
              <p class="text-sm text-gray-600 mt-1">Faites défiler et sélectionnez "Ajouter à l\'écran d\'accueil"
                <Icon name="mingcute:add-square-line" class="inline" />
              </p>
            </div>
          </div>

          <div class="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
            <div
              class="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              3</div>
            <div>
              <p class="font-medium text-gray-900">Confirmer l\'installation</p>
              <p class="text-sm text-gray-600 mt-1">Appuyez sur "Ajouter" en haut à droite pour terminer l\'installation
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
const { $pwa } = useNuxtApp()

const showInstallBanner = ref(false)
const installing = ref(false)
const updating = ref(false)
const hasTriggered = ref(false)
const hasScrolled = ref(false)
const isMobile = ref(false)
const showIosInstructions = ref(false)

// Manual PWA install prompt handling (fix for @vite-pwa/nuxt issue #130)
const deferredPrompt = ref<any>(null)
const canInstall = ref(false)

const SCROLL_THRESHOLD = 1 // pixels to scroll before showing prompt

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
    const shouldShowForPWA = (canInstall.value || $pwa?.showInstallPrompt) && !$pwa?.isPWAInstalled
    const shouldShowForIOS = isIOSSafari

    // Show banner after scroll if PWA is installable
    if (shouldShowForPWA || shouldShowForIOS) {
      setTimeout(() => {
        hasTriggered.value = true
        showInstallBanner.value = true
      }, 1000) // Show PWA prompt 500ms after notification prompt (it will be on top)
    }
  }
}

// Show install prompt based on scroll
watchEffect(() => {
  if (import.meta.client && $pwa && isMobile.value) {
    // Only show if PWA is installable, user has scrolled, on mobile, and not dismissed today
    const wasDismissedToday = localStorage.getItem('pwa-install-dismissed-date') === new Date().toDateString()
    const shouldShow = (canInstall.value || $pwa.showInstallPrompt) &&
      !$pwa.isPWAInstalled &&
      hasScrolled.value &&
      !wasDismissedToday

    if (shouldShow && !showInstallBanner.value) {
      hasTriggered.value = true
      showInstallBanner.value = true
    } else if (wasDismissedToday && showInstallBanner.value) {
      // Hide if it was dismissed today
      showInstallBanner.value = false
      hasTriggered.value = false
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
        
        // Reset the deferred prompt
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
  showInstallBanner.value = false
  hasTriggered.value = false
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
</script>
