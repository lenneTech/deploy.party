import { ApiProperty } from "@nestjs/swagger";

export class DeleteBackupBody {
  @ApiProperty({ example: '12312321321321321' })
  backupKey: string;
}
