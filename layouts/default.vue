<template>
  <div class="bg-[#FCFAF8] text-[#1d1c1c] min-h-screen flex flex-col items-center overflow-x-hidden">
    <div class="hidden md:block">
      <Header />
    </div>
    <div class="flex-grow w-full">
      <NuxtPage />
    </div>
    <TabBar class="md:hidden w-full shadow-t border-t border-gray-200" />
    <Footer />
  </div>
</template>

<style scoped>
.shadow-t {
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
</style>
