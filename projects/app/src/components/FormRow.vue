<template>
  <div class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
    <div>
      <label for="app" class="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
        ><slot name="label"></slot
      ></label>
      <label for="app" class="block text-sm font-light leading-6 text-foreground/50 sm:pt-1.5">
        <slot name="help"></slot>
      </label>
    </div>
    <div class="mt-2 sm:col-span-2 sm:mt-0 flex items-center w-full h-full">
      <slot></slot>
    </div>
  </div>
</template>
