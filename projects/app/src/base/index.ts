import type { GraphqlError } from '#base-interfaces/graphql-error.interface';
import type { ReturnTypeOfSubscription } from '#base-interfaces/return-type-of-subscription.interface';
import type { InputFields } from '#base-types/fields';
import type { AsyncData, AsyncDataOptions } from 'nuxt/app';

import { gqlAsyncQuery, gqlMutation, gqlQuery, gqlSubscription } from '#imports';

import type {
  ApiKey,
  ApiKeyCreateInput,
  Auth,
  AuthSignInInput,
  AuthSignUpInput,
  Backup,
  BackupCreateInput,
  BackupInput,
  Build,
  BuildCreateInput,
  BuildInput,
  Container,
  ContainerCreateInput,
  ContainerHealthStatus,
  ContainerInput,
  ContainerStats,
  CoreAuthModel,
  EventsOutput,
  FileInfo,
  FilterInput,
  FindAndCountBackupsResult,
  FindAndCountBuildsResult,
  FindAndCountContainersResult,
  FindAndCountProjectsResult,
  FindAndCountRegistrysResult,
  FindAndCountTeamsResult,
  FindAndCountUsersResult,
  FindAndCountWebPushsResult,
  Meta,
  Project,
  ProjectCreateInput,
  ProjectInput,
  Registry,
  RegistryCreateInput,
  RegistryInput,
  S3BackupListOutput,
  SortInput,
  Source,
  SourceCreateInput,
  SourceInput,
  SystemStats,
  Team,
  TeamCreateInput,
  TeamInput,
  User,
  UserCreateInput,
  UserInput,
  WebPush,
  WebPushCreateInput,
  WebPushInput,
} from './default';

export const useFindAndCountUsersQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountUsersResult>[] | null,
  log?: boolean,
): Promise<{ data: FindAndCountUsersResult; error: GraphqlError | null }> =>
  gqlQuery<FindAndCountUsersResult>('findAndCountUsers', { fields, log, variables });
export const useAsyncFindAndCountUsersQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountUsersResult>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FindAndCountUsersResult, Error>> =>
  gqlAsyncQuery<FindAndCountUsersResult>('findAndCountUsers', { asyncDataOptions, fields, log, variables });
export const useFindUsersQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<User>[] | null,
  log?: boolean,
): Promise<{ data: User[]; error: GraphqlError | null }> => gqlQuery<User[]>('findUsers', { fields, log, variables });
export const useAsyncFindUsersQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<User>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<User[], Error>> =>
  gqlAsyncQuery<User[]>('findUsers', { asyncDataOptions, fields, log, variables });
export const useGetUserQuery = (
  variables: { id: string },
  fields?: InputFields<User>[] | null,
  log?: boolean,
): Promise<{ data: User; error: GraphqlError | null }> => gqlQuery<User>('getUser', { fields, log, variables });
export const useAsyncGetUserQuery = (
  variables: { id: string },
  fields?: InputFields<User>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<User, Error>> => gqlAsyncQuery<User>('getUser', { asyncDataOptions, fields, log, variables });
export const useGetVerifiedStateQuery = (
  variables: { token: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError | null }> =>
  gqlQuery<boolean>('getVerifiedState', { fields: null, log, variables });
export const useAsyncGetVerifiedStateQuery = (
  variables: { token: string },
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<boolean, Error>> =>
  gqlAsyncQuery<boolean>('getVerifiedState', { asyncDataOptions, fields: null, log, variables });
export const useRequestPasswordResetMailQuery = (
  variables: { email: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError | null }> =>
  gqlQuery<boolean>('requestPasswordResetMail', { fields: null, log, variables });
export const useAsyncRequestPasswordResetMailQuery = (
  variables: { email: string },
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<boolean, Error>> =>
  gqlAsyncQuery<boolean>('requestPasswordResetMail', { asyncDataOptions, fields: null, log, variables });
export const useGetMetaQuery = (
  fields?: InputFields<Meta>[] | null,
  log?: boolean,
): Promise<{ data: Meta; error: GraphqlError | null }> => gqlQuery<Meta>('getMeta', { fields, log });
export const useAsyncGetMetaQuery = (
  fields?: InputFields<Meta>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Meta, Error>> => gqlAsyncQuery<Meta>('getMeta', { asyncDataOptions, fields, log });
export const useGetFileInfoQuery = (
  variables: { filename: string },
  fields?: InputFields<FileInfo>[] | null,
  log?: boolean,
): Promise<{ data: FileInfo; error: GraphqlError | null }> =>
  gqlQuery<FileInfo>('getFileInfo', { fields, log, variables });
export const useAsyncGetFileInfoQuery = (
  variables: { filename: string },
  fields?: InputFields<FileInfo>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FileInfo, Error>> =>
  gqlAsyncQuery<FileInfo>('getFileInfo', { asyncDataOptions, fields, log, variables });
export const useFindAndCountContainersQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountContainersResult>[] | null,
  log?: boolean,
): Promise<{ data: FindAndCountContainersResult; error: GraphqlError | null }> =>
  gqlQuery<FindAndCountContainersResult>('findAndCountContainers', { fields, log, variables });
export const useAsyncFindAndCountContainersQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountContainersResult>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FindAndCountContainersResult, Error>> =>
  gqlAsyncQuery<FindAndCountContainersResult>('findAndCountContainers', { asyncDataOptions, fields, log, variables });
export const useFindContainersQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
): Promise<{ data: Container[]; error: GraphqlError | null }> =>
  gqlQuery<Container[]>('findContainers', { fields, log, variables });
export const useAsyncFindContainersQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Container[], Error>> =>
  gqlAsyncQuery<Container[]>('findContainers', { asyncDataOptions, fields, log, variables });
export const useGetContainerQuery = (
  variables: { id: string },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
): Promise<{ data: Container; error: GraphqlError | null }> =>
  gqlQuery<Container>('getContainer', { fields, log, variables });
export const useAsyncGetContainerQuery = (
  variables: { id: string },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Container, Error>> =>
  gqlAsyncQuery<Container>('getContainer', { asyncDataOptions, fields, log, variables });
export const useGetContainerLogsQuery = (
  variables: { id: string; since?: string },
  fields?: InputFields<string>[] | null,
  log?: boolean,
): Promise<{ data: string[]; error: GraphqlError | null }> =>
  gqlQuery<string[]>('getContainerLogs', { fields, log, variables });
export const useAsyncGetContainerLogsQuery = (
  variables: { id: string; since?: string },
  fields?: InputFields<string>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<string[], Error>> =>
  gqlAsyncQuery<string[]>('getContainerLogs', { asyncDataOptions, fields, log, variables });
export const useGetContainerStatsQuery = (
  variables: { id: string },
  fields?: InputFields<ContainerStats>[] | null,
  log?: boolean,
): Promise<{ data: ContainerStats; error: GraphqlError | null }> =>
  gqlQuery<ContainerStats>('getContainerStats', { fields, log, variables });
export const useAsyncGetContainerStatsQuery = (
  variables: { id: string },
  fields?: InputFields<ContainerStats>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<ContainerStats, Error>> =>
  gqlAsyncQuery<ContainerStats>('getContainerStats', { asyncDataOptions, fields, log, variables });
export const useGetContainerHealthStatusQuery = (
  variables: { id: string },
  fields?: InputFields<ContainerHealthStatus>[] | null,
  log?: boolean,
): Promise<{ data: ContainerHealthStatus; error: GraphqlError | null }> =>
  gqlQuery<ContainerHealthStatus>('getContainerHealthStatus', { fields, log, variables });
export const useAsyncGetContainerHealthStatusQuery = (
  variables: { id: string },
  fields?: InputFields<ContainerHealthStatus>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<ContainerHealthStatus, Error>> =>
  gqlAsyncQuery<ContainerHealthStatus>('getContainerHealthStatus', { asyncDataOptions, fields, log, variables });
export const useFindAndCountProjectsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountProjectsResult>[] | null,
  log?: boolean,
): Promise<{ data: FindAndCountProjectsResult; error: GraphqlError | null }> =>
  gqlQuery<FindAndCountProjectsResult>('findAndCountProjects', { fields, log, variables });
export const useAsyncFindAndCountProjectsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountProjectsResult>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FindAndCountProjectsResult, Error>> =>
  gqlAsyncQuery<FindAndCountProjectsResult>('findAndCountProjects', { asyncDataOptions, fields, log, variables });
export const useFindProjectsQuery = (
  fields?: InputFields<Project>[] | null,
  log?: boolean,
): Promise<{ data: Project[]; error: GraphqlError | null }> => gqlQuery<Project[]>('findProjects', { fields, log });
export const useAsyncFindProjectsQuery = (
  fields?: InputFields<Project>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Project[], Error>> => gqlAsyncQuery<Project[]>('findProjects', { asyncDataOptions, fields, log });
export const useGetProjectQuery = (
  variables: { id: string },
  fields?: InputFields<Project>[] | null,
  log?: boolean,
): Promise<{ data: Project; error: GraphqlError | null }> =>
  gqlQuery<Project>('getProject', { fields, log, variables });
export const useAsyncGetProjectQuery = (
  variables: { id: string },
  fields?: InputFields<Project>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Project, Error>> =>
  gqlAsyncQuery<Project>('getProject', { asyncDataOptions, fields, log, variables });
export const useFindAndCountTeamsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountTeamsResult>[] | null,
  log?: boolean,
): Promise<{ data: FindAndCountTeamsResult; error: GraphqlError | null }> =>
  gqlQuery<FindAndCountTeamsResult>('findAndCountTeams', { fields, log, variables });
export const useAsyncFindAndCountTeamsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountTeamsResult>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FindAndCountTeamsResult, Error>> =>
  gqlAsyncQuery<FindAndCountTeamsResult>('findAndCountTeams', { asyncDataOptions, fields, log, variables });
export const useFindTeamsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Team>[] | null,
  log?: boolean,
): Promise<{ data: Team[]; error: GraphqlError | null }> => gqlQuery<Team[]>('findTeams', { fields, log, variables });
export const useAsyncFindTeamsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Team>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Team[], Error>> =>
  gqlAsyncQuery<Team[]>('findTeams', { asyncDataOptions, fields, log, variables });
export const useGetTeamQuery = (
  variables: { id: string },
  fields?: InputFields<Team>[] | null,
  log?: boolean,
): Promise<{ data: Team; error: GraphqlError | null }> => gqlQuery<Team>('getTeam', { fields, log, variables });
export const useAsyncGetTeamQuery = (
  variables: { id: string },
  fields?: InputFields<Team>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Team, Error>> => gqlAsyncQuery<Team>('getTeam', { asyncDataOptions, fields, log, variables });
export const useGetContainerCountQuery = (
  variables: { id: string },
  log?: boolean,
): Promise<{ data: number; error: GraphqlError | null }> =>
  gqlQuery<number>('getContainerCount', { fields: null, log, variables });
export const useAsyncGetContainerCountQuery = (
  variables: { id: string },
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<number, Error>> =>
  gqlAsyncQuery<number>('getContainerCount', { asyncDataOptions, fields: null, log, variables });
export const useGetBuildCountQuery = (
  variables: { id: string },
  log?: boolean,
): Promise<{ data: number; error: GraphqlError | null }> =>
  gqlQuery<number>('getBuildCount', { fields: null, log, variables });
export const useAsyncGetBuildCountQuery = (
  variables: { id: string },
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<number, Error>> =>
  gqlAsyncQuery<number>('getBuildCount', { asyncDataOptions, fields: null, log, variables });
export const useGetSystemStatsQuery = (
  variables: { id: string },
  fields?: InputFields<SystemStats>[] | null,
  log?: boolean,
): Promise<{ data: SystemStats; error: GraphqlError | null }> =>
  gqlQuery<SystemStats>('getSystemStats', { fields, log, variables });
export const useAsyncGetSystemStatsQuery = (
  variables: { id: string },
  fields?: InputFields<SystemStats>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<SystemStats, Error>> =>
  gqlAsyncQuery<SystemStats>('getSystemStats', { asyncDataOptions, fields, log, variables });
export const useGetTeamByCurrentUserQuery = (
  fields?: InputFields<Team>[] | null,
  log?: boolean,
): Promise<{ data: Team; error: GraphqlError | null }> => gqlQuery<Team>('getTeamByCurrentUser', { fields, log });
export const useAsyncGetTeamByCurrentUserQuery = (
  fields?: InputFields<Team>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Team, Error>> => gqlAsyncQuery<Team>('getTeamByCurrentUser', { asyncDataOptions, fields, log });
export const useGetMembersOfTeamQuery = (
  fields?: InputFields<User>[] | null,
  log?: boolean,
): Promise<{ data: User[]; error: GraphqlError | null }> => gqlQuery<User[]>('getMembersOfTeam', { fields, log });
export const useAsyncGetMembersOfTeamQuery = (
  fields?: InputFields<User>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<User[], Error>> => gqlAsyncQuery<User[]>('getMembersOfTeam', { asyncDataOptions, fields, log });
export const useFindAndCountBuildsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountBuildsResult>[] | null,
  log?: boolean,
): Promise<{ data: FindAndCountBuildsResult; error: GraphqlError | null }> =>
  gqlQuery<FindAndCountBuildsResult>('findAndCountBuilds', { fields, log, variables });
export const useAsyncFindAndCountBuildsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountBuildsResult>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FindAndCountBuildsResult, Error>> =>
  gqlAsyncQuery<FindAndCountBuildsResult>('findAndCountBuilds', { asyncDataOptions, fields, log, variables });
export const useFindBuildsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
): Promise<{ data: Build[]; error: GraphqlError | null }> =>
  gqlQuery<Build[]>('findBuilds', { fields, log, variables });
export const useAsyncFindBuildsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Build[], Error>> =>
  gqlAsyncQuery<Build[]>('findBuilds', { asyncDataOptions, fields, log, variables });
export const useFindBuildsForContainerQuery = (
  variables: { containerId: string },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
): Promise<{ data: Build[]; error: GraphqlError | null }> =>
  gqlQuery<Build[]>('findBuildsForContainer', { fields, log, variables });
export const useAsyncFindBuildsForContainerQuery = (
  variables: { containerId: string },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Build[], Error>> =>
  gqlAsyncQuery<Build[]>('findBuildsForContainer', { asyncDataOptions, fields, log, variables });
export const useGetBuildQuery = (
  variables: { id: string },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
): Promise<{ data: Build; error: GraphqlError | null }> => gqlQuery<Build>('getBuild', { fields, log, variables });
export const useAsyncGetBuildQuery = (
  variables: { id: string },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Build, Error>> => gqlAsyncQuery<Build>('getBuild', { asyncDataOptions, fields, log, variables });
export const useFindAndCountWebPushsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountWebPushsResult>[] | null,
  log?: boolean,
): Promise<{ data: FindAndCountWebPushsResult; error: GraphqlError | null }> =>
  gqlQuery<FindAndCountWebPushsResult>('findAndCountWebPushs', { fields, log, variables });
export const useAsyncFindAndCountWebPushsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountWebPushsResult>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FindAndCountWebPushsResult, Error>> =>
  gqlAsyncQuery<FindAndCountWebPushsResult>('findAndCountWebPushs', { asyncDataOptions, fields, log, variables });
export const useFindWebPushsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<WebPush>[] | null,
  log?: boolean,
): Promise<{ data: WebPush[]; error: GraphqlError | null }> =>
  gqlQuery<WebPush[]>('findWebPushs', { fields, log, variables });
export const useAsyncFindWebPushsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<WebPush>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<WebPush[], Error>> =>
  gqlAsyncQuery<WebPush[]>('findWebPushs', { asyncDataOptions, fields, log, variables });
export const useGetWebPushQuery = (
  variables: { id: string },
  fields?: InputFields<WebPush>[] | null,
  log?: boolean,
): Promise<{ data: WebPush; error: GraphqlError | null }> =>
  gqlQuery<WebPush>('getWebPush', { fields, log, variables });
export const useAsyncGetWebPushQuery = (
  variables: { id: string },
  fields?: InputFields<WebPush>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<WebPush, Error>> =>
  gqlAsyncQuery<WebPush>('getWebPush', { asyncDataOptions, fields, log, variables });
export const useFindAndCountRegistrysQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountRegistrysResult>[] | null,
  log?: boolean,
): Promise<{ data: FindAndCountRegistrysResult; error: GraphqlError | null }> =>
  gqlQuery<FindAndCountRegistrysResult>('findAndCountRegistrys', { fields, log, variables });
export const useAsyncFindAndCountRegistrysQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountRegistrysResult>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FindAndCountRegistrysResult, Error>> =>
  gqlAsyncQuery<FindAndCountRegistrysResult>('findAndCountRegistrys', { asyncDataOptions, fields, log, variables });
export const useFindRegistrysQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Registry>[] | null,
  log?: boolean,
): Promise<{ data: Registry[]; error: GraphqlError | null }> =>
  gqlQuery<Registry[]>('findRegistrys', { fields, log, variables });
export const useAsyncFindRegistrysQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Registry>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Registry[], Error>> =>
  gqlAsyncQuery<Registry[]>('findRegistrys', { asyncDataOptions, fields, log, variables });
export const useGetRegistryQuery = (
  variables: { id: string },
  fields?: InputFields<Registry>[] | null,
  log?: boolean,
): Promise<{ data: Registry; error: GraphqlError | null }> =>
  gqlQuery<Registry>('getRegistry', { fields, log, variables });
export const useAsyncGetRegistryQuery = (
  variables: { id: string },
  fields?: InputFields<Registry>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Registry, Error>> =>
  gqlAsyncQuery<Registry>('getRegistry', { asyncDataOptions, fields, log, variables });
export const useFindSourcesQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Source>[] | null,
  log?: boolean,
): Promise<{ data: Source[]; error: GraphqlError | null }> =>
  gqlQuery<Source[]>('findSources', { fields, log, variables });
export const useAsyncFindSourcesQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Source>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Source[], Error>> =>
  gqlAsyncQuery<Source[]>('findSources', { asyncDataOptions, fields, log, variables });
export const useGetSourceQuery = (
  variables: { id: string },
  fields?: InputFields<Source>[] | null,
  log?: boolean,
): Promise<{ data: Source; error: GraphqlError | null }> => gqlQuery<Source>('getSource', { fields, log, variables });
export const useAsyncGetSourceQuery = (
  variables: { id: string },
  fields?: InputFields<Source>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Source, Error>> =>
  gqlAsyncQuery<Source>('getSource', { asyncDataOptions, fields, log, variables });
export const useFindAndCountBackupsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountBackupsResult>[] | null,
  log?: boolean,
): Promise<{ data: FindAndCountBackupsResult; error: GraphqlError | null }> =>
  gqlQuery<FindAndCountBackupsResult>('findAndCountBackups', { fields, log, variables });
export const useAsyncFindAndCountBackupsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<FindAndCountBackupsResult>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<FindAndCountBackupsResult, Error>> =>
  gqlAsyncQuery<FindAndCountBackupsResult>('findAndCountBackups', { asyncDataOptions, fields, log, variables });
export const useFindBackupsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
): Promise<{ data: Backup[]; error: GraphqlError | null }> =>
  gqlQuery<Backup[]>('findBackups', { fields, log, variables });
export const useAsyncFindBackupsQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Backup[], Error>> =>
  gqlAsyncQuery<Backup[]>('findBackups', { asyncDataOptions, fields, log, variables });
export const useGetBackupQuery = (
  variables: { id: string },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
): Promise<{ data: Backup; error: GraphqlError | null }> => gqlQuery<Backup>('getBackup', { fields, log, variables });
export const useAsyncGetBackupQuery = (
  variables: { id: string },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Backup, Error>> =>
  gqlAsyncQuery<Backup>('getBackup', { asyncDataOptions, fields, log, variables });
export const useGetBackupByDatabaseQuery = (
  variables: { containerId: string },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
): Promise<{ data: Backup; error: GraphqlError | null }> =>
  gqlQuery<Backup>('getBackupByDatabase', { fields, log, variables });
export const useAsyncGetBackupByDatabaseQuery = (
  variables: { containerId: string },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<Backup, Error>> =>
  gqlAsyncQuery<Backup>('getBackupByDatabase', { asyncDataOptions, fields, log, variables });
export const useListBackupsQuery = (
  variables: { containerId: string },
  fields?: InputFields<S3BackupListOutput>[] | null,
  log?: boolean,
): Promise<{ data: S3BackupListOutput[]; error: GraphqlError | null }> =>
  gqlQuery<S3BackupListOutput[]>('listBackups', { fields, log, variables });
export const useAsyncListBackupsQuery = (
  variables: { containerId: string },
  fields?: InputFields<S3BackupListOutput>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<S3BackupListOutput[], Error>> =>
  gqlAsyncQuery<S3BackupListOutput[]>('listBackups', { asyncDataOptions, fields, log, variables });
export const useFindApiKeysQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<ApiKey>[] | null,
  log?: boolean,
): Promise<{ data: ApiKey[]; error: GraphqlError | null }> =>
  gqlQuery<ApiKey[]>('findApiKeys', { fields, log, variables });
export const useAsyncFindApiKeysQuery = (
  variables: {
    filter?: FilterInput;
    limit?: number;
    offset?: number;
    samples?: number;
    skip?: number;
    sort?: SortInput[];
    take?: number;
  },
  fields?: InputFields<ApiKey>[] | null,
  log?: boolean,
  asyncDataOptions?: AsyncDataOptions,
): Promise<AsyncData<ApiKey[], Error>> =>
  gqlAsyncQuery<ApiKey[]>('findApiKeys', { asyncDataOptions, fields, log, variables });
export const useLogoutMutation = (
  variables: { allDevices?: boolean },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> => gqlMutation<boolean>('logout', { fields: null, log, variables });
export const useRefreshTokenMutation = (
  fields?: InputFields<CoreAuthModel>[] | null,
  log?: boolean,
): Promise<{ data: CoreAuthModel; error: GraphqlError }> => gqlMutation<CoreAuthModel>('refreshToken', { fields, log });
export const useSignInMutation = (
  variables: { input: AuthSignInInput },
  fields?: InputFields<Auth>[] | null,
  log?: boolean,
): Promise<{ data: Auth; error: GraphqlError }> => gqlMutation<Auth>('signIn', { fields, log, variables });
export const useSignUpMutation = (
  variables: { input: AuthSignUpInput },
  fields?: InputFields<Auth>[] | null,
  log?: boolean,
): Promise<{ data: Auth; error: GraphqlError }> => gqlMutation<Auth>('signUp', { fields, log, variables });
export const useCreateUserMutation = (
  variables: { input: UserCreateInput },
  fields?: InputFields<User>[] | null,
  log?: boolean,
): Promise<{ data: User; error: GraphqlError }> => gqlMutation<User>('createUser', { fields, log, variables });
export const useDeleteUserMutation = (
  variables: { id: string },
  fields?: InputFields<User>[] | null,
  log?: boolean,
): Promise<{ data: User; error: GraphqlError }> => gqlMutation<User>('deleteUser', { fields, log, variables });
export const useResetPasswordMutation = (
  variables: { password: string; token: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('resetPassword', { fields: null, log, variables });
export const useUpdateUserMutation = (
  variables: { id: string; input: UserInput },
  fields?: InputFields<User>[] | null,
  log?: boolean,
): Promise<{ data: User; error: GraphqlError }> => gqlMutation<User>('updateUser', { fields, log, variables });
export const useVerifyUserMutation = (
  variables: { token: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('verifyUser', { fields: null, log, variables });
export const useDeleteFileMutation = (
  variables: { filename: string },
  fields?: InputFields<FileInfo>[] | null,
  log?: boolean,
): Promise<{ data: FileInfo; error: GraphqlError }> => gqlMutation<FileInfo>('deleteFile', { fields, log, variables });
export const useUploadFileMutation = (
  variables: { file: any },
  fields?: InputFields<FileInfo>[] | null,
  log?: boolean,
): Promise<{ data: FileInfo; error: GraphqlError }> => gqlMutation<FileInfo>('uploadFile', { fields, log, variables });
export const useUploadFilesMutation = (
  variables: { files: any[] },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('uploadFiles', { fields: null, log, variables });
export const useCreateContainerMutation = (
  variables: { input: ContainerCreateInput; projectId: string },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
): Promise<{ data: Container; error: GraphqlError }> =>
  gqlMutation<Container>('createContainer', { fields, log, variables });
export const useDuplicateContainerMutation = (
  variables: { containerId: string },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
): Promise<{ data: Container; error: GraphqlError }> =>
  gqlMutation<Container>('duplicateContainer', { fields, log, variables });
export const useDeleteContainerMutation = (
  variables: { id: string },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
): Promise<{ data: Container; error: GraphqlError }> =>
  gqlMutation<Container>('deleteContainer', { fields, log, variables });
export const useUpdateContainerMutation = (
  variables: { id: string; input: ContainerInput },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
): Promise<{ data: Container; error: GraphqlError }> =>
  gqlMutation<Container>('updateContainer', { fields, log, variables });
export const useDeployContainerMutation = (
  variables: { id: string },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
): Promise<{ data: Container; error: GraphqlError }> =>
  gqlMutation<Container>('deployContainer', { fields, log, variables });
export const useStopContainerMutation = (
  variables: { id: string },
  fields?: InputFields<Container>[] | null,
  log?: boolean,
): Promise<{ data: Container; error: GraphqlError }> =>
  gqlMutation<Container>('stopContainer', { fields, log, variables });
export const useStopAllContainersMutation = (log?: boolean): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('stopAllContainers', { fields: null, log });
export const useStartAllStoppedContainersMutation = (log?: boolean): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('startAllStoppedContainers', { fields: null, log });
export const useDeleteVolumeMutation = (
  variables: { id: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('deleteVolume', { fields: null, log, variables });
export const useCreateProjectMutation = (
  variables: { input: ProjectCreateInput; teamId: string },
  fields?: InputFields<Project>[] | null,
  log?: boolean,
): Promise<{ data: Project; error: GraphqlError }> => gqlMutation<Project>('createProject', { fields, log, variables });
export const useDeleteProjectMutation = (
  variables: { id: string },
  fields?: InputFields<Project>[] | null,
  log?: boolean,
): Promise<{ data: Project; error: GraphqlError }> => gqlMutation<Project>('deleteProject', { fields, log, variables });
export const useUpdateProjectMutation = (
  variables: { id: string; input: ProjectInput },
  fields?: InputFields<Project>[] | null,
  log?: boolean,
): Promise<{ data: Project; error: GraphqlError }> => gqlMutation<Project>('updateProject', { fields, log, variables });
export const useCreateTeamMutation = (
  variables: { input: TeamCreateInput },
  fields?: InputFields<Team>[] | null,
  log?: boolean,
): Promise<{ data: Team; error: GraphqlError }> => gqlMutation<Team>('createTeam', { fields, log, variables });
export const useDeleteTeamMutation = (
  variables: { id: string },
  fields?: InputFields<Team>[] | null,
  log?: boolean,
): Promise<{ data: Team; error: GraphqlError }> => gqlMutation<Team>('deleteTeam', { fields, log, variables });
export const useUpdateTeamMutation = (
  variables: { id: string; input: TeamInput },
  fields?: InputFields<Team>[] | null,
  log?: boolean,
): Promise<{ data: Team; error: GraphqlError }> => gqlMutation<Team>('updateTeam', { fields, log, variables });
export const useInviteTeamMemberMutation = (
  variables: { input: UserCreateInput; teamId: string },
  fields?: InputFields<User>[] | null,
  log?: boolean,
): Promise<{ data: User; error: GraphqlError }> => gqlMutation<User>('inviteTeamMember', { fields, log, variables });
export const useCreateBuildMutation = (
  variables: { input: BuildCreateInput },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
): Promise<{ data: Build; error: GraphqlError }> => gqlMutation<Build>('createBuild', { fields, log, variables });
export const useDeleteBuildMutation = (
  variables: { id: string },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
): Promise<{ data: Build; error: GraphqlError }> => gqlMutation<Build>('deleteBuild', { fields, log, variables });
export const useUpdateBuildMutation = (
  variables: { id: string; input: BuildInput },
  fields?: InputFields<Build>[] | null,
  log?: boolean,
): Promise<{ data: Build; error: GraphqlError }> => gqlMutation<Build>('updateBuild', { fields, log, variables });
export const useRestartBuildMutation = (
  variables: { id: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('restartBuild', { fields: null, log, variables });
export const useStopBuildMutation = (
  variables: { id: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('stopBuild', { fields: null, log, variables });
export const useCreateWebPushMutation = (
  variables: { input: WebPushCreateInput },
  fields?: InputFields<WebPush>[] | null,
  log?: boolean,
): Promise<{ data: WebPush; error: GraphqlError }> => gqlMutation<WebPush>('createWebPush', { fields, log, variables });
export const useDeleteWebPushMutation = (
  variables: { id: string },
  fields?: InputFields<WebPush>[] | null,
  log?: boolean,
): Promise<{ data: WebPush; error: GraphqlError }> => gqlMutation<WebPush>('deleteWebPush', { fields, log, variables });
export const useUpdateWebPushMutation = (
  variables: { id: string; input: WebPushInput },
  fields?: InputFields<WebPush>[] | null,
  log?: boolean,
): Promise<{ data: WebPush; error: GraphqlError }> => gqlMutation<WebPush>('updateWebPush', { fields, log, variables });
export const useCreateRegistryMutation = (
  variables: { input: RegistryCreateInput; teamId: string },
  fields?: InputFields<Registry>[] | null,
  log?: boolean,
): Promise<{ data: Registry; error: GraphqlError }> =>
  gqlMutation<Registry>('createRegistry', { fields, log, variables });
export const useDeleteRegistryMutation = (
  variables: { id: string },
  fields?: InputFields<Registry>[] | null,
  log?: boolean,
): Promise<{ data: Registry; error: GraphqlError }> =>
  gqlMutation<Registry>('deleteRegistry', { fields, log, variables });
export const useUpdateRegistryMutation = (
  variables: { id: string; input: RegistryInput },
  fields?: InputFields<Registry>[] | null,
  log?: boolean,
): Promise<{ data: Registry; error: GraphqlError }> =>
  gqlMutation<Registry>('updateRegistry', { fields, log, variables });
export const useCreateSourceMutation = (
  variables: { input: SourceCreateInput },
  fields?: InputFields<Source>[] | null,
  log?: boolean,
): Promise<{ data: Source; error: GraphqlError }> => gqlMutation<Source>('createSource', { fields, log, variables });
export const useDeleteSourceMutation = (
  variables: { id: string },
  fields?: InputFields<Source>[] | null,
  log?: boolean,
): Promise<{ data: Source; error: GraphqlError }> => gqlMutation<Source>('deleteSource', { fields, log, variables });
export const useUpdateSourceMutation = (
  variables: { id: string; input: SourceInput },
  fields?: InputFields<Source>[] | null,
  log?: boolean,
): Promise<{ data: Source; error: GraphqlError }> => gqlMutation<Source>('updateSource', { fields, log, variables });
export const useCreateBackupMutation = (
  variables: { input: BackupCreateInput },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
): Promise<{ data: Backup; error: GraphqlError }> => gqlMutation<Backup>('createBackup', { fields, log, variables });
export const useDeleteBackupMutation = (
  variables: { id: string },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
): Promise<{ data: Backup; error: GraphqlError }> => gqlMutation<Backup>('deleteBackup', { fields, log, variables });
export const useRestoreBackupMutation = (
  variables: { containerId: string; s3Key: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('restoreBackup', { fields: null, log, variables });
export const useRestoreBackupVolumeMutation = (
  variables: { containerId: string; s3Key: string },
  log?: boolean,
): Promise<{ data: boolean; error: GraphqlError }> =>
  gqlMutation<boolean>('restoreBackupVolume', { fields: null, log, variables });
export const useUpdateBackupMutation = (
  variables: { id: string; input: BackupInput },
  fields?: InputFields<Backup>[] | null,
  log?: boolean,
): Promise<{ data: Backup; error: GraphqlError }> => gqlMutation<Backup>('updateBackup', { fields, log, variables });
export const useCreateApiKeyMutation = (
  variables: { input: ApiKeyCreateInput },
  fields?: InputFields<ApiKey>[] | null,
  log?: boolean,
): Promise<{ data: ApiKey; error: GraphqlError }> => gqlMutation<ApiKey>('createApiKey', { fields, log, variables });
export const useDeleteApiKeyMutation = (
  variables: { id: string },
  fields?: InputFields<ApiKey>[] | null,
  log?: boolean,
): Promise<{ data: ApiKey; error: GraphqlError }> => gqlMutation<ApiKey>('deleteApiKey', { fields, log, variables });
export const useUserCreatedSubscription = (
  fields?: InputFields<User>[] | null,
  log?: boolean,
): Promise<ReturnTypeOfSubscription<User>> => gqlSubscription<User>('userCreated', { fields, log });
export const useEventsSubscription = (
  fields?: InputFields<EventsOutput>[] | null,
  log?: boolean,
): Promise<ReturnTypeOfSubscription<EventsOutput>> => gqlSubscription<EventsOutput>('events', { fields, log });
export const useProjectCreatedSubscription = (
  fields?: InputFields<Project>[] | null,
  log?: boolean,
): Promise<ReturnTypeOfSubscription<Project>> => gqlSubscription<Project>('projectCreated', { fields, log });
export const useBuildCreatedSubscription = (
  fields?: InputFields<Build>[] | null,
  log?: boolean,
): Promise<ReturnTypeOfSubscription<Build>> => gqlSubscription<Build>('buildCreated', { fields, log });
export const useWebPushCreatedSubscription = (
  fields?: InputFields<WebPush>[] | null,
  log?: boolean,
): Promise<ReturnTypeOfSubscription<WebPush>> => gqlSubscription<WebPush>('webPushCreated', { fields, log });
