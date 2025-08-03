<template>
  <div class="bg-[#FCFAF8] text-[#1d1c1c] min-h-screen flex flex-col items-center overflow-x-hidden">
    <div class="hidden md:block">
      <Header />
    </div>
    <div class="flex-grow w-full">
      <NuxtPage />
    </div>
    <div class="md:hidden w-full mb-20">
      <TabBar />
    </div>
    <Footer />
  </div>
</template>
