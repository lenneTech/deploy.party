import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";

export class AutoBackupDto {
  @IsNotEmpty()
  @ApiProperty({ example: true })
  readonly enableAutoBackup: boolean;

  constructor(params: AutoBackupDto) {
    Object.assign(this, params);
  }
}
