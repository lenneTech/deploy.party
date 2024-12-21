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

  @Get(':projectId/download-template')
  @ApiOperation({
    summary: 'Download project template',
    description: 'Download the template of a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project template downloaded successfully',
  })
  async downloadProjectTemplate(@Param('projectId') projectId: string, @CurrentUser() currentUser: User,@Res() res: any) {
    const config = await this.projectService.downloadProjectTemplate(getStringIds(projectId), {currentUser});
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${projectId}.json`);
    res.send(config);
  }

  @Post('upload-template')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload project template',
    description: 'Upload the template of a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project template uploaded successfully',
  })
  async uploadProjectTemplate(@UploadedFile() file: any, @CurrentUser() currentUser: User, @Res() res: any) {
    const configObject = JSON.parse(file.buffer.toString());
    const project = await this.projectService.importProjectTemplate(configObject, {currentUser});
    res.status(200).send(!!project);
    return !!project;
  }
}
