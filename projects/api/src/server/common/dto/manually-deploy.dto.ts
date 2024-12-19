import {IsNotEmpty, IsOptional, IsUrl} from "class-validator";
import {DeploymentType} from "../../modules/container/enums/deployment-type.enum";
import {ApiProperty} from "@nestjs/swagger";

export class ManuallyDeployDto {
  @IsNotEmpty()
  @ApiProperty({ enum: DeploymentType, example: DeploymentType.BRANCH })
  readonly deploymentType: DeploymentType;

  @IsNotEmpty()
  @ApiProperty({ example: 'v0.0.1' })
  readonly targetVersion: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @ApiProperty({ example: 'https://example.com', nullable: true, required: false })
  readonly callbackUrl?: string;

  constructor(params: ManuallyDeployDto) {
    Object.assign(this, params);
  }
}
