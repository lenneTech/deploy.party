import {ConfigService, CrudService, ServiceOptions} from '@lenne.tech/nest-server';
import {Inject, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {Model} from 'mongoose';
import {ApiKeyCreateInput} from './inputs/api-key-create.input';
import {ApiKey, ApiKeyDocument} from './api-key.model';
import * as crypto from 'crypto';

/**
 * ApiKey service
 */
@Injectable()
export class ApiKeyService extends CrudService<ApiKey, ApiKeyCreateInput> {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  // ===================================================================================================================
  // Injections
  // ===================================================================================================================

  /**
   * Constructor for injecting services
   *
   * Hints:
   * To resolve circular dependencies, integrate services as follows:
   * @Inject(forwardRef(() => XxxService)) protected readonly xxxService: WrapperType<XxxService>
   */
  constructor(
    protected override readonly configService: ConfigService,
    @InjectModel('ApiKey') protected readonly apiKeyModel: Model<ApiKeyDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub,
  ) {
    super({ configService, mainDbModel: apiKeyModel, mainModelConstructor: ApiKey });
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  /**
   * Create new ApiKey
   */
  override async create(input: ApiKeyCreateInput, serviceOptions?: ServiceOptions): Promise<ApiKey> {
    // Get new ApiKey
    return super.create({
      ...input,
      ...{ key: this.generateKey() }
    }, serviceOptions);
  }

  generateKey() {
    const apiKey = crypto.randomBytes(20).toString('hex');

    return 'dp-' + apiKey;
  }

  async checkTokenIsValid(apiToken: string) {
    return !!(await this.find({ filterQuery: {key: apiToken }}));
  }
}
