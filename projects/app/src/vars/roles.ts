import type { FormOptions } from '~/interfaces/form-options.interface';

export type EnumKeys<T extends Record<string, any>> = T[keyof T];

type DeployRoleEnumKeys = EnumKeys<typeof DeployRoleEnum>;

export enum DeployRoleEnum {
  ADMIN = 'admin',
  MAINTAINER = 'maintainer',
  OWNER = 'owner',
  VIEWER = 'viewer',
}

export const roles: Record<DeployRoleEnum, string> = {
  [DeployRoleEnum.ADMIN]: 'Admin',
  [DeployRoleEnum.MAINTAINER]: 'Maintainer',
  [DeployRoleEnum.OWNER]: 'Owner',
  [DeployRoleEnum.VIEWER]: 'Viewer',
};

export function getRolesOptions(): FormOptions[] {
  return Object.keys(roles).map((key) => ({
    label: roles[key as DeployRoleEnumKeys],
    value: key,
  }));
}
