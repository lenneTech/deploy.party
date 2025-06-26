import {Field, ObjectType} from '@nestjs/graphql';
import {Prop} from '@nestjs/mongoose';
import {ContainerVolumeType} from "./enums/container-volume-types.enum";

@ObjectType({
  description: 'Defines a volume for a container',
})
export class ContainerVolume {
  @Field(() => String, {
    description: 'source of ContainerVolume',
    nullable: true,
  })
  @Prop({ type: String })
  source?: string = undefined;

  @Field(() => String, {
    description: 'destination of ContainerVolume',
    nullable: true,
  })
  @Prop({ type: String })
  destination?: string = undefined;

  @Field(() => ContainerVolumeType, {
    description: 'destination of ContainerVolume',
  })
  @Prop({ type: ContainerVolumeType })
  type: ContainerVolumeType = undefined;
}
