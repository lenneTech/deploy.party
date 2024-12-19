import {forwardRef, Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {ContainerModule} from '../container/container.module';
import {TeamModule} from '../team/team.module';
import {UserModule} from '../user/user.module';
import {Build, BuildSchema} from './build.model';
import {BuildResolver} from './build.resolver';
import {BuildService} from './build.service';
import {WebhookController} from './controller/webhook.controller';
import {WebPushModule} from "../web-push/web-push.module";
import {ProjectModule} from "../project/project.module";
import {DockerService} from "../../common/services/docker.service";
import {FileService} from "../../common/services/file.service";
import {BullModule} from "@nestjs/bull";
import {BuildProcessor} from "./processors/build.processor";

/**
 * Build module
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Build.name, schema: BuildSchema }]),
    BullModule.registerQueue({
      name: 'build',
      settings: {
        lockDuration: 30000,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        timeout: 3600000,
        attempts: 3,
      }
    }),
    forwardRef(() => UserModule),
    forwardRef(() => ContainerModule),
    forwardRef(() => TeamModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => WebPushModule),
  ],
  controllers: [WebhookController],
  providers: [
    BuildResolver,
    BuildService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
    DockerService,
    FileService,
    BuildProcessor,
  ],
  exports: [MongooseModule, BuildResolver, BuildService],
})
export class BuildModule {}
