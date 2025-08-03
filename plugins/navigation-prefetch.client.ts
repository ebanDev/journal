/**
 * Navigation prefetching plugin for instant page loads
 * Preloads TabBar routes immediately and sets up hover prefetching for desktop
 */
export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.server) return

  const { prefetchEssentialData } = useOptimizedDb()
  
  // Prefetch data immediately on app start
  prefetchEssentialData()

  // TabBar routes that should be preloaded immediately for mobile navigation
  const tabBarRoutes = ['/', '/articles', '/la-veille', '/search']
  
  // Preload all TabBar routes immediately
  function preloadTabBarRoutes() {
    tabBarRoutes.forEach(route => {
      preloadRouteComponents(route).catch(() => {
        // Ignore prefetch errors
      })
    })
  }

  // Set up hover prefetching for desktop navigation links only
  let prefetchTimeout: NodeJS.Timeout

  function setupHoverPrefetch() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupHoverPrefetch)
      return
    }

    // Only set up hover prefetch on desktop (where hover makes sense)
    if (window.innerWidth >= 768) {
      const navLinks = document.querySelectorAll('header a[href^="/"], .header a[href^="/"]')
      
      navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
          const href = link.getAttribute('href')
          
          // Clear any existing timeout
          if (prefetchTimeout) clearTimeout(prefetchTimeout)
          
          // Prefetch after a short delay to avoid unnecessary requests
          prefetchTimeout = setTimeout(() => {
            if (href && !tabBarRoutes.includes(href)) {
              preloadRouteComponents(href).catch(() => {
                // Ignore prefetch errors
              })
            }
          }, 100)
        })

        link.addEventListener('mouseleave', () => {
          if (prefetchTimeout) {
            clearTimeout(prefetchTimeout)
          }
        })
      })
    }
  }

  // Immediate preloading
  onMounted(() => {
    preloadTabBarRoutes()
    setupHoverPrefetch()
  })
  
  // Re-setup after navigation
  const router = useRouter()
  router.afterEach(() => {
    nextTick(() => {
      setupHoverPrefetch()
    })
  })
})
