import { Restricted, RoleEnum, equalIds, mapClasses } from '@lenne.tech/nest-server';
import { Field, ObjectType } from '@nestjs/graphql';
import { Schema as MongooseSchema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';

import { PersistenceModel } from '../../common/models/persistence.model';
import { User } from '../user/user.model';

export type ApiKeyDocument = ApiKey & Document;

/**
 * ApiKey model
 */
@Restricted(RoleEnum.ADMIN)
@ObjectType({ description: 'ApiKey' })
@MongooseSchema({ timestamps: true })
export class ApiKey extends PersistenceModel {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Name of ApiKey
   */
  @Restricted(RoleEnum.ADMIN)
  @Field(() => String, {
    description: 'Name of ApiKey',
    nullable: true,
  })
  @Prop()
  name: string = undefined;

  /**
   * Key of ApiKey
   */
  @Restricted(RoleEnum.ADMIN)
  @Field(() => String, {
    description: 'Key of ApiKey',
    nullable: false,
  })
  @Prop()
  key: string = undefined;

  /**
   * ExpiredAt of ApiKey
   */
  @Restricted(RoleEnum.ADMIN)
  @Field(() => Number, {
    description: 'ExpiredAt of ApiKey',
    nullable: true,
  })
  @Prop()
  expiredAt: Date = undefined;

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  /**
   * Initialize instance with default values instead of undefined
   */
  override init() {
    super.init();
    // this.propertyName = [];
    return this;
  }

  /**
   * Map input
   *
   * Hint: Non-primitive variables should always be mapped (see mapClasses / mapClassesAsync in ModelHelper)
   */
  override map(input) {
    super.map(input);
    // return mapClasses(input, { propertyName: PropertyModel }, this);
    return this;
  }

  /**
   * Verification of the user's rights to access the properties of this object
   *
   * Check roles, prepare or remove properties
   * Return undefined if the whole object should not be returned or throw an exception to stop the whole request
   */
  override securityCheck(user: User, force?: boolean) {
    // In force mode or for admins everything is allowed
    if (force || user?.hasRole(RoleEnum.ADMIN)) {
      return this;
    }

    // Usually only the creator has access to the object
    if (!equalIds(user, this.createdBy)) {
      return undefined;
    }

    // Check permissions for properties of this object and return the object afterward
    return this;
  }
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
