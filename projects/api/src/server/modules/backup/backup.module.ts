import {ConfigService} from '@lenne.tech/nest-server';
import {forwardRef, Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {UserModule} from '../user/user.module';
import {Backup, BackupSchema} from './backup.model';
import {BackupResolver} from './backup.resolver';
import {BackupService} from './backup.service';
import {BuildModule} from "../build/build.module";
import {ProjectModule} from "../project/project.module";
import {DockerService} from "../../common/services/docker.service";
import {FileService} from "../../common/services/file.service";
import {ContainerModule} from "../container/container.module";
import {BackupController} from "./backup.controller";

/**
 * Backup module
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Backup.name, schema: BackupSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => BuildModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => ContainerModule),
  ],
  controllers: [
    BackupController,
  ],
  providers: [
    ConfigService,
    BackupResolver,
    BackupService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
    DockerService,
    FileService,
  ],
  exports: [MongooseModule, BackupResolver, BackupService]
})
export class BackupModule {}
