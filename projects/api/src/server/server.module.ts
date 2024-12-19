import {ApiKeyModule} from './modules/api-key/api-key.module';
import {BackupModule} from './modules/backup/backup.module';
import {WebPushModule} from './modules/web-push/web-push.module';
import {Any, CheckSecurityInterceptor, CoreAuthService, CoreModule, DateScalar, JSON} from '@lenne.tech/nest-server';
import {Module} from '@nestjs/common';
import {APP_INTERCEPTOR} from '@nestjs/core';
import {ScheduleModule} from '@nestjs/schedule';
import envConfig from '../config.env';
import {CronJobs} from './common/services/cron-jobs.service';
import {SourceModule} from './modules/source/source.module';
import {AuthModule} from './modules/auth/auth.module';
import {BuildModule} from './modules/build/build.module';
import {ContainerModule} from './modules/container/container.module';
import {FileModule} from './modules/file/file.module';
import {MetaModule} from './modules/meta/meta.module';
import {ProjectModule} from './modules/project/project.module';
import {RegistryModule} from './modules/registry/registry.module';
import {TeamModule} from './modules/team/team.module';
import {ServerController} from './server.controller';
import {DockerService} from "./common/services/docker.service";
import {FileService} from "./common/services/file.service";
import {BullModule} from "@nestjs/bull";
import {SystemService} from "./common/services/system.service";
import {TerminalGateway} from "../terminal.gateway";
import {AuthService} from "./modules/auth/auth.service";
import {ExternController} from "./extern.controller";

/**
 * Server module (dynamic)
 *
 * This is the server module, which includes all modules which are necessary
 * for the project API
 */
@Module({
  // Include modules
  imports: [
    // Include CoreModule for standard processes
    CoreModule.forRoot(CoreAuthService, AuthModule.forRoot(envConfig.jwt), envConfig),

    // Include cron job handling
    ScheduleModule.forRoot(),

    BullModule.forRoot({
      redis: {
        host: envConfig.redis.host,
        port: envConfig.redis.port,
        username: envConfig.redis.username,
        password: envConfig.redis.password,
      },
    }),

    // Include AuthModule for authorization handling,
    // which will also include UserModule
    AuthModule.forRoot(envConfig.jwt),

    // Include MetaModule to offer information about the server
    MetaModule,

    // Include FileModule for file handling
    FileModule,
    ContainerModule,
    RegistryModule,
    ProjectModule,
    BuildModule,
    TeamModule,
    SourceModule,
    WebPushModule,
    BackupModule,
    ApiKeyModule,
  ],

  // Include services and scalars
  providers: [
    Any,
    CronJobs,
    DateScalar,
    JSON,
    {
      provide: APP_INTERCEPTOR,
      useClass: CheckSecurityInterceptor,
    },
    FileService,
    DockerService,
    SystemService,
    AuthService,
    TerminalGateway,
  ],

  // Include REST controllers
  controllers: [ServerController, ExternController],

  // Export modules for reuse in other modules
  exports: [CoreModule, AuthModule, MetaModule, FileModule],
})
export class ServerModule {}
