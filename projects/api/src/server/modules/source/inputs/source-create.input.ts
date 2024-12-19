import {Restricted, RoleEnum} from '@lenne.tech/nest-server';
import {Field, InputType} from '@nestjs/graphql';
import {SourceType} from '../enums/source-type.enum';
import {SourceInput} from './source.input';

/**
 * Source create input
 */
@Restricted(RoleEnum.ADMIN)
@InputType({ description: 'Input data to create a new Source' })
export class SourceCreateInput extends SourceInput {
  // ===================================================================================================================
  // Properties
  // ===================================================================================================================
  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Name of Source',
    nullable: false,
  })
  override name: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => SourceType, {
    description: 'Type of Source',
    nullable: true,
  })
  override type: SourceType = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'URL of Source',
    nullable: true,
  })
  override url: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Token of Source',
    nullable: true,
  })
  override token: string = undefined;

  @Restricted(RoleEnum.S_EVERYONE)
  @Field(() => String, {
    description: 'Team of Source',
    nullable: false,
  })
  override team: string = undefined;
}
