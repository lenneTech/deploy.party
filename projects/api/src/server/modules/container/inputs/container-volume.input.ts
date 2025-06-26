import {Field, InputType} from "@nestjs/graphql";
import {IsOptional} from "class-validator";
import {ContainerVolumeType} from "../enums/container-volume-types.enum";

@InputType({ description: 'Input data for container volume' })
export class ContainerVolumeInput {
  @Field(() => String, { description: 'source of ContainerVolume', nullable: true })
  @IsOptional()
  source?: string = undefined;

  @Field(() => String, { description: 'destination of ContainerVolume', nullable: true })
  @IsOptional()
  destination?: string = undefined;

  @Field(() => ContainerVolumeType, { description: 'destination of ContainerVolume', nullable: false })
  @IsOptional()
  type: ContainerVolumeType = undefined;
}
