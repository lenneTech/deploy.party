import {mapClasses, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema as MongooseSchema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema} from 'mongoose';
import {PersistenceModel} from '../../common/models/persistence.model';
import {Container} from '../container/container.model';
import {BuildStatus} from './enums/build-status.enum';

export type BuildDocument = Build & Document;

/**
 * Build model
 */
@Restricted(RoleEnum.ADMIN)
@ObjectType({ description: 'Build' })
@MongooseSchema({ timestamps: true })
export class Build extends PersistenceModel {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * container of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Container, {
    description: 'container of Build',
    nullable: false,
  })
  @Prop({ type: Schema.Types.ObjectId, ref: 'Container' })
  container: string | Container = undefined;

  /**
   * log of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'log of Build',
    nullable: true,
  })
  @Prop({ default: [] })
  log: string[] = undefined;

  /**
   * status of Build
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => BuildStatus, {
    description: 'status of Build',
    nullable: true,
  })
  @Prop({ default: BuildStatus.QUEUE })
  status: BuildStatus = undefined;

  @Field({ description: 'Finished date', nullable: true })
  @Prop()
  finishedAt: Date = undefined;

  @Prop({ default: false })
  restarted: boolean = false;

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  /**
   * Initialize instance with default values instead of undefined
   */
  override init() {
    super.init();
    // this.xxx = [];
    return this;
  }

  /**
   * Map input
   *
   * Hint: Non-primitive variables should always be mapped (see mapClasses / mapClassesAsync in ModelHelper)
   */
  override map(input) {
    super.map(input);
    return mapClasses(input, { container: Container }, this);
  }
}

export const BuildSchema = SchemaFactory.createForClass(Build);
