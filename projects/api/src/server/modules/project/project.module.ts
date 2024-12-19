import {forwardRef, Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {TeamModule} from '../team/team.module';
import {UserModule} from '../user/user.module';
import {Project, ProjectSchema} from './project.model';
import {ProjectResolver} from './project.resolver';
import {ProjectService} from './project.service';
import {ContainerModule} from "../container/container.module";

/**
 * Project module
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => TeamModule),
    forwardRef(() => ContainerModule),
  ],
  controllers: [],
  providers: [
    ProjectResolver,
    ProjectService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [MongooseModule, ProjectResolver, ProjectService],
})
export class ProjectModule {}
