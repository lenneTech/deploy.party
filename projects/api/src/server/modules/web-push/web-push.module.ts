import {ConfigService} from '@lenne.tech/nest-server';
import {forwardRef, Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {UserModule} from '../user/user.module';
import {WebPush, WebPushSchema} from './web-push.model';
import {WebPushResolver} from './web-push.resolver';
import {WebPushService} from './web-push.service';
import {WebPushController} from "./controller/web-push.controller";
import {ProjectModule} from "../project/project.module";

/**
 * WebPush module
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: WebPush.name, schema: WebPushSchema }]),
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule),
  ],
  controllers: [WebPushController],
  providers: [
    ConfigService,
    WebPushResolver,
    WebPushService,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [MongooseModule, WebPushResolver, WebPushService]
})
export class WebPushModule {}
