<script setup lang="ts">
const props = withDefaults(defineProps<{ loading: boolean }>(), {
  loading: false,
});
</script>

<template>
  <div v-if="loading" class="progress-bar mt-[env(safe-area-inset-top)]">
    <div class="progress-bar-value"></div>
  </div>
</template>

<style>
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 4px;
  background-color: rgba(0, 255, 151, 0.2);
  width: 100%;
  overflow: hidden;
}

.progress-bar-value {
  width: 100%;
  height: 100%;
  background-color: rgb(0, 255, 151);
  animation: indeterminateAnimation 1s infinite linear;
  transform-origin: 0% 50%;
}

@keyframes indeterminateAnimation {
  0% {
    transform: translateX(0) scaleX(0);
  }
  40% {
    transform: translateX(0) scaleX(0.4);
  }
  100% {
    transform: translateX(100%) scaleX(0.5);
  }
}
</style>
