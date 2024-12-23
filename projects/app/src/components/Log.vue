<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    borderless?: boolean;
    log: string[];
    maxHeight?: string;
    running?: boolean;
  }>(),
  {
    borderless: false,
    maxHeight: '750px',
    running: true,
  },
);
const logContainer = ref<HTMLElement>();
let lastScrollPosition = 0;
const preparedLogs = computed(() => {
  return props.log
    .map((logLine) => {
      const splits = logLine.split(' ');
      if (splits.length > 1) {
        const logWithoutType = replaceLogType(logLine);
        let splits = logWithoutType.split(' ');
        const time = splits[0];

        if (new Date(time).toString() === 'Invalid Date') {
          return {
            logLine: replaceLogType(logLine),
            type: getLogType(logLine),
          };
        }
        const log = splits.slice(1).join(' ');
        return {
          logLine: replaceLogType(log),
          time,
          type: getLogType(logLine),
        };
      } else {
        return {
          logLine: replaceLogType(logLine),
          type: getLogType(logLine),
        };
      }
    })
    .sort((a, b) => {
      if (a?.time && b?.time) {
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      }
      return 0;
    })
    .filter((a) => a.logLine.trim() !== '');
});

function getLogType(logLine: string) {
  switch (true) {
    case logLine.startsWith('[ERROR] - '):
      return 'ERROR';
    case logLine.startsWith('[EVENT] - '):
      return 'EVENT';
    case logLine.startsWith('[INFO] - '):
      return 'INFO';
    case logLine.startsWith('[LOG] - '):
      return 'LOG';
    case logLine.startsWith('[SUCCESS] - '):
      return 'SUCCESS';
    default:
      return 'LOG';
  }
}

function replaceLogType(logLine: string) {
  return logLine
    .replace('[ERROR] - ', '')
    .replace('[EVENT] - ', '')
    .replace('[INFO] - ', '')
    .replace('[SUCCESS] - ', '')
    .replace('[LOG] - ', '');
}

setTimeout(() => {
  scrollDown();
}, 1);

watch(
  () => props.log,
  () => {
    const diff = lastScrollPosition - (logContainer.value?.scrollTop || 0);
    if (diff <= 100) {
      setTimeout(() => {
        scrollDown();
      }, 1);
    }
  },
);

function scrollDown() {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value?.scrollHeight;
    lastScrollPosition = logContainer.value.scrollTop;
  }
}
</script>

<template>
  <div
    v-if="props.log"
    ref="logContainer"
    :style="{
      '--cell-width': `${props.log.length.toString().length * 0.25 + 1}rem`,
      'max-height': `${props.maxHeight}`,
    }"
    class="w-full h-full whitespace-nowrap bg-background border-border text-base text-foreground/70 overflow-scroll rounded select-text"
    :class="{ 'border p-3': !props.borderless }"
  >
    <span v-for="(prepareLog, index) of preparedLogs" :key="index" class="w-full flex gap-0.5">
      <span
        v-if="!borderless"
        class="text-foreground/30 font-mono me-2 text-right w-[--cell-width] min-w-[--cell-width] tabular-nums"
        >{{ index }}</span
      >
      <span v-if="prepareLog?.time" class="text-foreground/30 font-mono me-2">{{
        $dayjs(prepareLog.time).format('DD.MM.YYYY - HH:mm:ss')
      }}</span>
      <span
        class="font-mono"
        :class="
          prepareLog.type === 'ERROR'
            ? 'text-red-600'
            : ['EVENT', 'INFO'].includes(prepareLog.type)
              ? 'text-cyan-600'
              : prepareLog.type === 'SUCCESS'
                ? 'text-primary-600'
                : undefined
        "
        v-html="prepareLog.logLine"
      ></span>
    </span>
    <span v-if="running" class="ms-4 w-full flex gap-2">
      <span class="text-xl animate-pulse duration-200">.</span>
      <span class="text-xl [animation-delay:_200ms] animate-pulse duration-300">.</span>
      <span class="text-xl [animation-delay:_400ms] animate-pulse duration-400">.</span>
    </span>
  </div>
</template>
