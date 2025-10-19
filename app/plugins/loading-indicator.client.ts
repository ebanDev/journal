/**
 * Loading optimization plugin for faster perceived performance
 * Implements progressive loading and instant feedback
 */
export default defineNuxtPlugin(() => {
  if (process.server) return

  const router = useRouter()
  let startTime = 0

  // Create loading indicator
  function createLoadingBar() {
    const existing = document.getElementById('global-loading-bar')
    if (existing) existing.remove()

    const bar = document.createElement('div')
    bar.id = 'global-loading-bar'
    bar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #f59e0b, #d97706);
      z-index: 9999;
      transition: width 0.3s ease;
      opacity: 0;
    `
    document.body.appendChild(bar)
    return bar
  }

  // Show instant feedback for navigation
  router.beforeEach((to, from) => {
    // Skip loading for same route navigation
    if (to.path === from.path) return

    startTime = Date.now()
    const bar = createLoadingBar()
    
    // Immediate visual feedback
    requestAnimationFrame(() => {
      bar.style.opacity = '1'
      bar.style.width = '30%'
    })
    
    // Progressive loading animation
    setTimeout(() => {
      if (bar.style.width === '30%') {
        bar.style.width = '70%'
      }
    }, 200)
  })

  router.afterEach(() => {
    const bar = document.getElementById('global-loading-bar')
    if (!bar) return

    const elapsed = Date.now() - startTime
    
    // Complete the loading bar
    bar.style.width = '100%'
    
    // Remove after animation, but ensure minimum visible time for UX
    const minTime = Math.max(100, 300 - elapsed)
    
    setTimeout(() => {
      bar.style.opacity = '0'
      setTimeout(() => {
        bar.remove()
      }, 300)
    }, minTime)
  })

  // Handle navigation errors
  router.onError(() => {
    const bar = document.getElementById('global-loading-bar')
    if (bar) {
      bar.style.background = '#ef4444'
      bar.style.width = '100%'
      setTimeout(() => {
        bar.style.opacity = '0'
        setTimeout(() => bar.remove(), 300)
      }, 1000)
    }
  })
})
