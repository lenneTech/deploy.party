export type Maybe<T> = T;
export type InputMaybe<T> = T;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = { [SubKey in K]?: Maybe<T[SubKey]> } & Omit<T, K>;
export type MakeMaybe<T, K extends keyof T> = { [SubKey in K]: Maybe<T[SubKey]> } & Omit<T, K>;
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never } | T;
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  /** Any scalar type */
  Any: { input: any; output: any };
  Boolean: { input: boolean; output: boolean };
  /** Date custom scalar type */
  Date: { input: any; output: any };
  Float: { input: number; output: number };
  ID: { input: string; output: string };
  Int: { input: number; output: number };
  /** JSON scalar type. Information on the exact schema of the JSON object is contained in the description of the field. */
  JSON: { input: any; output: any };
  String: { input: string; output: string };
  /** The `Upload` scalar type represents a file upload. */
  Upload: { input: any; output: any };
}

/** All Types of Container */
export enum AllContainerTypes {
  ADMINER = 'ADMINER',
  CHOUSE_UI = 'CHOUSE_UI',
  CLICKHOUSE_UI = 'CLICKHOUSE_UI',
  CUSTOM = 'CUSTOM',
  DIRECTUS = 'DIRECTUS',
  MARIA_DB = 'MARIA_DB',
  MONGO = 'MONGO',
  MONGO_EXPRESS = 'MONGO_EXPRESS',
  NODE = 'NODE',
  PLAUSIBLE = 'PLAUSIBLE',
  REDIS_UI = 'REDIS_UI',
  ROCKET_ADMIN = 'ROCKET_ADMIN',
  STATIC = 'STATIC',
}

/** ApiKey */
export interface ApiKey {
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** ExpiredAt of ApiKey */
  expiredAt?: Maybe<Scalars['Float']['output']>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** Key of ApiKey */
  key: Scalars['String']['output'];
  /** Name of ApiKey */
  name?: Maybe<Scalars['String']['output']>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
}

/** Input data to create a new ApiKey */
export interface ApiKeyCreateInput {
  /** ExpiredAt of ApiKey */
  expiredAt?: InputMaybe<Scalars['Float']['input']>;
  /** Name of ApiKey */
  name: Scalars['String']['input'];
}

/** Authentication data */
export interface Auth {
  /** Refresh token */
  refreshToken?: Maybe<Scalars['String']['output']>;
  /** JavaScript Web Token (JWT) */
  token?: Maybe<Scalars['String']['output']>;
  /** User who signed in */
  user: User;
}

/** Sign-in input */
export interface AuthSignInInput {
  /** Device description */
  deviceDescription?: InputMaybe<Scalars['String']['input']>;
  /** Device ID (is created automatically if it is not set) */
  deviceId?: InputMaybe<Scalars['String']['input']>;
  /** Email */
  email: Scalars['String']['input'];
  /** Password */
  password: Scalars['String']['input'];
}

/** Sign-up input */
export interface AuthSignUpInput {
  /** Device description */
  deviceDescription?: InputMaybe<Scalars['String']['input']>;
  /** Device ID (is created automatically if it is not set) */
  deviceId?: InputMaybe<Scalars['String']['input']>;
  /** Email */
  email: Scalars['String']['input'];
  /** firstName */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** lastName */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Password */
  password: Scalars['String']['input'];
}

/** Backup */
export interface Backup {
  /** Active of Backup */
  active: Scalars['Boolean']['output'];
  /** Bucket of Backup */
  bucket?: Maybe<Scalars['String']['output']>;
  /** Container of Backup */
  container: Container;
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** CronExpression of Backup */
  cronExpression?: Maybe<Scalars['String']['output']>;
  /** Host of Backup */
  host?: Maybe<Scalars['String']['output']>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** Key of Backup */
  key?: Maybe<Scalars['String']['output']>;
  /** Last backup date */
  lastBackup?: Maybe<Scalars['Date']['output']>;
  /** Log of last backup */
  log?: Maybe<Array<Scalars['String']['output']>>;
  /** Last backup date */
  maxBackups?: Maybe<Scalars['Float']['output']>;
  /** path of Backup */
  path?: Maybe<Scalars['String']['output']>;
  /** Region of Backup */
  region?: Maybe<Scalars['String']['output']>;
  /** Restore log of last backup */
  restoreLog?: Maybe<Array<Scalars['String']['output']>>;
  /** Secret of Backup */
  secret?: Maybe<Scalars['String']['output']>;
  /** Type of backup */
  type?: Maybe<BackupType>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
}

/** Input data to create a new Backup */
export interface BackupCreateInput {
  /** Active of Backup */
  active: Scalars['Boolean']['input'];
  /** Bucket of Backup */
  bucket?: InputMaybe<Scalars['String']['input']>;
  /** Container for Backup */
  container: Scalars['String']['input'];
  /** CronExpression of Backup */
  cronExpression?: InputMaybe<Scalars['String']['input']>;
  /** Host of Backup */
  host?: InputMaybe<Scalars['String']['input']>;
  /** Key of Backup */
  key?: InputMaybe<Scalars['String']['input']>;
  /** Date of last Backup */
  lastBuild?: InputMaybe<Scalars['Date']['input']>;
  /** Log of last Backup */
  log?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Max count of Backups */
  maxBackups?: InputMaybe<Scalars['Float']['input']>;
  /** path of Backup */
  path?: InputMaybe<Scalars['String']['input']>;
  /** Region of Backup */
  region?: InputMaybe<Scalars['String']['input']>;
  /** restoreLog of last Backup */
  restoreLog?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Secret of Backup */
  secret?: InputMaybe<Scalars['String']['input']>;
  /** Type of backup */
  type?: InputMaybe<BackupType>;
}

/** Input data to update an existing Backup */
export interface BackupInput {
  /** Active of Backup */
  active?: InputMaybe<Scalars['Boolean']['input']>;
  /** Bucket of Backup */
  bucket?: InputMaybe<Scalars['String']['input']>;
  /** CronExpression of Backup */
  cronExpression?: InputMaybe<Scalars['String']['input']>;
  /** Host of Backup */
  host?: InputMaybe<Scalars['String']['input']>;
  /** Key of Backup */
  key?: InputMaybe<Scalars['String']['input']>;
  /** Date of last Backup */
  lastBuild?: InputMaybe<Scalars['Date']['input']>;
  /** Log of last Backup */
  log?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Max count of Backups */
  maxBackups?: InputMaybe<Scalars['Float']['input']>;
  /** path of Backup */
  path?: InputMaybe<Scalars['String']['input']>;
  /** Region of Backup */
  region?: InputMaybe<Scalars['String']['input']>;
  /** restoreLog of last Backup */
  restoreLog?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Secret of Backup */
  secret?: InputMaybe<Scalars['String']['input']>;
  /** Type of backup */
  type?: InputMaybe<BackupType>;
}

/** Type of Backup */
export enum BackupType {
  DATABASE = 'DATABASE',
  SERVICE = 'SERVICE',
  VOLUME = 'VOLUME',
}

/** Address Object that references the location */
export interface BasicAuth {
  /** password of BasicAuth */
  pw?: Maybe<Scalars['String']['output']>;
  /** username of BasicAuth */
  username?: Maybe<Scalars['String']['output']>;
}

/** Input data for basic auth */
export interface BasicAuthInput {
  /** password of address */
  pw?: InputMaybe<Scalars['String']['input']>;
  /** username of BasicAuth */
  username?: InputMaybe<Scalars['String']['input']>;
}

/** Build */
export interface Build {
  /** container of Build */
  container: Container;
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** Finished date */
  finishedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** log of Build */
  log?: Maybe<Array<Scalars['String']['output']>>;
  /** status of Build */
  status?: Maybe<BuildStatus>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
}

/** Input data to create a new Build */
export interface BuildCreateInput {
  /** Container of Build */
  container: Scalars['String']['input'];
  /** Log of Build */
  log?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Status of Build */
  status?: InputMaybe<BuildStatus>;
}

/** Input data to update an existing Build */
export interface BuildInput {
  /** Container of Build */
  container?: InputMaybe<Scalars['String']['input']>;
  /** Log of Build */
  log?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Status of Build */
  status?: InputMaybe<BuildStatus>;
}

/** Status of Build */
export enum BuildStatus {
  CANCEL = 'CANCEL',
  FAILED = 'FAILED',
  QUEUE = 'QUEUE',
  RUNNING = 'RUNNING',
  SKIPPED = 'SKIPPED',
  SUCCESS = 'SUCCESS',
}

/** Combination of multiple filters via logical operator */
export interface CombinedFilterInput {
  /** Filters to combine via logical operator */
  filters: Array<FilterInput>;
  /** Logical Operator to combine filters */
  logicalOperator: LogicalOperatorEnum;
}

/** [Comparison Operators](https://docs.mongodb.com/manual/reference/operator/query-comparison/) for filters */
export enum ComparisonOperatorEnum {
  EQ = 'EQ',
  GT = 'GT',
  GTE = 'GTE',
  IN = 'IN',
  LT = 'LT',
  LTE = 'LTE',
  NE = 'NE',
  NIN = 'NIN',
  REGEX = 'REGEX',
}

/** Container */
export interface Container {
  /** Additional Docker networks to connect to */
  additionalNetworks?: Maybe<Array<Scalars['String']['output']>>;
  /** autoDeploy of Container */
  autoDeploy?: Maybe<Scalars['Boolean']['output']>;
  /** baseDir of Container */
  baseDir?: Maybe<Scalars['String']['output']>;
  /** basicAuth of Container */
  basicAuth?: Maybe<BasicAuth>;
  /** branch of Container */
  branch?: Maybe<Scalars['String']['output']>;
  /** buildCmd of Container */
  buildCmd?: Maybe<Scalars['String']['output']>;
  /** buildImage of Container */
  buildImage?: Maybe<Scalars['String']['output']>;
  /** compress of Container */
  compress?: Maybe<Scalars['Boolean']['output']>;
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** customDockerCompose of Container */
  customDockerCompose?: Maybe<Scalars['String']['output']>;
  /** customDockerfile of Container */
  customDockerfile?: Maybe<Scalars['String']['output']>;
  /** customImageCommands of Container */
  customImageCommands?: Maybe<Scalars['String']['output']>;
  /** deploymentType of Container */
  deploymentType?: Maybe<DeploymentType>;
  /** content of env */
  env?: Maybe<Scalars['String']['output']>;
  /** exposedPort of Container */
  exposedPort?: Maybe<Scalars['String']['output']>;
  /** healthCheckCmd of Container */
  healthCheckCmd?: Maybe<Scalars['String']['output']>;
  /** healthStatus of Container */
  healthStatus?: Maybe<ContainerHealthStatus>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** installCmd of Container */
  installCmd?: Maybe<Scalars['String']['output']>;
  /** isCustomRule of Container */
  isCustomRule?: Maybe<Scalars['Boolean']['output']>;
  /** kind of Container */
  kind: ContainerKind;
  /** last build of Container */
  lastBuild?: Maybe<Build>;
  /** lastDeployedAt date */
  lastDeployedAt?: Maybe<Scalars['Date']['output']>;
  /** lastEditedAt date */
  lastEditedAt?: Maybe<Scalars['Date']['output']>;
  /** lastLogsFrom date */
  lastLogsFrom?: Maybe<Scalars['Date']['output']>;
  /** logs of Container */
  logs?: Maybe<Array<Scalars['String']['output']>>;
  /** maxMemory of Container */
  maxMemory?: Maybe<Scalars['Float']['output']>;
  /** name of Container */
  name: Scalars['String']['output'];
  /** passHostHeader of Container */
  passHostHeader?: Maybe<Scalars['Boolean']['output']>;
  /** port of Container */
  port?: Maybe<Scalars['String']['output']>;
  /** registry of Container */
  registry?: Maybe<Registry>;
  /** repositoryId of Container */
  repositoryId?: Maybe<Scalars['String']['output']>;
  /** repositoryUrl of Container */
  repositoryUrl?: Maybe<Scalars['String']['output']>;
  /** Skip CI patterns for this container */
  skipCiPatterns?: Maybe<Array<Scalars['String']['output']>>;
  /** Source of Container */
  source?: Maybe<Source>;
  /** ssl of Container */
  ssl?: Maybe<Scalars['Boolean']['output']>;
  /** startCmd of Container */
  startCmd?: Maybe<Scalars['String']['output']>;
  /** status of Container */
  status?: Maybe<ContainerStatus>;
  /** tag of Container */
  tag?: Maybe<Scalars['String']['output']>;
  /** tagMatchType of Container */
  tagMatchType?: Maybe<TagMatchType>;
  /** tagPattern of Container */
  tagPattern?: Maybe<Scalars['String']['output']>;
  /** type of Container */
  type?: Maybe<AllContainerTypes>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
  /** url of Container */
  url?: Maybe<Scalars['String']['output']>;
  /** Volumes of container */
  volumes?: Maybe<Array<ContainerVolume>>;
  /** webhookId of Container */
  webhookId?: Maybe<Scalars['String']['output']>;
  /** www of Container */
  www?: Maybe<Scalars['Boolean']['output']>;
}

/** Input data to create a new Container */
export interface ContainerCreateInput {
  /** Additional Docker networks to connect to */
  additionalNetworks?: InputMaybe<Array<Scalars['String']['input']>>;
  /** autoDeploy of Container */
  autoDeploy?: InputMaybe<Scalars['Boolean']['input']>;
  /** BaseDir of Container */
  baseDir?: InputMaybe<Scalars['String']['input']>;
  /** basicAuth of Container */
  basicAuth?: InputMaybe<BasicAuthInput>;
  /** branch of Container */
  branch?: InputMaybe<Scalars['String']['input']>;
  /** BuildCmd of Container */
  buildCmd?: InputMaybe<Scalars['String']['input']>;
  /** BuildImage of Container */
  buildImage?: InputMaybe<Scalars['String']['input']>;
  /** compress of Container */
  compress?: InputMaybe<Scalars['Boolean']['input']>;
  /** customDockerCompose of Container */
  customDockerCompose?: InputMaybe<Scalars['String']['input']>;
  /** customDockerfile of Container */
  customDockerfile?: InputMaybe<Scalars['String']['input']>;
  /** customImageCommands of Container */
  customImageCommands?: InputMaybe<Scalars['String']['input']>;
  /** deploymentType of Container */
  deploymentType?: InputMaybe<DeploymentType>;
  /** content of env */
  env?: InputMaybe<Scalars['String']['input']>;
  /** ExposedPort of Container */
  exposedPort?: InputMaybe<Scalars['String']['input']>;
  /** healthCheckCmd of Container */
  healthCheckCmd?: InputMaybe<Scalars['String']['input']>;
  /** InstallCmd of Container */
  installCmd?: InputMaybe<Scalars['String']['input']>;
  /** isCustomRule of Container */
  isCustomRule?: InputMaybe<Scalars['Boolean']['input']>;
  /** Kind of Container */
  kind: ContainerKind;
  /** lastBuild of Container */
  lastBuild?: InputMaybe<Scalars['String']['input']>;
  /** maxMemory of Container */
  maxMemory?: InputMaybe<Scalars['Float']['input']>;
  /** Name of Container */
  name: Scalars['String']['input'];
  /** passHostHeader of Container */
  passHostHeader?: InputMaybe<Scalars['Boolean']['input']>;
  /** Port of Container */
  port?: InputMaybe<Scalars['String']['input']>;
  /** Registry of Container */
  registry?: InputMaybe<Scalars['String']['input']>;
  /** repositoryId of Container */
  repositoryId?: InputMaybe<Scalars['String']['input']>;
  /** repositoryUrl of Container */
  repositoryUrl?: InputMaybe<Scalars['String']['input']>;
  /** Skip CI patterns for this container */
  skipCiPatterns?: InputMaybe<Array<Scalars['String']['input']>>;
  /** source of Container */
  source?: InputMaybe<Scalars['String']['input']>;
  /** Ssl of Container */
  ssl?: InputMaybe<Scalars['Boolean']['input']>;
  /** StartCmd of Container */
  startCmd?: InputMaybe<Scalars['String']['input']>;
  /** status of Container */
  status?: InputMaybe<ContainerStatus>;
  /** tag of Container */
  tag?: InputMaybe<Scalars['String']['input']>;
  /** tagMatchType of Container */
  tagMatchType?: InputMaybe<TagMatchType>;
  /** tagPattern of Container */
  tagPattern?: InputMaybe<Scalars['String']['input']>;
  /** Type of Container */
  type?: InputMaybe<AllContainerTypes>;
  /** Url of Container */
  url?: InputMaybe<Scalars['String']['input']>;
  /** volumes of Container */
  volumes?: InputMaybe<Array<ContainerVolumeInput>>;
  /** webhookId of Container */
  webhookId?: InputMaybe<Scalars['String']['input']>;
  /** Www of Container */
  www?: InputMaybe<Scalars['Boolean']['input']>;
}

/** Health status of Container */
export enum ContainerHealthStatus {
  HEALTHY = 'HEALTHY',
  IDLE = 'IDLE',
  STARTING = 'STARTING',
  UNHEALTHY = 'UNHEALTHY',
}

/** Input data to update an existing Container */
export interface ContainerInput {
  /** Additional Docker networks to connect to */
  additionalNetworks?: InputMaybe<Array<Scalars['String']['input']>>;
  /** autoDeploy of Container */
  autoDeploy?: InputMaybe<Scalars['Boolean']['input']>;
  /** BaseDir of Container */
  baseDir?: InputMaybe<Scalars['String']['input']>;
  /** basicAuth of Container */
  basicAuth?: InputMaybe<BasicAuthInput>;
  /** branch of container */
  branch?: InputMaybe<Scalars['String']['input']>;
  /** BuildCmd of Container */
  buildCmd?: InputMaybe<Scalars['String']['input']>;
  /** BuildImage of Container */
  buildImage?: InputMaybe<Scalars['String']['input']>;
  /** compress of Container */
  compress?: InputMaybe<Scalars['Boolean']['input']>;
  /** customDockerCompose of Container */
  customDockerCompose?: InputMaybe<Scalars['String']['input']>;
  /** customDockerfile of Container */
  customDockerfile?: InputMaybe<Scalars['String']['input']>;
  /** customImageCommands of Container */
  customImageCommands?: InputMaybe<Scalars['String']['input']>;
  /** deploymentType of Container */
  deploymentType?: InputMaybe<DeploymentType>;
  /** content of env */
  env?: InputMaybe<Scalars['String']['input']>;
  /** ExposedPort of Container */
  exposedPort?: InputMaybe<Scalars['String']['input']>;
  /** healthCheckCmd of Container */
  healthCheckCmd?: InputMaybe<Scalars['String']['input']>;
  /** InstallCmd of Container */
  installCmd?: InputMaybe<Scalars['String']['input']>;
  /** isCustomRule of Container */
  isCustomRule?: InputMaybe<Scalars['Boolean']['input']>;
  /** lastBuild of Container */
  lastBuild?: InputMaybe<Scalars['String']['input']>;
  /** maxMemory of Container */
  maxMemory?: InputMaybe<Scalars['Float']['input']>;
  /** Name of Container */
  name?: InputMaybe<Scalars['String']['input']>;
  /** passHostHeader of Container */
  passHostHeader?: InputMaybe<Scalars['Boolean']['input']>;
  /** Port of Container */
  port?: InputMaybe<Scalars['String']['input']>;
  /** Registry of Container */
  registry?: InputMaybe<Scalars['String']['input']>;
  /** repositoryId of Container */
  repositoryId?: InputMaybe<Scalars['String']['input']>;
  /** repositoryUrl of Container */
  repositoryUrl?: InputMaybe<Scalars['String']['input']>;
  /** Skip CI patterns for this container */
  skipCiPatterns?: InputMaybe<Array<Scalars['String']['input']>>;
  /** source of Container */
  source?: InputMaybe<Scalars['String']['input']>;
  /** Ssl of Container */
  ssl?: InputMaybe<Scalars['Boolean']['input']>;
  /** StartCmd of Container */
  startCmd?: InputMaybe<Scalars['String']['input']>;
  /** status of Container */
  status?: InputMaybe<ContainerStatus>;
  /** tag of container */
  tag?: InputMaybe<Scalars['String']['input']>;
  /** tagMatchType of Container */
  tagMatchType?: InputMaybe<TagMatchType>;
  /** tagPattern of Container */
  tagPattern?: InputMaybe<Scalars['String']['input']>;
  /** Type of Container */
  type?: InputMaybe<AllContainerTypes>;
  /** Url of Container */
  url?: InputMaybe<Scalars['String']['input']>;
  /** volumes of Container */
  volumes?: InputMaybe<Array<ContainerVolumeInput>>;
  /** webhookId of Container */
  webhookId?: InputMaybe<Scalars['String']['input']>;
  /** Www of Container */
  www?: InputMaybe<Scalars['Boolean']['input']>;
}

/** Kind of Container */
export enum ContainerKind {
  APPLICATION = 'APPLICATION',
  CUSTOM = 'CUSTOM',
  DATABASE = 'DATABASE',
  SERVICE = 'SERVICE',
}

/** Stats of Containers */
export interface ContainerStats {
  /** CPUPerc */
  CPUPerc: Scalars['String']['output'];
  /** MemUsage */
  MemUsage: Scalars['String']['output'];
  /** NetIO */
  NetIO: Scalars['String']['output'];
}

/** Status of Container */
export enum ContainerStatus {
  BUILDING = 'BUILDING',
  DEPLOYED = 'DEPLOYED',
  DIED = 'DIED',
  DRAFT = 'DRAFT',
  RESTORING = 'RESTORING',
  STOPPED = 'STOPPED',
  STOPPED_BY_SYSTEM = 'STOPPED_BY_SYSTEM',
}

/** Defines a volume for a container */
export interface ContainerVolume {
  /** destination of ContainerVolume */
  destination?: Maybe<Scalars['String']['output']>;
  /** source of ContainerVolume */
  source?: Maybe<Scalars['String']['output']>;
  /** destination of ContainerVolume */
  type: ContainerVolumeType;
}

/** Input data for container volume */
export interface ContainerVolumeInput {
  /** destination of ContainerVolume */
  destination?: InputMaybe<Scalars['String']['input']>;
  /** source of ContainerVolume */
  source?: InputMaybe<Scalars['String']['input']>;
  /** destination of ContainerVolume */
  type: ContainerVolumeType;
}

/** Volume types of Container */
export enum ContainerVolumeType {
  DIRECTORY_MOUNT = 'DIRECTORY_MOUNT',
}

/** CoreAuth */
export interface CoreAuthModel {
  /** Refresh token */
  refreshToken?: Maybe<Scalars['String']['output']>;
  /** JavaScript Web Token (JWT) */
  token?: Maybe<Scalars['String']['output']>;
  /** Current user */
  user: CoreUserModel;
}

/** User */
export interface CoreUserModel {
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** Email of the user */
  email?: Maybe<Scalars['String']['output']>;
  /** First name of the user */
  firstName?: Maybe<Scalars['String']['output']>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** Last name of the user */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Roles of the user */
  roles?: Maybe<Array<Scalars['String']['output']>>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** Username of the user */
  username?: Maybe<Scalars['String']['output']>;
  /** Verification state of the user */
  verified?: Maybe<Scalars['Boolean']['output']>;
  /** Verified date */
  verifiedAt?: Maybe<Scalars['Date']['output']>;
}

/** Deployment types of Container */
export enum DeploymentType {
  BRANCH = 'BRANCH',
  TAG = 'TAG',
}

/** docker container with stats */
export interface DockerContainer {
  /** cpuPercent */
  cpuPercent: Scalars['String']['output'];
  /** id */
  id: Scalars['String']['output'];
  /** memPercent */
  memPercent: Scalars['String']['output'];
  /** name */
  name: Scalars['String']['output'];
  /** restartCount */
  restartCount: Scalars['String']['output'];
  /** started */
  started: Scalars['String']['output'];
  /** state */
  state: Scalars['String']['output'];
}

/** Result of container events */
export interface EventsOutput {
  /** log line */
  log: Scalars['String']['output'];
}

/** Information about file */
export interface FileInfo {
  /** The size of each chunk in bytes. GridFS divides the document into chunks of size chunkSize, except for the last, which is only as large as needed. The default size is 255 kilobytes (kB) */
  chunkSize?: Maybe<Scalars['Float']['output']>;
  /** Content type */
  contentType?: Maybe<Scalars['String']['output']>;
  /** Name of the file */
  filename?: Maybe<Scalars['String']['output']>;
  /** ID of the file */
  id: Scalars['String']['output'];
  /** The size of the document in bytes */
  length?: Maybe<Scalars['Float']['output']>;
  /** The date the file was first stored */
  uploadDate?: Maybe<Scalars['Date']['output']>;
}

/** Input for filtering. The `singleFilter` will be ignored if the `combinedFilter` is set. */
export interface FilterInput {
  /** Combination of multiple filters via logical operator */
  combinedFilter?: InputMaybe<CombinedFilterInput>;
  /** Filter for a single property */
  singleFilter?: InputMaybe<SingleFilterInput>;
}

/** Result of find and count Backups */
export interface FindAndCountBackupsResult {
  /** Found Backups */
  items: Array<Backup>;
  /** Total count (skip/offset and limit/take are ignored in the count) */
  totalCount: Scalars['Float']['output'];
}

/** Result of find and count Builds */
export interface FindAndCountBuildsResult {
  /** Found Builds */
  items: Array<Build>;
  /** Total count (skip/offset and limit/take are ignored in the count) */
  totalCount: Scalars['Float']['output'];
}

/** Result of find and count Containers */
export interface FindAndCountContainersResult {
  /** Found Containers */
  items: Array<Container>;
  /** Total count (skip/offset and limit/take are ignored in the count) */
  totalCount: Scalars['Float']['output'];
}

/** Result of find and count Projects */
export interface FindAndCountProjectsResult {
  /** Found Projects */
  items: Array<Project>;
  /** Total count (skip/offset and limit/take are ignored in the count) */
  totalCount: Scalars['Float']['output'];
}

/** Result of find and count Registrys */
export interface FindAndCountRegistrysResult {
  /** Found Registrys */
  items: Array<Registry>;
  /** Total count (skip/offset and limit/take are ignored in the count) */
  totalCount: Scalars['Float']['output'];
}

/** Result of find and count Teams */
export interface FindAndCountTeamsResult {
  /** Found Teams */
  items: Array<Team>;
  /** Total count (skip/offset and limit/take are ignored in the count) */
  totalCount: Scalars['Float']['output'];
}

/** Result of find and count */
export interface FindAndCountUsersResult {
  /** Found users */
  items: Array<User>;
  /** Total count (skip/offset and limit/take are ignored in the count) */
  totalCount: Scalars['Float']['output'];
}

/** Result of find and count WebPushs */
export interface FindAndCountWebPushsResult {
  /** Found WebPushs */
  items: Array<WebPush>;
  /** Total count (skip/offset and limit/take are ignored in the count) */
  totalCount: Scalars['Float']['output'];
}

/** Logical operators to combine filters */
export enum LogicalOperatorEnum {
  AND = 'AND',
  NOR = 'NOR',
  OR = 'OR',
}

/** Metadata of API */
export interface Meta {
  /** Environment of API */
  environment: Scalars['String']['output'];
  /** Package name of API */
  package: Scalars['String']['output'];
  /** Title of API */
  title: Scalars['String']['output'];
  /** Version of API */
  version: Scalars['String']['output'];
}

export interface Mutation {
  /** Create a new ApiKey */
  createApiKey: ApiKey;
  /** Create a new Backup */
  createBackup: Backup;
  /** Create a new Build */
  createBuild: Build;
  /** Create a new Container */
  createContainer: Container;
  /** Create a new Project */
  createProject: Project;
  /** Create a new Registry */
  createRegistry: Registry;
  /** Create a new Source */
  createSource: Source;
  /** Create a new Team */
  createTeam: Team;
  /** Create a new user */
  createUser: User;
  /** Create a new WebPush */
  createWebPush: WebPush;
  /** Delete existing ApiKey */
  deleteApiKey: ApiKey;
  /** Delete existing Backup */
  deleteBackup: Backup;
  /** Delete existing Build */
  deleteBuild: Build;
  /** Delete existing Container */
  deleteContainer: Container;
  deleteFile: FileInfo;
  /** Delete existing Project */
  deleteProject: Project;
  /** Delete existing Registry */
  deleteRegistry: Registry;
  /** Delete existing Source */
  deleteSource: Source;
  /** Delete existing Team */
  deleteTeam: Team;
  /** Delete existing user */
  deleteUser: User;
  /** Start all containers for team */
  deleteVolume: Scalars['Boolean']['output'];
  /** Delete existing WebPush */
  deleteWebPush: WebPush;
  /** Deploy existing Container */
  deployContainer: Container;
  /** Duplicate a Container */
  duplicateContainer: Container;
  /** Invite user to existing Team */
  inviteTeamMember: User;
  /** Logout user (from specific device) */
  logout: Scalars['Boolean']['output'];
  /** Refresh tokens (for specific device) */
  refreshToken: CoreAuthModel;
  /** Set new password for user with token */
  resetPassword: Scalars['Boolean']['output'];
  /** Restart existing Build */
  restartBuild: Scalars['Boolean']['output'];
  /** Restore Backup */
  restoreBackup: Scalars['Boolean']['output'];
  /** Restore Backup volume */
  restoreBackupVolume: Scalars['Boolean']['output'];
  /** Sign in and get JWT token */
  signIn: Auth;
  /** Register a new user account */
  signUp: Auth;
  /** Start all containers for team */
  startAllStoppedContainers: Scalars['Boolean']['output'];
  /** Stop all containers for team */
  stopAllContainers: Scalars['Boolean']['output'];
  /** Stop existing Build */
  stopBuild: Scalars['Boolean']['output'];
  /** Stop deploy existing Container */
  stopContainer: Container;
  /** Update existing Backup */
  updateBackup: Backup;
  /** Update existing Build */
  updateBuild: Build;
  /** Update existing Container */
  updateContainer: Container;
  /** Update existing Project */
  updateProject: Project;
  /** Update existing Registry */
  updateRegistry: Registry;
  /** Update existing Source */
  updateSource: Source;
  /** Update existing Team */
  updateTeam: Team;
  /** Update existing user */
  updateUser: User;
  /** Update existing WebPush */
  updateWebPush: WebPush;
  uploadFile: FileInfo;
  uploadFiles: Scalars['Boolean']['output'];
  /** Verify user with email */
  verifyUser: Scalars['Boolean']['output'];
}

export interface MutationCreateApiKeyArgs {
  input: ApiKeyCreateInput;
}

export interface MutationCreateBackupArgs {
  input: BackupCreateInput;
}

export interface MutationCreateBuildArgs {
  input: BuildCreateInput;
}

export interface MutationCreateContainerArgs {
  input: ContainerCreateInput;
  projectId: Scalars['String']['input'];
}

export interface MutationCreateProjectArgs {
  input: ProjectCreateInput;
  teamId: Scalars['String']['input'];
}

export interface MutationCreateRegistryArgs {
  input: RegistryCreateInput;
  teamId: Scalars['String']['input'];
}

export interface MutationCreateSourceArgs {
  input: SourceCreateInput;
}

export interface MutationCreateTeamArgs {
  input: TeamCreateInput;
}

export interface MutationCreateUserArgs {
  input: UserCreateInput;
}

export interface MutationCreateWebPushArgs {
  input: WebPushCreateInput;
}

export interface MutationDeleteApiKeyArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteBackupArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteBuildArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteContainerArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteFileArgs {
  filename: Scalars['String']['input'];
}

export interface MutationDeleteProjectArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteRegistryArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteSourceArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteTeamArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteUserArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteVolumeArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeleteWebPushArgs {
  id: Scalars['String']['input'];
}

export interface MutationDeployContainerArgs {
  id: Scalars['String']['input'];
}

export interface MutationDuplicateContainerArgs {
  containerId: Scalars['String']['input'];
}

export interface MutationInviteTeamMemberArgs {
  input: UserCreateInput;
  teamId: Scalars['String']['input'];
}

export interface MutationLogoutArgs {
  allDevices?: InputMaybe<Scalars['Boolean']['input']>;
}

export interface MutationResetPasswordArgs {
  password: Scalars['String']['input'];
  token: Scalars['String']['input'];
}

export interface MutationRestartBuildArgs {
  id: Scalars['String']['input'];
}

export interface MutationRestoreBackupArgs {
  containerId: Scalars['String']['input'];
  s3Key: Scalars['String']['input'];
}

export interface MutationRestoreBackupVolumeArgs {
  containerId: Scalars['String']['input'];
  s3Key: Scalars['String']['input'];
}

export interface MutationSignInArgs {
  input: AuthSignInInput;
}

export interface MutationSignUpArgs {
  input: AuthSignUpInput;
}

export interface MutationStopBuildArgs {
  id: Scalars['String']['input'];
}

export interface MutationStopContainerArgs {
  id: Scalars['String']['input'];
}

export interface MutationUpdateBackupArgs {
  id: Scalars['String']['input'];
  input: BackupInput;
}

export interface MutationUpdateBuildArgs {
  id: Scalars['String']['input'];
  input: BuildInput;
}

export interface MutationUpdateContainerArgs {
  id: Scalars['String']['input'];
  input: ContainerInput;
}

export interface MutationUpdateProjectArgs {
  id: Scalars['String']['input'];
  input: ProjectInput;
}

export interface MutationUpdateRegistryArgs {
  id: Scalars['String']['input'];
  input: RegistryInput;
}

export interface MutationUpdateSourceArgs {
  id: Scalars['String']['input'];
  input: SourceInput;
}

export interface MutationUpdateTeamArgs {
  id: Scalars['String']['input'];
  input: TeamInput;
}

export interface MutationUpdateUserArgs {
  id: Scalars['String']['input'];
  input: UserInput;
}

export interface MutationUpdateWebPushArgs {
  id: Scalars['String']['input'];
  input: WebPushInput;
}

export interface MutationUploadFileArgs {
  file: Scalars['Upload']['input'];
}

export interface MutationUploadFilesArgs {
  files: Array<Scalars['Upload']['input']>;
}

export interface MutationVerifyUserArgs {
  token: Scalars['String']['input'];
}

/** Project */
export interface Project {
  /** containers of Project */
  containers?: Maybe<Array<Container>>;
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** healthStatus of Project */
  healthStatus?: Maybe<ContainerHealthStatus>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** identifier of Project */
  identifier?: Maybe<Scalars['String']['output']>;
  /** image of Project */
  image?: Maybe<Scalars['String']['output']>;
  /** name of Project */
  name: Scalars['String']['output'];
  /** subscribers of Project */
  subscribers?: Maybe<Array<User>>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
}

/** Input data to create a new Project */
export interface ProjectCreateInput {
  /** Containers of Project */
  containers?: InputMaybe<Array<Scalars['String']['input']>>;
  /** identifier of Project */
  identifier?: InputMaybe<Scalars['String']['input']>;
  /** Image of Project */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Name of Project */
  name: Scalars['String']['input'];
  /** subscribers of Project */
  subscribers?: InputMaybe<Array<Scalars['String']['input']>>;
}

/** Input data to update an existing Project */
export interface ProjectInput {
  /** Containers of Project */
  containers?: InputMaybe<Array<Scalars['String']['input']>>;
  /** identifier of Project */
  identifier?: InputMaybe<Scalars['String']['input']>;
  /** Image of Project */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Name of Project */
  name?: InputMaybe<Scalars['String']['input']>;
  /** subscribers of Project */
  subscribers?: InputMaybe<Array<Scalars['String']['input']>>;
}

export interface Query {
  /** Find Backups (via filter) */
  findAndCountBackups: FindAndCountBackupsResult;
  /** Find Builds (via filter) */
  findAndCountBuilds: FindAndCountBuildsResult;
  /** Find Containers (via filter) */
  findAndCountContainers: FindAndCountContainersResult;
  /** Find Projects (via filter) */
  findAndCountProjects: FindAndCountProjectsResult;
  /** Find Registrys (via filter) */
  findAndCountRegistrys: FindAndCountRegistrysResult;
  /** Find Teams (via filter) */
  findAndCountTeams: FindAndCountTeamsResult;
  /** Find users (via filter) */
  findAndCountUsers: FindAndCountUsersResult;
  /** Find WebPushs (via filter) */
  findAndCountWebPushs: FindAndCountWebPushsResult;
  /** Find ApiKeys (via filter) */
  findApiKeys: Array<ApiKey>;
  /** Find Backups (via filter) */
  findBackups: Array<Backup>;
  /** Find Builds (via filter) */
  findBuilds: Array<Build>;
  /** Find Builds (via filter) */
  findBuildsForContainer: Array<Build>;
  /** Find Containers (via filter) */
  findContainers: Array<Container>;
  /** Find Projects (via filter) */
  findProjects: Array<Project>;
  /** Find Registrys (via filter) */
  findRegistrys: Array<Registry>;
  /** Find Source (via filter) */
  findSources: Array<Source>;
  /** Find Teams (via filter) */
  findTeams: Array<Team>;
  /** Find users (via filter) */
  findUsers: Array<User>;
  /** Find WebPushs (via filter) */
  findWebPushs: Array<WebPush>;
  /** Get Backup with specified ID */
  getBackup: Backup;
  /** Get Backup with specified container ID */
  getBackupByDatabase: Backup;
  /** Get Build with specified ID */
  getBuild: Build;
  /** Get build count */
  getBuildCount: Scalars['Float']['output'];
  /** Get Container with specified ID */
  getContainer: Container;
  /** Get container count */
  getContainerCount: Scalars['Float']['output'];
  /** Get Container health status */
  getContainerHealthStatus: ContainerHealthStatus;
  /** Get Container logs */
  getContainerLogs: Array<Scalars['String']['output']>;
  /** Get Container stats */
  getContainerStats: ContainerStats;
  getFileInfo?: Maybe<FileInfo>;
  /** Get members of Team by current user */
  getMembersOfTeam: Array<User>;
  /** Get Meta */
  getMeta: Meta;
  /** Get Project with specified ID */
  getProject: Project;
  /** Get Registry with specified ID */
  getRegistry: Registry;
  /** Get Source with specified ID */
  getSource: Source;
  /** Get build count */
  getSystemStats: SystemStats;
  /** Get Team with specified ID */
  getTeam: Team;
  /** Get Team by current user */
  getTeamByCurrentUser: Team;
  /** Get user with specified ID */
  getUser: User;
  /** Get verified state of user with token */
  getVerifiedState: Scalars['Boolean']['output'];
  /** Get WebPush with specified ID */
  getWebPush: WebPush;
  /** Get Backup with specified container ID */
  listBackups: Array<S3BackupListOutput>;
  /** Request new password for user with email */
  requestPasswordResetMail: Scalars['Boolean']['output'];
}

export interface QueryFindAndCountBackupsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindAndCountBuildsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindAndCountContainersArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindAndCountProjectsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindAndCountRegistrysArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindAndCountTeamsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindAndCountUsersArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindAndCountWebPushsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindApiKeysArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindBackupsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindBuildsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindBuildsForContainerArgs {
  containerId: Scalars['String']['input'];
}

export interface QueryFindContainersArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindRegistrysArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindSourcesArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindTeamsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindUsersArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryFindWebPushsArgs {
  filter?: InputMaybe<FilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  samples?: InputMaybe<Scalars['Float']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<SortInput>>;
  take?: InputMaybe<Scalars['Int']['input']>;
}

export interface QueryGetBackupArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetBackupByDatabaseArgs {
  containerId: Scalars['String']['input'];
}

export interface QueryGetBuildArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetBuildCountArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetContainerArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetContainerCountArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetContainerHealthStatusArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetContainerLogsArgs {
  id: Scalars['String']['input'];
  since?: InputMaybe<Scalars['String']['input']>;
}

export interface QueryGetContainerStatsArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetFileInfoArgs {
  filename: Scalars['String']['input'];
}

export interface QueryGetProjectArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetRegistryArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetSourceArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetSystemStatsArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetTeamArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetUserArgs {
  id: Scalars['String']['input'];
}

export interface QueryGetVerifiedStateArgs {
  token: Scalars['String']['input'];
}

export interface QueryGetWebPushArgs {
  id: Scalars['String']['input'];
}

export interface QueryListBackupsArgs {
  containerId: Scalars['String']['input'];
}

export interface QueryRequestPasswordResetMailArgs {
  email: Scalars['String']['input'];
}

/** Registry */
export interface Registry {
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** name of Registry */
  name?: Maybe<Scalars['String']['output']>;
  /** pw of Registry */
  pw?: Maybe<Scalars['String']['output']>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
  /** url of Registry */
  url: Scalars['String']['output'];
  /** username of Registry */
  username?: Maybe<Scalars['String']['output']>;
}

/** Input data to create a new Registry */
export interface RegistryCreateInput {
  /** Name of Registry */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Password of Registry */
  pw: Scalars['String']['input'];
  /** Url of Registry */
  url: Scalars['String']['input'];
  /** Username of Registry */
  username: Scalars['String']['input'];
}

/** Input data to update an existing Registry */
export interface RegistryInput {
  /** Name of Registry */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Password of Registry */
  pw?: InputMaybe<Scalars['String']['input']>;
  /** Url of Registry */
  url?: InputMaybe<Scalars['String']['input']>;
  /** Username of Registry */
  username?: InputMaybe<Scalars['String']['input']>;
}

/** Result of find and count Backups */
export interface S3BackupListOutput {
  /** Key of Backup */
  key: Scalars['String']['output'];
  /** Label of Backup */
  label: Scalars['String']['output'];
}

/** Input for a configuration of a filter */
export interface SingleFilterInput {
  /** Convert value to ObjectId */
  convertToObjectId?: InputMaybe<Scalars['Boolean']['input']>;
  /** Name of the property to be used for the filter */
  field: Scalars['String']['input'];
  /** Process value as reference */
  isReference?: InputMaybe<Scalars['Boolean']['input']>;
  /** [Negate operator](https://docs.mongodb.com/manual/reference/operator/query/not/) */
  not?: InputMaybe<Scalars['Boolean']['input']>;
  /** [Comparison operator](https://docs.mongodb.com/manual/reference/operator/query-comparison/) */
  operator: ComparisonOperatorEnum;
  /** [Options](https://docs.mongodb.com/manual/reference/operator/query/regex/#op._S_options) for [REGEX](https://docs.mongodb.com/manual/reference/operator/query/regex/) operator */
  options?: InputMaybe<Scalars['String']['input']>;
  /** Value of the property */
  value: Scalars['JSON']['input'];
}

/** Sorting the returned elements */
export interface SortInput {
  /** Field that is to be used for sorting */
  field: Scalars['String']['input'];
  /** SortInput order of the field */
  order: SortOrderEnum;
}

/** SortInput order of items */
export enum SortOrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

/** Source */
export interface Source {
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** name of Source */
  name: Scalars['String']['output'];
  /** team of Source */
  team?: Maybe<Team>;
  /** token of Source */
  token: Scalars['String']['output'];
  /** type of Source */
  type: SourceType;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
  /** url of Source */
  url: Scalars['String']['output'];
}

/** Input data to create a new Source */
export interface SourceCreateInput {
  /** Name of Source */
  name: Scalars['String']['input'];
  /** Team of Source */
  team: Scalars['String']['input'];
  /** Token of Source */
  token?: InputMaybe<Scalars['String']['input']>;
  /** Type of Source */
  type?: InputMaybe<SourceType>;
  /** URL of Source */
  url?: InputMaybe<Scalars['String']['input']>;
}

/** Input data to update an existing Source */
export interface SourceInput {
  /** Name of Source */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Team of Source */
  team?: InputMaybe<Scalars['String']['input']>;
  /** Token of Source */
  token?: InputMaybe<Scalars['String']['input']>;
  /** Type of Source */
  type?: InputMaybe<SourceType>;
  /** URL of Source */
  url?: InputMaybe<Scalars['String']['input']>;
}

/** Type of Source */
export enum SourceType {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
}

export interface Subscription {
  buildCreated: Build;
  events: EventsOutput;
  userCreated: User;
  webPushCreated: WebPush;
}

/** Stats of system */
export interface SystemStats {
  /** docker containers */
  containers: Array<DockerContainer>;
  /** cpu in prozent */
  cpu: Scalars['Float']['output'];
  /** memory in gb */
  memory: Scalars['Float']['output'];
  /** memory in gb */
  totalMemory: Scalars['Float']['output'];
  /** uptime */
  uptime: Scalars['String']['output'];
}

/** Tag matching type for deployment configuration */
export enum TagMatchType {
  EXACT = 'EXACT',
  PATTERN = 'PATTERN',
}

/** Team */
export interface Team {
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** maintenance mode of Team */
  maintenance?: Maybe<Scalars['Boolean']['output']>;
  /** name of Team */
  name: Scalars['String']['output'];
  /** projects of Team */
  projects?: Maybe<Array<Project>>;
  /** registries of Team */
  registries?: Maybe<Array<Registry>>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
}

/** Input data to create a new Team */
export interface TeamCreateInput {
  /** maintenance mode of Team */
  maintenance?: InputMaybe<Scalars['Boolean']['input']>;
  /** Name of Team */
  name: Scalars['String']['input'];
  /** Projects of Team */
  projects?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Registries of Team */
  registries?: InputMaybe<Array<Scalars['String']['input']>>;
}

/** Input data to update an existing Team */
export interface TeamInput {
  /** maintenance mode of Team */
  maintenance?: InputMaybe<Scalars['Boolean']['input']>;
  /** Name of Team */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Projects of Team */
  projects?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Registries of Team */
  registries?: InputMaybe<Array<Scalars['String']['input']>>;
}

/** User */
export interface User {
  /** URL to avatar file of the user */
  avatar?: Maybe<Scalars['String']['output']>;
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<Scalars['String']['output']>;
  /** Email of the user */
  email?: Maybe<Scalars['String']['output']>;
  /** First name of the user */
  firstName?: Maybe<Scalars['String']['output']>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** Last name of the user */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Roles of the user */
  roles?: Maybe<Array<Scalars['String']['output']>>;
  /** ID of the team */
  team?: Maybe<Team>;
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who last updated the object */
  updatedBy?: Maybe<Scalars['String']['output']>;
  /** Username of the user */
  username?: Maybe<Scalars['String']['output']>;
  /** Verification state of the user */
  verified?: Maybe<Scalars['Boolean']['output']>;
  /** Verified date */
  verifiedAt?: Maybe<Scalars['Date']['output']>;
}

/** User input to create a new user */
export interface UserCreateInput {
  /** Email of the user */
  email: Scalars['String']['input'];
  /** First name of the user */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Last name of the user */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Password of the user */
  password?: InputMaybe<Scalars['String']['input']>;
  /** Roles of the user */
  roles?: InputMaybe<Array<Scalars['String']['input']>>;
  /** id of Team */
  team?: InputMaybe<Scalars['String']['input']>;
  /** Username / alias of the user */
  username?: InputMaybe<Scalars['String']['input']>;
}

/** User input */
export interface UserInput {
  /** Email of the user */
  email?: InputMaybe<Scalars['String']['input']>;
  /** First name of the user */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Last name of the user */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Password of the user */
  password?: InputMaybe<Scalars['String']['input']>;
  /** Roles of the user */
  roles?: InputMaybe<Array<Scalars['String']['input']>>;
  /** id of Team */
  team?: InputMaybe<Scalars['String']['input']>;
  /** Username / alias of the user */
  username?: InputMaybe<Scalars['String']['input']>;
}

/** WebPush */
export interface WebPush {
  /** Created date */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who created the object */
  createdBy?: Maybe<User>;
  /** ID of the persistence object */
  id?: Maybe<Scalars['ID']['output']>;
  /** Subscription of WebPush */
  subscription: Scalars['String']['output'];
  /** Updated date */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who updated the object */
  updatedBy?: Maybe<User>;
  /** User of WebPush */
  user: User;
}

/** Input data to create a new WebPush */
export interface WebPushCreateInput {
  /** Subscription of WebPush */
  subscription: Scalars['String']['input'];
  /** UserId of WebPush */
  user: Scalars['String']['input'];
}

/** Input data to update an existing WebPush */
export interface WebPushInput {
  /** Subscription of WebPush */
  subscription?: InputMaybe<Scalars['String']['input']>;
  /** UserId of WebPush */
  user?: InputMaybe<Scalars['String']['input']>;
}
