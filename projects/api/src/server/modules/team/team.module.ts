import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { Team, TeamSchema } from './team.model';
import { TeamResolver } from './team.resolver';
import { TeamService } from './team.service';
import { BuildModule } from '../build/build.module';

/**
 * Team module
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
    ]),
    UserModule,
    forwardRef(() => ProjectModule),
    forwardRef(() => BuildModule),
  ],
  controllers: [],
  providers: [
    TeamResolver,
    TeamService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [MongooseModule, TeamResolver, TeamService],
})
export class TeamModule {}
