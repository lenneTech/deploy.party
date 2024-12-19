import {ConfigService, CrudService} from '@lenne.tech/nest-server';
import {forwardRef, Inject, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {Model} from 'mongoose';
import {WebPush, WebPushDocument} from './web-push.model';
import {WebPushCreateInput} from './inputs/web-push-create.input';
import {WebPushInput} from './inputs/web-push.input';
import {SubscribeWebPush} from "./inputs/subscribe-web-push";
import {User} from "../user/user.model";
import {UserService} from "../user/user.service";
import {SendWebPush} from "./inputs/send-web-push";
import * as webpush from 'web-push';
import {ProjectService} from "../project/project.service";
import configEnv from "../../../config.env";

const vapidKeys = {
  publicKey: configEnv.webPush.publicKey,
  privateKey: configEnv.webPush.privateKey,
};
webpush.setVapidDetails(
  'mailto:pascal@klesse.dev',
  vapidKeys.publicKey,
  vapidKeys.privateKey,
)

/**
 * WebPush service
 */
@Injectable()
export class WebPushService extends CrudService<WebPush, WebPushCreateInput, WebPushInput> {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  // ===================================================================================================================
  // Injections
  // ===================================================================================================================

  constructor(
    protected override readonly configService: ConfigService,
    @InjectModel('WebPush') protected readonly webPushModel: Model<WebPushDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub,
    protected readonly userService: UserService,
    @Inject(forwardRef(() => ProjectService))
    private projectService: ProjectService,
  ) {
    super({configService: configService, mainDbModel: webPushModel, mainModelConstructor: WebPush});
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================
  async notifyProjectSubs(projectId: string, input: SendWebPush) {
    const subs = await this.projectService.getSubscribersOfProject(projectId);

    for (const sub of subs) {
      const data = {
        ...input,
        userId: sub
      }

      await this.sendToSinglePushSubscriber(sub, data)
    }
  }

  async subscribe(input: SubscribeWebPush, currentUser: User) {
    const subscription = JSON.stringify(input.payload)
    const found = await this.find({filterQuery: {subscription}})
    if (!found?.length) {
      const data: WebPushCreateInput = WebPushCreateInput.map({
        subscription,
        user: currentUser.id
      });
      await this.create(data)
    } else {
      if (currentUser) {
        await this.update(found[0].id, { user: currentUser.id });
      }
    }
  }

  async unsubscribe(userId: string, currentUser: User) {
    const webPush = await this.findOneByUserId(userId);
    await this.delete(webPush.id, { currentUser });
    return true;
  }

  async send(input: SendWebPush) {
    if (input.userId) {
      await this.sendToSinglePushSubscriber(input.userId, input)
    } else {
      const pushs = await this.find({})
      const sendPromises: Promise<webpush.SendResult>[] = []
      for (const item of pushs) {
        const data = this.getSubscriptionPayload(item.subscription)
        const payload = JSON.stringify(input)
        const promise = webpush.sendNotification(data, payload)
        sendPromises.push(promise)
      }
      try {
        await Promise.all(sendPromises)
      }
      catch (error) {
        // eslint-disable-next-line no-console
        console.log('error', error)
      }
    }
  }

  async sendToSinglePushSubscriber(userId: string, dto: Omit<SendWebPush, 'id'>) {
    const webPushes = await this.findAllByUserId(userId);

    if (!webPushes?.length) {
      return;
    }

    for (const webPushElement of webPushes) {
      const push = this.getSubscriptionPayload(webPushElement.subscription);
      try {
        await webpush.sendNotification(push, JSON.stringify(dto));
      } catch (error) {
        // Delete subscription if not valid anymore
        if (error.statusCode === 410) {
          await this.deleteForce(webPushElement.id);
          return;
        }
        console.error(error);
      }
    }
  }

  findAllByUserId(userId: string): Promise<WebPush[]> {
    return this.find({ filterQuery: { user: userId } });
  }

  async findOneByUserId(userId: string): Promise<WebPush | null> {
    const webPushs = await this.find({filterQuery: {user: userId}})
    return webPushs?.length ? webPushs[0] : null;
  }

  getSubscriptionPayload(payload: unknown): webpush.PushSubscription {
    if (typeof payload === 'string') {
      const data = JSON.parse(payload);
      if (data.endpoint) {
        return data as webpush.PushSubscription;
      } else {
        return JSON.parse(data) as webpush.PushSubscription;
      }
    } else {
      return payload as webpush.PushSubscription;
    }
  }
}
