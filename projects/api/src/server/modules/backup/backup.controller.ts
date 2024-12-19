import {Controller, Get, Param, Post, Res, StreamableFile, UploadedFile, UseInterceptors} from "@nestjs/common";
import {createReadStream, promises as fs} from 'fs';
import {BackupService} from "./backup.service";
import type {Response} from 'express';
import {FileInterceptor} from "@nestjs/platform-express";
import envConfig from "../../../config.env";
import {execa} from "execa";

@Controller('backup')
export class BackupController {

  constructor(private backupService: BackupService) {}

  @Get('download/:id')
  async getFile(@Param('id') id: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const path = await this.backupService.download(id);
    const file = createReadStream(path);
    res.set({
      'Content-Type': 'application/gzip',
      'Content-Disposition': 'attachment; filename="backup.tar.gz"',
    });
    return new StreamableFile(file);
  }

  @Post('upload/:id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Param('id') id: string, @UploadedFile() file): Promise<boolean> {
    if (!file) {
      return false;
    }

    // write buffer to file
    await execa('mkdir', ['-p', envConfig.projectsDir + '/backups']);
    await fs.writeFile(envConfig.projectsDir + '/backups/backup.tar.gz', file.buffer);
    await this.backupService.processUpload(id);

    return true;
  }
}
