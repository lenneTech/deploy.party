import {forwardRef, Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {BuildModule} from '../build/build.module';
import {ProjectModule} from '../project/project.module';
import {UserModule} from '../user/user.module';
import {Container, ContainerSchema} from './container.model';
import {ContainerResolver} from './container.resolver';
import {ContainerService} from './container.service';
import {DockerService} from "../../common/services/docker.service";
import {FileService} from "../../common/services/file.service";

/**
 * Container module
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Container.name, schema: ContainerSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => BuildModule),
  ],
  controllers: [],
  providers: [
    ContainerResolver,
    ContainerService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
    DockerService,
    FileService,
  ],
  exports: [MongooseModule, ContainerResolver, ContainerService],
})
export class ContainerModule {}
