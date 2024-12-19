import {mapClasses, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema as MongooseSchema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema} from 'mongoose';
import {PersistenceModel} from '../../common/models/persistence.model';
import {Project} from '../project/project.model';
import {Registry} from '../registry/registry.model';

export type TeamDocument = Team & Document;

/**
 * Team model
 */
@Restricted(RoleEnum.ADMIN)
@ObjectType({description: 'Team'})
@MongooseSchema({timestamps: true})
export class Team extends PersistenceModel {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  /**
   * name of Team
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'name of Team',
    nullable: false,
  })
  @Prop()
  name: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => Boolean, {
    description: 'maintenance mode of Team',
    nullable: true,
  })
  @Prop()
  maintenance: boolean = undefined;

  /**
   * projects of Team
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [Project], {
    description: 'projects of Team',
    nullable: true,
  })
  @Prop([{type: Schema.Types.ObjectId, ref: 'Project'}])
  projects: string[] | Project[] = undefined;

  /**
   * registries of Team
   */
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [Registry], {
    description: 'registries of Team',
    nullable: true,
  })
  @Prop([{type: Schema.Types.ObjectId, ref: 'Registry'}])
  registries: string[] | Registry[] = undefined;

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
    return mapClasses(input, {projects: Project, registries: Registry}, this);
  }
}

export const TeamSchema = SchemaFactory.createForClass(Team);
