<template>
  <div v-if="actuallyVisible" ref="popupRef"
    class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-amber-200 rounded-lg shadow-lg p-4"
    :class="[
      stackingClass,
      {
        'transition-all duration-300 ease-out': !isDragging,
        'animate-spring-up': hasTriggered && actuallyVisible && props.stackIndex === 0,
        'animate-slide-in-stack': hasTriggered && actuallyVisible && props.stackIndex > 0
      }
    ]" 
    :style="{ 
      transform: swipeOffset > 0 ? 
        `${stackTransform} translateY(${swipeOffset}px)` : 
        stackTransform,
      zIndex: zIndex
    }" 
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove" 
    @touchend="handleTouchEnd">
    
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <Icon :name="icon" class="text-amber-600 text-xl" />
        <div>
          <h3 class="font-medium text-gray-900">{{ title }}</h3>
          <p class="text-sm text-gray-600">{{ description }}</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <UButton v-if="secondaryAction" 
          size="xs" 
          variant="outline" 
          @click="handleSecondaryAction">
          {{ secondaryAction.label }}
        </UButton>
        <UButton size="xs" @click="handlePrimaryAction" :loading="loading">
          {{ primaryAction.label }}
        </UButton>
      </div>
    </div>
    
    <!-- Swipe indicator -->
    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-300 rounded-full"></div>
  </div>
</template>

<script setup lang="ts">
interface ActionButton {
  label: string
  action: () => void | Promise<void>
}

interface Props {
  visible: boolean
  title: string
  description: string
  icon: string
  primaryAction: ActionButton
  secondaryAction?: ActionButton
  loading?: boolean
  stackIndex?: number
  dismissalKey: string
  hasTriggered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  stackIndex: 0,
  hasTriggered: false
})

const emit = defineEmits<{
  dismiss: []
  'update:hasTriggered': [value: boolean]
}>()

// Swipe functionality
const swipeOffset = ref(0)
const startY = ref(0)
const isDragging = ref(false)
const popupRef = ref<HTMLElement>()
const SWIPE_THRESHOLD = 75 // pixels to swipe before dismissing

// Computed properties for stacking effect
const zIndex = computed(() => 200 - props.stackIndex * 10)

// Dynamic transform for stacking effect
const stackTransform = computed(() => {
  if (props.stackIndex > 0) {
    const offset = props.stackIndex * 8 // 8px offset per stack level
    const scale = 1 - (props.stackIndex * 0.03) // Slightly smaller for each stack
    return `translateY(-${offset}px) scale(${scale})`
  }
  return ''
})

const stackingClass = computed(() => {
  if (props.stackIndex > 0) {
    return 'stacked-popup'
  }
  return ''
})

// Local storage helpers
function wasDismissedToday(): boolean {
  if (import.meta.client) {
    const dismissedDate = localStorage.getItem(props.dismissalKey)
    const today = new Date().toDateString()
    if (dismissedDate) {
      return dismissedDate === today
    }
  }
  return false
}

function setDismissedToday(): void {
  if (import.meta.client) {
    const today = new Date().toDateString()
    localStorage.setItem(props.dismissalKey, today)
  }
}

// Check if should show popup
const shouldShow = computed(() => {
  return !wasDismissedToday()
})

// Watch for visibility changes and dismissal state
watch([() => props.visible, shouldShow], ([newVisible, canShow]) => {
  if (newVisible && canShow && !props.hasTriggered) {
    emit('update:hasTriggered', true)
  }
})

// Update visibility based on dismissal state
const actuallyVisible = computed(() => {
  return props.visible && shouldShow.value
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
    dismissPopup()
  } else {
    // Snap back to original position
    swipeOffset.value = 0
  }
}

async function handlePrimaryAction() {
  await props.primaryAction.action()
}

async function handleSecondaryAction() {
  if (props.secondaryAction) {
    await props.secondaryAction.action()
  }
}

function dismissPopup() {
  setDismissedToday()
  emit('dismiss')
  swipeOffset.value = 0
}

// Expose shouldShow for parent components
defineExpose({ shouldShow, wasDismissedToday })
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

@keyframes slide-in-stack {
  0% {
    transform: translateY(100px) scale(0.9);
    opacity: 0;
  }

  100% {
    transform: translateY(-8px) scale(0.97);
    opacity: 1;
  }
}

.animate-spring-up {
  animation: spring-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-slide-in-stack {
  animation: slide-in-stack 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Card stacking effects */
.stacked-popup {
  box-shadow: 
    0 8px 25px -5px rgba(0, 0, 0, 0.15), 
    0 4px 10px -2px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05); /* Larger black shadow with subtle border */
  filter: brightness(0.95);
  border-color: rgba(0, 0, 0, 0.1);
}
</style>
