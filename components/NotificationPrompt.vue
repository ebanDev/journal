<template>
  <BaseActionPopup
    v-if="isMobile"
    :visible="showNotificationBanner"
    :has-triggered="hasTriggered"
    :loading="requesting"
    :stack-index="stackIndex"
    title="Activez les notifications"
    description="Restez informé des nouveaux articles"
    icon="mingcute:notification-line"
    dismissal-key="notification-prompt-dismissed-date"
    :primary-action="{ label: 'Activer', action: requestNotifications }"
    @dismiss="dismissNotificationPrompt"
    @update:has-triggered="hasTriggered = $event"
  />
</template>

<script setup lang="ts">
import { useOneSignal } from "@onesignal/onesignal-vue3"

const showNotificationBanner = ref(false)
const requesting = ref(false)
const hasTriggered = ref(false)
const hasScrolled = ref(false)
const isMobile = ref(false)

const SCROLL_THRESHOLD = 1 // pixels to scroll before showing prompt

// Computed stack index - check if PWA install prompt might be visible
const stackIndex = computed(() => {
  if (!import.meta.client || !isMobile.value) return 0
  
  // Check if PWA install was dismissed today
  const pwaInstallDismissed = localStorage.getItem('pwa-install-dismissed-date') === new Date().toDateString()
  
  // If PWA install was dismissed today, we should be at stack-index 0 (front)
  // If PWA install wasn't dismissed, we should be at stack-index 1 (behind)
  return pwaInstallDismissed ? 0 : 1
})

// Check if device is mobile
function checkIsMobile() {
  if (import.meta.client) {
    // Check screen width only
    isMobile.value = window.innerWidth <= 768
  }
}

// Check if notifications are already granted
function areNotificationsGranted(): boolean {
  if (import.meta.client && 'Notification' in window) {
    return Notification.permission === 'granted'
  }
  return false
}

// Check if notification prompt was dismissed today
function wasNotificationDismissedToday(): boolean {
  if (import.meta.client) {
    const dismissedDate = localStorage.getItem('notification-prompt-dismissed-date')
    const today = new Date().toDateString()
    return dismissedDate === today
  }
  return false
}

// Check scroll position and show banner if conditions are met
function checkScrollTrigger(): void {
  if (hasScrolled.value || !import.meta.client || !isMobile.value) return

  const scrollY = window.scrollY || document.documentElement.scrollTop
  console.log('NotificationPrompt scroll trigger:', scrollY)

  if (scrollY > SCROLL_THRESHOLD) {
    hasScrolled.value = true
    
    const notificationsGranted = areNotificationsGranted()
    const dismissedToday = wasNotificationDismissedToday()
    console.log('NotificationPrompt checks:', { notificationsGranted, dismissedToday })

    // Show banner after scroll if notifications not granted and not dismissed today
    if (!notificationsGranted && !dismissedToday) {
      console.log('NotificationPrompt showing in 500ms')
      setTimeout(() => {
        hasTriggered.value = true
        showNotificationBanner.value = true
        console.log('NotificationPrompt shown')
      }, 500) // Show notification prompt first (it will be behind)
    } else {
      console.log('NotificationPrompt not showing:', { notificationsGranted, dismissedToday })
    }
  }
}

async function requestNotifications() {
  requesting.value = true
  try {
    // Check if OneSignal is available
    const onesignal = useOneSignal()
    if (onesignal) {
      await onesignal.Notifications.requestPermission()
      
      // Track notification permission request
      umTrackEvent('notification-permission-requested')
      
      // Hide banner after request
      showNotificationBanner.value = false
    }
  } catch (error) {
    console.error('Notification permission request failed:', error)
  } finally {
    requesting.value = false
  }
}

function dismissNotificationPrompt() {
  showNotificationBanner.value = false
  hasTriggered.value = false
}

// Set up scroll listener
onMounted(() => {
  console.log('NotificationPrompt mounted')
  if (import.meta.client) {
    // Check if device is mobile
    checkIsMobile()
    console.log('NotificationPrompt mobile check:', isMobile.value)
    
    // Don't show if notifications are already granted, not mobile, or dismissed today
    const notificationsGranted = areNotificationsGranted()
    const dismissedToday = wasNotificationDismissedToday()
    console.log('NotificationPrompt mount checks:', { notificationsGranted, dismissedToday, isMobile: isMobile.value })
    
    if (notificationsGranted || !isMobile.value || dismissedToday) {
      console.log('NotificationPrompt not setting up listener')
      return
    }
    
    console.log('NotificationPrompt setting up scroll listener')
    window.addEventListener('scroll', checkScrollTrigger, { passive: true })
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', checkScrollTrigger)
  }
})
</script>

