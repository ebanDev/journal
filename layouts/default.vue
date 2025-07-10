<template>
  <div class="bg-[#FCFAF8] text-[#1d1c1c] pb-20 min-h-screen flex flex-col items-center overflow-x-hidden">
    <div class="hidden md:block">
      <Header />
    </div>
    <NuxtPage />
    <div class="md:hidden w-full">
      <Footer />
    </div>
  </div>
</template>
