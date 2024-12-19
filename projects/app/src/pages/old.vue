<script setup lang="ts">
import Chart from '~/components/Chart.client.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Dashboard | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Dashboard',
});

const { teamState } = useTeamState();
const { $pwa } = useNuxtApp();
const cpuSeries = ref<any>([
  {
    data: [],
  },
]);
const memorySeries = ref<any>([
  {
    data: [],
  },
]);
const chartOptions = computed<ApexCharts.ApexOptions>(() => {
  return {
    chart: {
      height: 350,
      skipClone: true,
      toolbar: {
        autoSelected: 'pan',
        show: false,
      },
      type: 'area',
      zoom: {
        enabled: false,
      },
    },
    colors: ['#73F79E'],
    credits: {
      enabled: false,
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 0.1,
      type: 'solid',
    },
    grid: {
      show: false,
    },
    legend: {
      show: false,
    },
    markers: {
      size: 0,
    },
    series: cpuSeries.value,
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    tooltip: {
      enabled: false,
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: {
        show: false,
      },
      endOnTick: false,
      labels: {
        show: false,
        style: {
          colors: '#fff',
        },
      },
      startOnTick: false,
      type: 'datetime',
    },
    yaxis: {
      axisBorder: { show: false },
      axisTicks: {
        show: false,
      },
      endOnTick: false,
      labels: {
        formatter: function (value) {
          return Number(value).toFixed() + '%';
        },
        show: true,
        style: {
          colors: '#fff',
        },
      },
      startOnTick: false,
      stepSize: 10,
      type: 'numeric',
    },
  };
});
const chartMemoryOptions = computed<ApexCharts.ApexOptions>(() => {
  return {
    chart: {
      height: 350,
      skipClone: true,
      toolbar: {
        autoSelected: 'pan',
        show: false,
      },
      type: 'area',
      zoom: {
        enabled: false,
      },
    },
    colors: ['#73F79E'],
    credits: {
      enabled: false,
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 0.1,
      type: 'solid',
    },
    grid: {
      show: false,
    },
    legend: {
      show: false,
    },
    markers: {
      size: 0,
    },
    series: memorySeries.value,
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    tooltip: {
      enabled: false,
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: {
        show: false,
      },
      endOnTick: false,
      labels: {
        show: false,
        style: {
          colors: '#fff',
        },
      },
      startOnTick: false,
      type: 'datetime',
    },
    yaxis: {
      axisBorder: { show: false },
      axisTicks: {
        show: false,
      },
      endOnTick: false,
      labels: {
        formatter: function (value) {
          return Number(value).toFixed() + 'GB';
        },
        show: true,
        style: {
          colors: '#fff',
        },
      },
      startOnTick: false,
      type: 'numeric',
    },
  };
});

const { data, pending, refresh } = await useGetSystemStatsQuery(
  { id: teamState.value.id },
  [
    'cpu',
    'memory',
    'totalMemory',
    'uptime',
    { containers: ['id', 'name', 'cpuPercent', 'memPercent', 'restartCount', 'state', 'started'] },
  ],
  true,
);
const stats = computed(() => data?.value?.getSystemStats);

useIntervalFn(async () => {
  await refresh();

  if (cpuSeries.value[0].data?.length > 50) {
    cpuSeries.value[0].data.shift();
  }
  cpuSeries.value[0].data.push([Date.now(), stats.value?.cpu || 0] as any);

  if (memorySeries.value[0].data?.length > 50) {
    memorySeries.value[0].data.shift();
  }
  memorySeries.value[0].data.push([Date.now(), stats.value?.memory || 0] as any);
}, 20000);

onMounted(() => {
  $pwa.subscribe();

  if ($pwa && $pwa?.isPwa() && navigator?.clearAppBadge) {
    navigator.clearAppBadge();
  }
});

function timeAgo(timestamp: string) {
  const date = Number(timestamp) * 1000;
  return useTimeAgo(new Date(date)).value;
}
</script>

<template>
  <div class="pt-[65px] p-5 w-full">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 py-4">
      <Card name="CPU" :pending="pending && !stats"> {{ stats?.cpu }} % </Card>
      <Card name="Memory" :pending="pending && !stats"> {{ stats?.memory }} / {{ stats?.totalMemory }} GB </Card>
      <Card name="Uptime" :pending="pending && !stats">
        {{ stats?.uptime }}
      </Card>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card name="CPU" :pending="pending && !stats">
        <Chart :options="chartOptions" />
      </Card>
      <Card name="Memory" :pending="pending && !stats">
        <Chart :options="chartMemoryOptions" />
      </Card>
    </div>
    <div class="py-4">
      <Card :pending="pending && !stats" class="w-full">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="text-sm font-medium leading-6 text-gray-400">
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">CPU</th>
                <th class="text-left">Memory</th>
                <th class="text-left">State</th>
                <th class="text-left">Started</th>
                <th class="text-left">Restart count</th>
              </tr>
            </thead>
            <tbody v-if="stats?.containers?.length" class="text-sm font-light">
              <tr v-for="container of stats?.containers" :key="container.id">
                <td>{{ container.name }}</td>
                <td>{{ container.cpuPercent }} %</td>
                <td>{{ container.memPercent }} %</td>
                <td>{{ container.state }}</td>
                <td>{{ timeAgo(container.started) }}</td>
                <td>{{ container.restartCount }}</td>
              </tr>
            </tbody>
            <tbody v-else class="flex items-center justify-center text-sm font-light">
              <tr class="w-full">
                <td colspan="3">no container founds</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
