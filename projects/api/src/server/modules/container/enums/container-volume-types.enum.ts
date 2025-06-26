import {registerEnumType} from "@nestjs/graphql";

export enum ContainerVolumeType {
  DIRECTORY_MOUNT = 'DIRECTORY_MOUNT',
}

registerEnumType(ContainerVolumeType, {
  name: 'ContainerVolumeType',
  description: 'Volume types of Container',
});
