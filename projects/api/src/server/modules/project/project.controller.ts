import {Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors} from "@nestjs/common";
import {ProjectService} from "./project.service";
import {ApiOperation, ApiResponse} from "@nestjs/swagger";
import {User} from "../user/user.model";
import {CurrentUser, getStringIds} from "@lenne.tech/nest-server";
import {FileInterceptor} from "@nestjs/platform-express";

@Controller('project')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
  ) {}

  @Get(':projectId/download-config')
  @ApiOperation({
    summary: 'Download project configuration',
    description: 'Download the configuration of a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project configuration downloaded successfully',
  })
  async downloadProjectConfig(@Param('projectId') projectId: string, @CurrentUser() currentUser: User,@Res() res: any) {
    const config = await this.projectService.downloadProjectConfig(getStringIds(projectId), {currentUser});
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${projectId}.json`);
    res.send(config);
  }

  @Post('upload-config')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload project configuration',
    description: 'Upload the configuration of a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project configuration uploaded successfully',
  })
  async uploadProjectConfig(@UploadedFile() file: any, @CurrentUser() currentUser: User, @Res() res: any) {
    const configObject = JSON.parse(file.buffer.toString());
    const project = await this.projectService.importProjectConfig(configObject, {currentUser});
    res.status(200).send(!!project);
    return !!project;
  }
}
