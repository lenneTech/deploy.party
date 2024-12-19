import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {IsOptional} from 'class-validator';
import {ContainerType} from '../enums/container-type.enum';
import {ContainerInput} from './container.input';
import {ContainerKind} from "../enums/container-kind.enum";
import {DatabaseType} from "../enums/database-type.enum";
import {ServiceType} from "../enums/service-type.enum";
import {AllContainerTypes} from "../enums/all-container-types.enum";
import {DeploymentType} from "../enums/deployment-type.enum";

/**
 * Container create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to create a new Container' })
export class ContainerCreateInput extends ContainerInput {
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'autoDeploy of Container',
    nullable: true,
  })
  @IsOptional()
  override autoDeploy?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'source of Container',
    nullable: true,
  })
  @IsOptional()
  override source?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'branch of Container',
    nullable: true,
  })
  @IsOptional()
  override branch?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'tag of Container',
    nullable: true,
  })
  @IsOptional()
  override tag?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => DeploymentType, {
    description: 'deploymentType of Container',
    nullable: true,
  })
  @IsOptional()
  override deploymentType?: DeploymentType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'repositoryUrl of Container',
    nullable: true,
  })
  override repositoryUrl?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'repositoryId of Container',
    nullable: true,
  })
  override repositoryId?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'webhookId of Container',
    nullable: true,
  })
  override webhookId?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'content of env',
    nullable: true,
  })
  @IsOptional()
  override env?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Container',
    nullable: false,
  })
  override name: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Url of Container',
    nullable: true,
  })
  override url?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Registry of Container',
    nullable: true,
  })
  @IsOptional()
  override registry?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'Ssl of Container',
    nullable: true,
  })
  override ssl?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'Www of Container',
    nullable: true,
  })
  override www?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'compress of Container',
    nullable: true,
  })
  override compress?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'isCustomRule of Container',
    nullable: true,
  })
  override isCustomRule?: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'BuildImage of Container',
    nullable: true,
  })
  override buildImage?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customImageCommands of Container',
    nullable: true,
  })
  override customImageCommands?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customDockerfile of Container',
    nullable: true,
  })
  override customDockerfile?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customDockerCompose of Container',
    nullable: true,
  })
  override customDockerCompose?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => ContainerKind, {
    description: 'Kind of Container',
    nullable: false,
  })
  kind: ContainerKind = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => AllContainerTypes, {
    description: 'Type of Container',
    nullable: true,
  })
  override type?: ContainerType | DatabaseType | ServiceType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Port of Container',
    nullable: true,
  })
  override port?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Number, {
    description: 'maxMemory of Container',
    nullable: true,
  })
  override maxMemory?: number = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'ExposedPort of Container',
    nullable: true,
  })
  @IsOptional()
  override exposedPort?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'InstallCmd of Container',
    nullable: true,
  })
  @IsOptional()
  override installCmd?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'BuildCmd of Container',
    nullable: true,
  })
  @IsOptional()
  override buildCmd?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'StartCmd of Container',
    nullable: true,
  })
  @IsOptional()
  override startCmd?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'healthCheckCmd of Container',
    nullable: true,
  })
  @IsOptional()
  override healthCheckCmd?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'BaseDir of Container',
    nullable: true,
  })
  @IsOptional()
  override baseDir?: string = undefined;
}
