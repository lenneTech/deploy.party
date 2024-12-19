import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { UserModule } from '../user/user.module';
import { SourceResolver } from './source.resolver';
import { SourceService } from './source.service';
import {Source, SourceSchema} from "./source.model";

/**
 * Source module
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: Source.name, schema: SourceSchema }]), UserModule],
  controllers: [],
  providers: [
    SourceResolver,
    SourceService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [MongooseModule, SourceResolver, SourceService]
})
export class SourceModule {}
