import {ApiProperty} from "@nestjs/swagger";
import {IsOptional} from "class-validator";

export class BackupExternResult {
  @ApiProperty({ example: '12312321321321321' })
  @IsOptional()
  id: string;

  @ApiProperty({ example: 'STARTED' })
  @IsOptional()
  status: string;

  @ApiProperty({ example: 'BACKUP_MONGO' })
  @IsOptional()
  key: string;
}
