import {mapClasses, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, ObjectType} from '@nestjs/graphql';
import {Prop, Schema as MongooseSchema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Schema} from 'mongoose';
import {PersistenceModel} from '../../common/models/persistence.model';
import {Container} from '../container/container.model';
import {User} from "../user/user.model";
import {ContainerHealthStatus} from "../container/enums/container-health-status.enum";

export type ProjectDocument = Project & Document;

/**
 * Project model
 */
@Restricted(RoleEnum.ADMIN)
@ObjectType({ description: 'Project' })
@MongooseSchema({ timestamps: true })
export class Project extends PersistenceModel {
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'name of Project',
    nullable: false,
  })
  @Prop()
  name: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'identifier of Project',
    nullable: true,
  })
  @Prop()
  identifier?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => ContainerHealthStatus, {
    description: 'healthStatus of Project',
    nullable: true,
  })
  healthStatus: ContainerHealthStatus = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [Container], {
    description: 'containers of Project',
    nullable: true,
  })
  @Prop([{ type: Schema.Types.ObjectId, ref: 'Container' }])
  containers: string[] | Container[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [User], {
    description: 'subscribers of Project',
    nullable: true,
  })
  @Prop([{ type: Schema.Types.ObjectId, ref: 'User' }])
  subscribers: string[] | User[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'image of Project',
    nullable: true,
  })
  @Prop()
  image: string = undefined;

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
    return mapClasses(input, { containers: Container }, this);
  }
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
