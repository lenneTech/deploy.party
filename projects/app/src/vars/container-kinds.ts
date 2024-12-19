import type { FormOptions } from '~/interfaces/form-options.interface';

import { ContainerKind } from '~/base/default';

export type EnumKeys<T extends Record<string, any>> = T[keyof T];

type ContainerKindEnumKeys = EnumKeys<typeof ContainerKind>;

export const kinds: Record<ContainerKind, string> = {
  [ContainerKind.APPLICATION]: 'Application',
  [ContainerKind.CUSTOM]: 'Custom',
  [ContainerKind.DATABASE]: 'Database',
  [ContainerKind.SERVICE]: 'Service',
};

export function getKindsOptions(): FormOptions[] {
  return Object.keys(kinds).map((key) => ({
    label: kinds[key as ContainerKind],
    value: key,
  }));
}
