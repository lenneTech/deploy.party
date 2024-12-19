import {CrudService, getStringIds, ServiceOptions} from '@lenne.tech/nest-server';
import {forwardRef, Inject, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {Model} from 'mongoose';
import {RegistryCreateInput} from './inputs/registry-create.input';
import {Registry, RegistryDocument} from './registry.model';
import {TeamService} from '../team/team.service';

/**
 * Registry service
 */
@Injectable()
export class RegistryService extends CrudService<Registry> {
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
    @InjectModel('Registry') protected readonly registryModel: Model<RegistryDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub,
    @Inject(forwardRef(() => TeamService))
    private teamService: TeamService
  ) {
    super({ mainDbModel: registryModel, mainModelConstructor: Registry });
  }

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  /**
   * Create new Registry
   * Overwrites create method from CrudService
   */
  async createRegistry(
    teamId: string,
    input: RegistryCreateInput,
    serviceOptions?: ServiceOptions
  ): Promise<Registry> {
    const team = await this.teamService.get(teamId);

    // Get new Registry
    const createdRegistry = await super.create(input, serviceOptions);

    // Inform subscriber
    if (serviceOptions?.pubSub === undefined || serviceOptions.pubSub) {
      await this.pubSub.publish('registryCreated', Registry.map(createdRegistry));
    }

    team.registries.push(createdRegistry.id as any);
    await this.teamService.update(team.id, { registries: getStringIds(team.registries) });

    // Return created Registry
    return createdRegistry;
  }
}
