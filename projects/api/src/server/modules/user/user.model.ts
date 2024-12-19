import {CoreUserModel, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema as MongooseSchema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema} from 'mongoose';
import {PersistenceModel} from '../../common/models/persistence.model';
import {Team} from '../team/team.model';
import {IsEmail, IsOptional} from "class-validator";

export type UserDocument = User & Document;

/**
 * User model
 */
@ObjectType({ description: 'User' })
@MongooseSchema({ timestamps: true })
export class User extends CoreUserModel implements PersistenceModel {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * URL to avatar file of the user
   */
  @Field({ description: 'URL to avatar file of the user', nullable: true })
  @Prop()
  avatar: string = undefined;

  /**
   * ID of the user who created the object
   *
   * Not set when created by system
   */
  @Field(() => String, {
    description: 'ID of the user who created the object',
    nullable: true,
  })
  @Prop({ type: Schema.Types.ObjectId, ref: 'User' })
  createdBy: string = undefined;

  /**
   * E-Mail address of the user
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field({ description: 'Email of the user', nullable: true })
  @IsEmail()
  @Prop({ lowercase: true, trim: true, unique: true })
  override email: string = undefined;
  /**
   * Roles of the user
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(type => [String], { description: 'Roles of the user', nullable: true })
  @IsOptional()
  @Prop([String])
  override roles: string[] = undefined;

  /**
   * ID of the user who updated the object
   *
   * Not set when updated by system
   */
  @Field(() => String, {
    description: 'ID of the user who last updated the object',
    nullable: true,
  })
  @Prop({ type: Schema.Types.ObjectId, ref: 'User' })
  updatedBy: string = undefined;

   @Field(() => Team, {
    description: 'ID of the team',
    nullable: true,
  })
  @Prop({ type: Schema.Types.ObjectId, ref: 'Team' })
  team: Team = undefined;
  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  /**
   * Initialize instance with default values instead of undefined
   */
  override init() {
    super.init();
    // Nothing more to initialize yet
    return this;
  }

  /**
   * Map input
   */
  override map(input) {
    super.map(input);
    // There is nothing to map yet. Non-primitive variables should always be mapped.
    // If something comes up, you can use `mapClasses` / `mapClassesAsync` from ModelHelper.
    return this;
  }

  /**
   * Verification of the user's rights to access the properties of this object
   */
  override securityCheck(user: User, force?: boolean) {
    if (force || (user && (user.id === this.id || user.hasRole(RoleEnum.ADMIN)))) {
      return this;
    }

    // Remove (values of) properties
    if (!user || user.id !== this.id) {
      this.roles = [];
      this.verified = null;
      this.verifiedAt = null;

      // PersistenceModel and CorePersistenceModel
      this.createdBy = null;
      this.updatedBy = null;
    }

    // Return prepared user
    return this;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
