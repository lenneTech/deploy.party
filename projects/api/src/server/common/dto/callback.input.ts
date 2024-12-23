import {IsOptional, IsUrl} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class CallbackInput {
  @IsOptional()
  @ApiProperty({ example: 'test/mongo123sfnfds.tar.gz', nullable: true, required: false })
  readonly backupKey?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @ApiProperty({ example: 'https://example.com', nullable: true, required: false })
  readonly callbackUrl?: string;

  constructor(params: CallbackInput) {
    Object.assign(this, params);
  }
}
