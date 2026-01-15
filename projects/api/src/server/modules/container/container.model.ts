import {mapClasses, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema as MongooseSchema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema} from 'mongoose';
import {PersistenceModel} from '../../common/models/persistence.model';
import {Registry} from '../registry/registry.model';
import {BasicAuth} from './basic-auth.model';
import {ContainerStatus} from './enums/container-status.enum';
import {ContainerType} from './enums/container-type.enum';
import {ContainerKind} from "./enums/container-kind.enum";
import {ServiceType} from "./enums/service-type.enum";
import {DatabaseType} from "./enums/database-type.enum";
import {AllContainerTypes} from "./enums/all-container-types.enum";
import {ContainerHealthStatus} from "./enums/container-health-status.enum";
import {Build} from "../build/build.model";
import {Source} from "../source/source.model";
import {DeploymentType} from "./enums/deployment-type.enum";
import {TagMatchType} from "./enums/tag-match-type.enum";
import {ContainerVolume} from "./container-volume.model";

export type ContainerDocument = Container & Document;

/**
 * Container model
 */
@Restricted(RoleEnum.ADMIN)
@ObjectType({description: 'Container'})
@MongooseSchema({timestamps: true})
export class Container extends PersistenceModel {
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'autoDeploy of Container',
    nullable: true,
  })
  @Prop({default: true})
  autoDeploy: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Source, {
    description: 'Source of Container',
    nullable: true,
  })
  @Prop({type: Schema.Types.ObjectId, ref: 'Source'})
  source: string | Source = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'repositoryUrl of Container',
    nullable: true,
  })
  @Prop()
  repositoryUrl: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'repositoryId of Container',
    nullable: true,
  })
  @Prop()
  repositoryId: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'webhookId of Container',
    nullable: true,
  })
  @Prop()
  webhookId: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'content of env',
    nullable: true,
  })
  @Prop()
  env: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'branch of Container',
    nullable: true,
  })
  @Prop()
  branch?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'tag of Container',
    nullable: true,
  })
  @Prop()
  tag?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => DeploymentType, {
    description: 'deploymentType of Container',
    nullable: true,
  })
  @Prop({default: DeploymentType.BRANCH})
  deploymentType: DeploymentType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => TagMatchType, {
    description: 'tagMatchType of Container',
    nullable: true,
  })
  @Prop({default: TagMatchType.EXACT})
  tagMatchType?: TagMatchType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'tagPattern of Container',
    nullable: true,
  })
  @Prop()
  tagPattern?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => ContainerHealthStatus, {
    description: 'healthStatus of Container',
    nullable: true,
  })
  healthStatus: ContainerHealthStatus = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'name of Container',
    nullable: false,
  })
  @Prop()
  name: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'url of Container',
    nullable: true,
  })
  @Prop()
  url?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Build, {
    description: 'last build of Container',
    nullable: true,
  })
  @Prop({type: Schema.Types.ObjectId, ref: 'Build'})
  lastBuild?: string | Build = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Registry, {
    description: 'registry of Container',
    nullable: true,
  })
  @Prop({type: Schema.Types.ObjectId, ref: 'Registry'})
  registry?: string | Registry = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'ssl of Container',
    nullable: true,
  })
  @Prop({default: true})
  ssl: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'www of Container',
    nullable: true,
  })
  @Prop({default: false})
  www: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'compress of Container',
    nullable: true,
  })
  @Prop({default: true})
  compress: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'passHostHeader of Container',
    nullable: true,
  })
  @Prop({default: true})
  passHostHeader: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'isCustomRule of Container',
    nullable: true,
  })
  @Prop({default: false})
  isCustomRule: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'logs of Container',
    nullable: true,
  })
  @Prop({ default: [] })
  logs: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'buildImage of Container',
    nullable: true,
  })
  @Prop()
  buildImage: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customImageCommands of Container',
    nullable: true,
  })
  @Prop()
  customImageCommands: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customDockerfile of Container',
    nullable: true,
  })
  @Prop()
  customDockerfile: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'customDockerCompose of Container',
    nullable: true,
  })
  @Prop()
  customDockerCompose: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => ContainerKind, {
    description: 'kind of Container',
    nullable: false,
  })
  @Prop({default: ContainerKind.APPLICATION})
  kind: ContainerKind = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => AllContainerTypes, {
    description: 'type of Container',
    nullable: true,
  })
  @Prop()
  type: ContainerType | DatabaseType | ServiceType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'port of Container',
    nullable: true,
  })
  @Prop()
  port: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Number, {
    description: 'maxMemory of Container',
    nullable: true,
  })
  @Prop()
  maxMemory: number = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'exposedPort of Container',
    nullable: true,
  })
  @Prop()
  exposedPort: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'installCmd of Container',
    nullable: true,
  })
  @Prop()
  installCmd: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'buildCmd of Container',
    nullable: true,
  })
  @Prop()
  buildCmd: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'startCmd of Container',
    nullable: true,
  })
  @Prop()
  startCmd: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'healthCheckCmd of Container',
    nullable: true,
  })
  @Prop()
  healthCheckCmd: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'baseDir of Container',
    nullable: true,
  })
  @Prop()
  baseDir: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => BasicAuth, {
    description: 'basicAuth of Container',
    nullable: true,
  })
  @Prop()
  basicAuth: BasicAuth = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => ContainerStatus, {
    description: 'status of Container',
    nullable: true,
  })
  @Prop({default: ContainerStatus.DRAFT, index: true})
  status: ContainerStatus = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field({ description: 'lastLogsFrom date', nullable: true })
  @Prop()
  lastLogsFrom: Date = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field({ description: 'lastDeployedAt date', nullable: true })
  @Prop()
  lastDeployedAt: Date = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field({ description: 'lastEditedAt date', nullable: true })
  @Prop()
  lastEditedAt: Date = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [ContainerVolume], { description: 'Volumes of container', nullable: true })
  @Prop()
  volumes?: ContainerVolume[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Skip CI patterns for this container',
    nullable: true,
  })
  @Prop({ default: ['[skip ci]', '[ci skip]', '[no ci]', '[skip build]'] })
  skipCiPatterns?: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Additional Docker networks to connect to',
    nullable: true,
  })
  @Prop({ default: [] })
  additionalNetworks?: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Default server for Adminer login',
    nullable: true,
  })
  @Prop()
  adminerDefaultServer?: string = undefined;

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  /**
   * Initialize instance with default values instead of undefined
   */
  override init() {
    super.init();
    // this.xxx = [];
    return this;
  }

  /**
   * Map input
   *
   * Hint: Non-primitive variables should always be mapped (see mapClasses / mapClassesAsync in ModelHelper)
   */
  override map(input: any) {
    super.map(input);
    return mapClasses(input, {registry: Registry, lastBuild: Build, source: Source}, this);
  }
}

export const ContainerSchema = SchemaFactory.createForClass(Container);
