/**
 * Route optimization middleware
 * Prefetches essential data for instant navigation
 */
export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (process.server) return

  const { prefetchEssentialData } = useOptimizedDb()
  
  // Prefetch data based on destination route
  if (to.path === '/' || to.path === '/articles' || to.path === '/la-veille') {
    // Prefetch in background without blocking navigation
    prefetchEssentialData().catch(() => {
      // Ignore prefetch errors
    })
  }
})
