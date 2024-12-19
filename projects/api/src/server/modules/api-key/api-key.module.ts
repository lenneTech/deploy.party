import { ConfigService } from '@lenne.tech/nest-server';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PubSub } from 'graphql-subscriptions';

import { UserModule } from '../user/user.module';
import { ApiKey, ApiKeySchema } from './api-key.model';
import { ApiKeyResolver } from './api-key.resolver';
import { ApiKeyService } from './api-key.service';

/**
 * ApiKey module
 */
@Module({
  controllers: [],
  exports: [MongooseModule, ApiKeyResolver, ApiKeyService],
  imports: [
    MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }]),
    forwardRef(() => UserModule),
  ],
  providers: [
    ConfigService,
    ApiKeyResolver,
    ApiKeyService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
})
export class ApiKeyModule {}
