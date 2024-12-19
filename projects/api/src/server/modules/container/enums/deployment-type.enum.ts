import {registerEnumType} from '@nestjs/graphql';

export enum DeploymentType {
  BRANCH = 'BRANCH',
  TAG = 'TAG',
}

registerEnumType(DeploymentType, {
  name: 'DeploymentType',
  description: 'Deployment types of Container',
});
