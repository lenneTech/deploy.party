import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';
import { UserModule } from '../user/user.module';
import { Registry, RegistrySchema } from './registry.model';
import { RegistryResolver } from './registry.resolver';
import { RegistryService } from './registry.service';
import { TeamModule } from '../team/team.module';

/**
 * Registry module
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: Registry.name, schema: RegistrySchema }]), forwardRef(() => UserModule), forwardRef(() => TeamModule),],
  controllers: [],
  providers: [
    RegistryResolver,
    RegistryService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [MongooseModule, RegistryResolver, RegistryService],
})
export class RegistryModule {}
