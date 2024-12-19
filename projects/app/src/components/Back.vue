<template>
  <ClientOnly>
    <button
      type="button"
      class="flex items-center justify-center hover:text-primary-500 duration-200"
      @click="$router.go(-1)"
    >
      <span class="i-bi-chevron-left text-base"></span>
    </button>
  </ClientOnly>
</template>
