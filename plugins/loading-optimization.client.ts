/**
 * Loading optimization plugin to improve perceived performance
 */
export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.server) return

  const router = useRouter()
  
  // Add loading states to improve perceived performance
  router.beforeEach((to, from) => {
    // Show loading indicator for navigation between major sections
    if (from.path !== '/' && to.path !== from.path) {
      // You can add a global loading state here if needed
      // For now, we rely on the instant navigation from caching
    }
  })

  // Optimize image loading
  const observeImages = () => {
    const images = document.querySelectorAll('img[loading="lazy"]')
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || img.src
          img.classList.remove('opacity-0')
          img.classList.add('opacity-100')
          imageObserver.unobserve(img)
        }
      })
    }, { rootMargin: '50px' })

    images.forEach(img => imageObserver.observe(img))
  }

  // Set up image optimization after each navigation
  router.afterEach(() => {
    nextTick(() => {
      observeImages()
    })
  })

  // Initial setup
  onMounted(() => {
    observeImages()
  })
})
