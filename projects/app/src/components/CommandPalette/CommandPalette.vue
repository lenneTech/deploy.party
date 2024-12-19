<script setup lang="ts">
import CommandPaletteItem from '~/components/CommandPalette/CommandPaletteItem.vue';
import ModalProject from '~/components/Modals/ModalProject.vue';
import TransitionFade from '~/transitions/TransitionFade.vue';
import TransitionFadeScale from '~/transitions/TransitionFadeScale.vue';

export interface CommandOption {
  action: 'modal' | 'navigate';
  dependsOn?: string;
  icon: string;
  label: string;
  modalOpen?: () => void;
  route?: string;
  shortcut: string;
}
let changedBlocked = false;
const show = ref<boolean>(false);
const { open } = useModal();
const options = ref<CommandOption[]>([
  {
    action: 'modal',
    icon: '',
    label: 'Create project...',
    modalOpen: () => {
      open({ component: ModalProject });
    },
    shortcut: 'P',
  },
  {
    action: 'navigate',
    icon: '',
    label: 'Create registry...',
    route: '/registries/new',
    shortcut: 'R',
  },
  {
    action: 'navigate',
    dependsOn: 'container',
    icon: '',
    label: 'Show builds',
    route: '/registries/new',
    shortcut: 'B',
  },
]);
const activeOptionIndex = ref<number>(null);
const input = ref(null);
const { down, enter, escape, k, meta, up } = useMagicKeys();
const router = useRouter();

watchEffect(() => {
  if (!show.value) {
    show.value = meta.value && k.value;
    setTimeout(() => {
      input.value?.focus();
    }, 300);
  } else {
    show.value = !escape.value;
  }
});

watch(enter, () => {
  if (show.value) {
    action(options.value[activeOptionIndex.value]);
  }
});

watch(down, () => {
  if (show.value) {
    changeOption('down');
  }
});

watch(up, () => {
  if (show.value) {
    changeOption('up');
  }
});

function close() {
  show.value = false;
}

function action(option: CommandOption) {
  switch (option.action) {
    case 'modal':
      option?.modalOpen();
      break;
    case 'navigate':
      router.push({ path: option.route });
      break;
  }

  close();
}

function changeOption(mode: 'down' | 'up') {
  if (changedBlocked) {
    return;
  }
  changedBlocked = true;
  setTimeout(() => {
    input.value?.blur();
  }, 200);

  if (mode === 'down' && activeOptionIndex.value === null) {
    activeOptionIndex.value = 0;
  } else if (mode === 'up' && activeOptionIndex.value === null) {
    activeOptionIndex.value = options.value.length - 1;
  } else if (mode === 'down' && activeOptionIndex.value + 1 >= options.value.length) {
    activeOptionIndex.value = 0;
  } else if (mode === 'up' && activeOptionIndex.value - 1 < 0) {
    activeOptionIndex.value = options.value.length - 1;
  } else if (mode === 'down') {
    activeOptionIndex.value = activeOptionIndex.value + 1;
  } else if (mode === 'up') {
    activeOptionIndex.value = activeOptionIndex.value - 1;
  }

  setTimeout(() => {
    changedBlocked = false;
  }, 200);
}
</script>

<template>
  <Teleport to="body">
    <TransitionFade leave-duration="40">
      <div v-if="show" class="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity z-[50000]"></div>
    </TransitionFade>

    <TransitionFadeScale>
      <div v-if="show" class="fixed inset-0 overflow-y-auto p-4 sm:p-6 md:p-20 z-[50001]" @click="close()">
        <div
          class="mx-auto max-w-2xl transform divide-y divide-gray-500 divide-opacity-20 overflow-hidden rounded-xl bg-secondary shadow-2xl transition-all"
          @click.stop
        >
          <div class="relative">
            <svg
              class="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              ref="input"
              type="text"
              class="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-white focus:ring-0 sm:text-sm"
              placeholder="Search..."
              @keyup.enter="close()"
            />
          </div>

          <!-- Default state, show/hide based on command palette state. -->
          <ul role="listbox" class="max-h-80 scroll-py-2 divide-y divide-gray-500 divide-opacity-20 overflow-y-auto">
            <!--            <li class="p-2"> -->
            <!--              <h2 class="mb-2 mt-4 px-3 text-xs font-semibold text-gray-200"> -->
            <!--                Recent searches -->
            <!--              </h2> -->
            <!--              <ul class="text-sm text-gray-400"> -->
            <!--                &lt;!&ndash; Active: "bg-gray-800 text-white" &ndash;&gt; -->
            <!--                <CommandPaletteItem :option="options[0]" @click="action(options[0])" @close="close" /> -->
            <!--              </ul> -->
            <!--            </li> -->
            <li class="p-2">
              <h2 class="sr-only">Commands</h2>
              <ul class="text-sm text-gray-400">
                <CommandPaletteItem
                  v-for="(option, index) of options"
                  :key="option.label"
                  :option="option"
                  :selected="activeOptionIndex === index"
                  @click="action(option)"
                  @mouseover="activeOptionIndex = index"
                />
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </TransitionFadeScale>
  </Teleport>
</template>
