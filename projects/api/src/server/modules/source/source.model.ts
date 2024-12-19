import { Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema as MongooseSchema, SchemaFactory } from '@nestjs/mongoose';
import {Document, Schema} from 'mongoose';
import { PersistenceModel } from '../../common/models/persistence.model';
import { SourceType } from './enums/source-type.enum';
import {Team} from "../team/team.model";

export type SourceDocument = Source & Document;

/**
 * Source model
 */
@Restricted(RoleEnum.ADMIN)
@ObjectType({ description: 'Source' })
@MongooseSchema({ timestamps: true })
export class Source extends PersistenceModel {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * name of Source
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'name of Source',
    nullable: false,
  })
  @Prop({ unique: true, index: true })
  name: string = undefined;

  /**
   * type of Source
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => SourceType, {
    description: 'type of Source',
    nullable: false,
  })
  @Prop({ default: SourceType.GITLAB })
  type: SourceType = undefined;


  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'url of Source',
    nullable: false,
  })
  @Prop()
  url: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'token of Source',
    nullable: false,
  })
  @Prop()
  token: string = undefined;

  @Field(() => Team, {
    description: 'team of Source',
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
    // this.xxx = [];
    return this;
  }

  /**
   * Map input
   *
   * Hint: Non-primitive variables should always be mapped (see mapClasses / mapClassesAsync in ModelHelper)
   */
  override map(input) {
    return super.map(input);
  }
}

export const SourceSchema = SchemaFactory.createForClass(Source);
