import {CrudService, FilterArgs, filterMerge, getStringIds, ServiceOptions} from '@lenne.tech/nest-server';
import {Inject, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {FilterQuery, Model, QueryOptions} from 'mongoose';
import {Source, SourceDocument} from "./source.model";
import {SourceType} from "./enums/source-type.enum";
import {SourceInput} from "./inputs/source.input";
import {SourceCreateInput} from "./inputs/source-create.input";
import {generateWebhookSecret} from "../../common/helpers/webhook-token.helper";

/**
 * Source service
 */
@Injectable()
export class SourceService extends CrudService<Source> {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  // ===================================================================================================================
  // Injections
  // ===================================================================================================================

  /**
   * Constructor for injecting services
   */
  constructor(
    @InjectModel('Source') protected readonly sourceModel: Model<SourceDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub
  ) {
    super({ mainDbModel: sourceModel, mainModelConstructor: Source });
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  override async create(input: SourceCreateInput, serviceOptions?: ServiceOptions): Promise<Source> {
    if (!input.type) {
      // Set type
      input.type = input.url.includes('gitlab') ? SourceType.GITLAB : SourceType.GITHUB;
    }

    // Create source
    const source = await super.create(input, serviceOptions);

    // DEV-4068: every source gets its own webhook secret. Written directly, because it is not part of
    // the create input: a client never chooses it.
    const webhookSecret = generateWebhookSecret();
    await this.mainDbModel.updateOne({ _id: source.id }, { $set: { webhookSecret } }).exec();
    source.webhookSecret = webhookSecret;
    return source;
  }

  override async update(id: string, input: SourceInput, serviceOptions?: ServiceOptions): Promise<Source> {
    // Update source
    return await super.update(id, input, serviceOptions);
  }

  override async find(
    filter?: FilterArgs | { filterQuery?: FilterQuery<any>; queryOptions?: QueryOptions; samples?: number },
    serviceOptions?: ServiceOptions
  ): Promise<Source[]> {
    const mergedFilter = filterMerge(filter, { team: getStringIds(serviceOptions?.currentUser?.team) });
    return await super.find(mergedFilter, serviceOptions);
  }

  override async get(id: string, serviceOptions?: ServiceOptions): Promise<Source> {
    const source =  await super.get(id, serviceOptions);

    if (getStringIds(source.team) !== getStringIds(serviceOptions.currentUser?.team)) {
      throw new Error('Source not found');
    }

    return source;
  }
}
