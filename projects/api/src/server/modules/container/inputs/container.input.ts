import {CoreInput, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {IsOptional} from 'class-validator';
import {BasicAuthInput} from './basic-auth.input';
import {ContainerStatus} from '../enums/container-status.enum';
import {ContainerType} from '../enums/container-type.enum';
import {DatabaseType} from "../enums/database-type.enum";
import {ServiceType} from "../enums/service-type.enum";
import {AllContainerTypes} from "../enums/all-container-types.enum";
import {DeploymentType} from "../enums/deployment-type.enum";
import {ContainerVolumeInput} from './container-volume.input';

/**
 * Container input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to update an existing Container' })
export class ContainerInput extends CoreInput {
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'autoDeploy of Container',
    nullable: true,
  })
  @IsOptional()
  autoDeploy?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'source of Container',
    nullable: true,
  })
  @IsOptional()
  source?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'repositoryUrl of Container',
    nullable: true,
  })
  @IsOptional()
  repositoryUrl?: string = undefined;

  @IsOptional()
  restoreRunning?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'repositoryId of Container',
    nullable: true,
  })
  @IsOptional()
  repositoryId?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'webhookId of Container',
    nullable: true,
  })
  @IsOptional()
  webhookId?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Container',
    nullable: true,
  })
  @IsOptional()
  name?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Url of Container',
    nullable: true,
  })
  @IsOptional()
  url?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'lastBuild of Container',
    nullable: true,
  })
  @IsOptional()
  lastBuild?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Registry of Container',
    nullable: true,
  })
  @IsOptional()
  registry?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'content of env',
    nullable: true,
  })
  @IsOptional()
  env?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'branch of container',
    nullable: true,
  })
  @IsOptional()
  branch?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'tag of container',
    nullable: true,
  })
  @IsOptional()
  tag?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'Ssl of Container',
    nullable: true,
  })
  @IsOptional()
  ssl?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'Www of Container',
    nullable: true,
  })
  @IsOptional()
  www?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'compress of Container',
    nullable: true,
  })
  @IsOptional()
  compress?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'isCustomRule of Container',
    nullable: true,
  })
  @IsOptional()
  isCustomRule?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'BuildImage of Container',
    nullable: true,
  })
  @IsOptional()
  buildImage?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customImageCommands of Container',
    nullable: true,
  })
  @IsOptional()
  customImageCommands?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customDockerfile of Container',
    nullable: true,
  })
  @IsOptional()
  customDockerfile?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customDockerCompose of Container',
    nullable: true,
  })
  @IsOptional()
  customDockerCompose?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => DeploymentType, {
    description: 'deploymentType of Container',
    nullable: true,
  })
  @IsOptional()
  deploymentType?: DeploymentType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => AllContainerTypes, {
    description: 'Type of Container',
    nullable: true,
  })
  @IsOptional()
  type?: ContainerType | DatabaseType | ServiceType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Port of Container',
    nullable: true,
  })
  @IsOptional()
  port?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Number, {
    description: 'maxMemory of Container',
    nullable: true,
  })
  @IsOptional()
  maxMemory?: number = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'ExposedPort of Container',
    nullable: true,
  })
  @IsOptional()
  exposedPort?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'InstallCmd of Container',
    nullable: true,
  })
  @IsOptional()
  installCmd?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'BuildCmd of Container',
    nullable: true,
  })
  @IsOptional()
  buildCmd?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'StartCmd of Container',
    nullable: true,
  })
  @IsOptional()
  startCmd?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'healthCheckCmd of Container',
    nullable: true,
  })
  @IsOptional()
  healthCheckCmd?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'BaseDir of Container',
    nullable: true,
  })
  @IsOptional()
  baseDir?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => BasicAuthInput, {
    description: 'basicAuth of Container',
    nullable: true,
  })
  @IsOptional()
  basicAuth?: BasicAuthInput = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => ContainerStatus, {
    description: 'status of Container',
    nullable: true,
  })
  @IsOptional()
  status?: ContainerStatus = undefined;

  lastDeployedAt?: Date = undefined;
  lastEditedAt?: Date = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [ContainerVolumeInput], {
    description: 'volumes of Container',
    nullable: true,
  })
  @IsOptional()
  volumes?: ContainerVolumeInput[] = undefined;
}
