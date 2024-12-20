import { logicAnd } from '@vueuse/math';

import ModalApiKey from '~/components/Modals/ModalApiKey.vue';
import ModalContainer from '~/components/Modals/ModalContainer.vue';
import InviteModal from '~/components/Modals/ModalInvite.vue';
import ModalNewProject from '~/components/Modals/ModalProject.vue';
import ModalRegistry from '~/components/Modals/ModalRegistry.vue';
import ModalSource from '~/components/Modals/ModalSource.vue';

export function useBackgroundKeys() {
  const { open } = useModal();
  const { a, c, current, d, m, p, r, s } = useMagicKeys();
  const activeElement = useActiveElement();
  const notUsingInput = computed(
    () => activeElement.value?.tagName !== 'INPUT' && activeElement.value?.tagName !== 'TEXTAREA',
  );
  const onlyOnKey = computed(() => Array.from(current)?.length === 1);

  function init() {
    initProject();
    initSource();
    initRegistry();
    initContainer();
    initMembers();
    initApiKey();
  }

  function initProject() {
    whenever(logicAnd(p, notUsingInput, onlyOnKey), () => {
      open({ component: ModalNewProject });
    });
  }

  function initSource() {
    whenever(logicAnd(s, notUsingInput, onlyOnKey), () => {
      open({ component: ModalSource });
    });
  }

  function initRegistry() {
    whenever(logicAnd(r, notUsingInput, onlyOnKey), () => {
      open({ component: ModalRegistry });
    });
  }

  function initContainer() {
    whenever(logicAnd(c, notUsingInput, onlyOnKey), () => {
      open({ component: ModalContainer });
    });
  }

  function initMembers() {
    whenever(logicAnd(m, notUsingInput, onlyOnKey), () => {
      open({ component: InviteModal });
    });
  }

  function initApiKey() {
    whenever(logicAnd(a, notUsingInput, onlyOnKey), () => {
      open({ component: ModalApiKey });
    });
  }

  return { init };
}
