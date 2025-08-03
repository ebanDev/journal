<template>
  <footer class="flex flex-col md:flex-row justify-between px-8 w-screen items-center py-6 bg-[#FFFDFD] border-t border-gray-200 mt-auto">
    <div class="text-center md:text-left mb-4 md:mb-0">
      <p class="font-serif text-lg text-black mb-1">Sursaut<span class="text-primary-600">!</span></p>
      <p class="text-sm text-gray-600 mb-2">
        Une revue collaborative éditée par 
        <span class="font-semibold">Solidaires Étudiant-e-s 33</span>
      </p>
      <p class="text-xs text-gray-500">
        Tous les articles sont publiés sous licence libre 
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" 
           target="_blank" 
           class="underline hover:text-gray-700 transition-colors">
          CC-BY-NC-SA
        </a>
      </p>
    </div>
    
    <div class="flex gap-4 items-center">
      <a href="mailto:solidairesetu33@gmail.com" 
         class="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
        <Icon name="mingcute-mail-line" class="w-5 h-5" />
        <span class="hidden sm:inline text-sm">Contact</span>
      </a>
      <a href="https://instagram.com/solidairesetu33" 
         target="_blank"
         class="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
        <Icon name="mingcute-instagram-line" class="w-5 h-5" />
        <span class="hidden sm:inline text-sm">Instagram</span>
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
// No script needed for this static component
</script>

<style scoped>
/* Footer styles inherit from the design system */
</style>
