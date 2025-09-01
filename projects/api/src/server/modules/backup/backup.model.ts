import {equalIds, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema as MongooseSchema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema} from 'mongoose';
import {PersistenceModel} from '../../common/models/persistence.model';
import {User} from '../user/user.model';
import {Container} from "../container/container.model";
import {BackupType} from "./enum/backup-type.enum";

export type BackupDocument = Backup & Document;

/**
 * Backup model
 */
@Restricted(RoleEnum.ADMIN)
@ObjectType({ description: 'Backup' })
@MongooseSchema({ timestamps: true })
export class Backup extends PersistenceModel {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * Active of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'Active of Backup',
    nullable: false,
  })
  @Prop()
  active: boolean = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'path of Backup',
    nullable: true,
  })
  @Prop()
  path: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Container, {
    description: 'Container of Backup',
    nullable: false,
  })
  @Prop({ type: Schema.Types.ObjectId, ref: 'Container' })
  container: string | Container = undefined;

  /**
   * CronExpression of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'CronExpression of Backup',
    nullable: true,
  })
  @Prop()
  cronExpression: string = undefined;

  /**
   * Host of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Host of Backup',
    nullable: true,
  })
  @Prop()
  host: string = undefined;

  /**
   * Key of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Key of Backup',
    nullable: true,
  })
  @Prop()
  key: string = undefined;

  /**
   * Secret of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Secret of Backup',
    nullable: true,
  })
  @Prop()
  secret: string = undefined;

  /**
   * Region of Backup
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Region of Backup',
    nullable: true,
  })
  @Prop()
  region: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Bucket of Backup',
    nullable: true,
  })
  @Prop()
  bucket: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Log of last backup',
    nullable: true,
  })
  @Prop({ default: [] })
  log: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Restore log of last backup',
    nullable: true,
  })
  @Prop({ default: [] })
  restoreLog: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field({ description: 'Last backup date', nullable: true })
  @Prop()
  lastBackup: Date = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field({ description: 'Last backup date', nullable: true })
  @Prop()
  maxBackups: number = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => BackupType, {
    description: 'Type of backup',
    nullable: true,
  })
  @Prop({ default: BackupType.VOLUME })
  type: BackupType = undefined;
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

  /**
   * Verification of the user's rights to access the properties of this object
   *
   * Check roles, prepare or remove properties
   * Return undefined if the whole object should not be returned or throw an exception to stop the whole request
   */
  override securityCheck(user: User, force?: boolean) {
    // In force mode or for admins everything is allowed
    if (force || (user?.hasRole && user?.hasRole(RoleEnum.ADMIN))) {
      return this;
    }

    // Usually only the creator has access to the object
    if (!equalIds(user, this.createdBy)) {
      return undefined;
    }

    // Check permissions for properties of this object and return the object afterwards
    return this;
  }
}

export const BackupSchema = SchemaFactory.createForClass(Backup);
