import { Restricted, RoleEnum } from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { ProjectInput } from './project.input';

/**
 * Project create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to create a new Project' })
export class ProjectCreateInput extends ProjectInput {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Project',
    nullable: false,
  })
  override name: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'identifier of Project',
    nullable: true,
  })
  override identifier?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Containers of Project',
    nullable: true,
  })
  override containers: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'subscribers of Project',
    nullable: true,
  })
  override subscribers: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Image of Project',
    nullable: true,
  })
  @IsOptional()
  override image: string = undefined;
}
