<script setup lang="ts">
const props = defineProps<{
  options: ApexCharts.ApexOptions;
}>();
const chartEl = ref<HTMLElement>();
let chart: ApexCharts;
onMounted(() => {
  import('apexcharts').then((v) => {
    const ApexCharts = v.default;
    chart = new ApexCharts(chartEl.value!, props.options);
    chart.render();
  });
});

watch(
  () => props.options,
  () => {
    if (!chart) {
      return;
    }

    chart.updateOptions(props.options);
  },
  { deep: true },
);
</script>

<template>
  <div ref="chartEl"></div>
</template>
