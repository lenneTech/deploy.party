import { Field, ObjectType } from '@nestjs/graphql';
import { Registry } from '../registry.model';

@ObjectType({ description: 'Result of find and count Registrys' })
export class FindAndCountRegistrysResult {
  @Field(() => [Registry], { description: 'Found Registrys' })
  items: Registry[];

  @Field({ description: 'Total count (skip/offset and limit/take are ignored in the count)' })
  totalCount: number;
}
