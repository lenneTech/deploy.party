import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema as MongooseSchema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';
import {PersistenceModel} from '../../common/models/persistence.model';

export type RegistryDocument = Registry & Document;

/**
 * Registry model
 */
@Restricted(RoleEnum.ADMIN)
@ObjectType({ description: 'Registry' })
@MongooseSchema({ timestamps: true })
export class Registry extends PersistenceModel {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * name of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'name of Registry',
    nullable: true,
  })
  @Prop()
  name: string = undefined;

  /**
   * username of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'username of Registry',
    nullable: true,
  })
  @Prop()
  username: string = undefined;

  /**
   * password of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'pw of Registry',
    nullable: true,
  })
  @Prop()
  pw: string = undefined;

  /**
   * url of Registry
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'url of Registry',
    nullable: false,
  })
  @Prop()
  url: string = undefined;

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
    return this;
  }
}

export const RegistrySchema = SchemaFactory.createForClass(Registry);
