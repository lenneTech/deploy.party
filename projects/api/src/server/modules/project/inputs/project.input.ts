import {CoreInput, Restricted, RoleEnum} from '@lenne.tech/nest-server';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

/**
 * Project input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to update an existing Project' })
export class ProjectInput extends CoreInput {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Project',
    nullable: true,
  })
  @IsOptional()
  name: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'identifier of Project',
    nullable: true,
  })
  @IsOptional()
  identifier?: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'Containers of Project',
    nullable: true,
  })
  @IsOptional()
  containers: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => [String], {
    description: 'subscribers of Project',
    nullable: true,
  })
  @IsOptional()
  subscribers: string[] = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Image of Project',
    nullable: true,
  })
  @IsOptional()
  image: string = undefined;
}
