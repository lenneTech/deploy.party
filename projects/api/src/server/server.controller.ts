import {ConfigService, RoleEnum, Roles} from '@lenne.tech/nest-server';
import {Controller, Get, Headers, Render} from '@nestjs/common';
import {version} from './../../package.json';
import {MetaService} from './modules/meta/meta.service';
import {ApiKeyService} from "./modules/api-key/api-key.service";
import * as si from "systeminformation";
import {SystemService} from "./common/services/system.service";
import envConfig from "../config.env";

@Controller()
export class ServerController {
  constructor(
    protected configService: ConfigService,
    protected metaService: MetaService,
    protected systemService: SystemService,
    private apiKeyService: ApiKeyService) {}

  @Get()
  @Render('index')
  root() {
    // meta.json can be overwritten during the builds process
    return {
      env: this.configService.get('env'),
      version: version,
      title: 'deploy.party',
    };
  }

  @Get('meta')
  meta() {
    return this.metaService.get();
  }

  @Get('config')
  @Roles(RoleEnum.ADMIN)
  config() {
    return this.configService.configFastButReadOnly;
  }

  @Get('metrics')
  async metrics(@Headers('dp-api-token') apiToken: string){
    if (!envConfig.enableMetrics) {
      return;
    }

    if(!apiToken) {
      return 'No API Token provided';
    }

    const valid = await this.apiKeyService.checkTokenIsValid(apiToken);
    if (!valid) {
      return 'Invalid API Token';
    }

    const cpu = await si.currentLoad();
    const time = await si.time();
    const memory = await si.mem();
    const docker = await si.dockerInfo();
    const systemUpdatesAvailable = await this.systemService.systemUpdatesAvailable();

    const usedRam = Math.round(memory.used / 1024 / 1024 / 1024);
    const totalRam = Math.round(memory.total / 1024 / 1024 / 1024);
    const uptime = Math.round(time.uptime / 60 / 60);

    return {
      dpVersion: version,
      traefikVersion: await this.systemService.getTraefikVersion(),
      dockerVersion: docker.serverVersion,
      systemUpdatesAvailable,
      cpu: Number(cpu.currentLoad.toFixed(2)) ?? 0,
      memory: Number(usedRam.toFixed(2)) ?? 0,
      totalMemory: Number(totalRam.toFixed(2)) ?? 0,
      uptime,
    }
  }
}
