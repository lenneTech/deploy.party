import { Field, InputType } from "@nestjs/graphql";
import { IsOptional } from "class-validator";

@InputType({ description: 'Input data for basic auth' })
export class BasicAuthInput {
  @Field(() => String, { description: 'username of BasicAuth', nullable: true })
  @IsOptional()
  username?: string = undefined;

  @Field(() => String, { description: 'password of address', nullable: true })
  @IsOptional()
  pw?: string = undefined;
}
