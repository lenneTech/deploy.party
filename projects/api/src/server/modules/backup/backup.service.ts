import {ConfigService, CrudService, getStringIds, ServiceOptions} from '@lenne.tech/nest-server';
import {Inject, Injectable, OnApplicationBootstrap} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {PubSub} from 'graphql-subscriptions';
import {Model} from 'mongoose';
import {Backup, BackupDocument} from './backup.model';
import {BackupCreateInput} from './inputs/backup-create.input';
import {BackupInput} from './inputs/backup.input';
import {SchedulerRegistry} from "@nestjs/schedule";
import {CronJob} from "cron";
import {DeleteObjectCommand, paginateListObjectsV2, S3Client} from "@aws-sdk/client-s3";
import {ProjectService} from "../project/project.service";
import {DockerService} from "../../common/services/docker.service";
import {ContainerService} from "../container/container.service";
import {ContainerStatus} from "../container/enums/container-status.enum";
import {DatabaseType} from "../container/enums/database-type.enum";
import {execa} from "execa";
import envConfig from "../../../config.env";
import {ContainerKind} from "../container/enums/container-kind.enum";
import {Agent} from 'https';
import axios from "axios";
import {BackupStatus} from "./enum/backup-status.enum";
import {BackupType} from "./enum/backup-type.enum";
import {SERVICE_BACKUP_CONFIGS, SupportedBackupServices} from "./types/service-backup-config.interface";

/**
 * Backup service
 */
@Injectable()
export class BackupService extends CrudService<Backup, BackupCreateInput, BackupInput> implements OnApplicationBootstrap {

  // ===================================================================================================================
  // Properties
  // ===================================================================================================================

  // ===================================================================================================================
  // Injections
  // ===================================================================================================================

  /**
   * Constructor for injecting services
   *
   * Hints:
   * To resolve circular dependencies, integrate services as follows:
   * @Inject(forwardRef(() => XxxService)) protected readonly xxxService: WrapperType<XxxService>
   */
  constructor(
    protected override readonly configService: ConfigService,
    @InjectModel('Backup') protected readonly backupModel: Model<BackupDocument>,
    @Inject('PUB_SUB') protected readonly pubSub: PubSub,
    protected schedulerRegistry: SchedulerRegistry,
    protected dockerService: DockerService,
    protected projectService: ProjectService,
    protected containerService: ContainerService,
  ) {
    super({configService: configService, mainDbModel: backupModel, mainModelConstructor: Backup});
  }

  // ===================================================================================================================
  // Constants
  // ===================================================================================================================

  private readonly LOG_LIMIT = 1000;

  // ===================================================================================================================
  // Methods
  // ===================================================================================================================

  /**
   * Push a log entry with slice limit to prevent document size overflow
   */
  private async pushLog(backupId: string, logEntry: string, additionalSet?: Record<string, unknown>): Promise<void> {
    const update: Record<string, unknown> = {
      $push: { log: { $each: [logEntry], $slice: -this.LOG_LIMIT } },
    };
    if (additionalSet) {
      update.$set = additionalSet;
    }
    await this.mainDbModel.updateOne({ _id: backupId }, update).exec();
  }

  /**
   * Push a restore log entry with slice limit to prevent document size overflow
   */
  private async pushRestoreLog(backupId: string, logEntry: string): Promise<void> {
    await this.mainDbModel.updateOne(
      { _id: backupId },
      { $push: { restoreLog: { $each: [logEntry], $slice: -this.LOG_LIMIT } } }
    ).exec();
  }

  async onApplicationBootstrap() {
    const backups = await this.findForce({filterQuery: {active: true}}, {populate: ['container']});

    for (const backup of backups) {
      if (backup.cronExpression) {
        console.debug(`CronJob for backup with id ${backup.id} initialized with ${backup.cronExpression}`);
        this.schedulerRegistry.addCronJob(backup.id, new CronJob(
          backup.cronExpression,
          () => {
            this.backup(backup);
          },
          null,
          true,
          'Europe/Berlin',
          null,
          false
        ));
      }
    }
  }

  /**
   * Create new Backup
   * Overwrites create method from CrudService
   */
  override async create(input: BackupCreateInput, serviceOptions?: ServiceOptions): Promise<Backup> {
    const result = await this.find({filterQuery: {container: getStringIds(input.container)}});

    if (result.length) {
      throw new Error('Backup for this container already exists');
    }

    // Get new Backup
    const createdBackup = await super.create(input, serviceOptions);

    // Inform subscriber
    if (serviceOptions?.pubSub === undefined || serviceOptions.pubSub) {
      await this.pubSub.publish('backupCreated', Backup.map(createdBackup));
    }

    // Return created Backup
    return createdBackup;
  }

  async getByContainer(containerId: string) {
    const result = await this.findForce({filterQuery: {container: getStringIds(containerId)}});
    if (!result.length) {
      throw new Error('No backup found');
    }

    return result[0];
  }

  override async update(id: string, input: BackupInput, serviceOptions?: ServiceOptions): Promise<Backup> {
    const backup = await super.update(id, input, serviceOptions);

    let cronjob;
    try {
      cronjob = this.schedulerRegistry.getCronJob(getStringIds(backup.id));
    } catch (e) {
      console.error(`no cron job found for backup ${backup.id}`);
    }

    if (cronjob) {
      try {
        this.schedulerRegistry.deleteCronJob(getStringIds(backup.id));
        console.debug(`Delete CronJob for Backup(${backup.id}) initialized with ${backup.cronExpression}`);
      } catch (e) {
        console.error(e);
      }
    }

    if (backup.active) {
      console.debug(`CronJob for backup with id ${backup.id} initialized with ${backup.cronExpression}`);
      this.schedulerRegistry.addCronJob(backup.id, new CronJob(
        backup.cronExpression,
        () => {
          this.backup(backup);
        },
        null,
        true,
        'Europe/Berlin',
        null,
        false
      ));
    } else {
      console.debug(`CronJob for backup with id ${backup.id} not initialized because it is not active`);
    }

    return backup;
  }

  async download(containerId: string): Promise<string> {
    const container = await this.containerService.getForce(getStringIds(containerId));

    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      return;
    }

    const project = await this.projectService.getProjectByContainer(container);
    const result = await this.findForce({filterQuery: {container: getStringIds(containerId)}});
    if (!result.length) {
      throw new Error('No backup found');
    }

    const backup = result[0];
    const dockerId = await this.dockerService.getId(getStringIds(container.id));
    const fileName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}_${new Date().toISOString().replace(/[:|.]/g, "-")}`;

    if (!dockerId) {
      return;
    }

    if (container.kind === ContainerKind.DATABASE) {
      if (container.type === DatabaseType.MONGO) {
        await execa(`docker exec ${dockerId} sh -c "mongodump --uri=\"mongodb://localhost:27017\" --out=\"/tmp/${fileName}\" -v"`, {shell: true});
        await execa(`docker exec ${dockerId} sh -c "cd /tmp && tar -zcvf ${fileName}.tar.gz ${fileName}"`, {shell: true});
        await execa(`mkdir -p ${envConfig.projectsDir}/backups`, {shell: true});
        await execa(`docker cp ${dockerId}:/tmp/${fileName}.tar.gz ${envConfig.projectsDir}/backups/${fileName}.tar.gz`, {shell: true});
      } else if (container.type === DatabaseType.MARIA_DB) {
        await execa(`
          export $(grep -v '^#' ${envConfig.projectsDir}/${container.id}/.env | xargs) &&
          echo 'Start dumping' &&
          docker exec ${dockerId} sh -c "mariadb-dump -r /tmp/${fileName}.sql --no-tablespaces --add-drop-table --add-drop-database -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE" &&
          docker exec ${dockerId} sh -c "cd /tmp && tar -zcvf ${fileName}.tar.gz ${fileName}.sql" &&
          mkdir -p ${envConfig.projectsDir}/backups &&
          docker cp ${dockerId}:/tmp/${fileName}.tar.gz ${envConfig.projectsDir}/backups/${fileName}.tar.gz &&
          echo 'Finished'`,
          {shell: true});
      }
    } else {
      await execa(`
          echo 'Start dumping' &&
          docker exec ${dockerId} sh -c "cp ${backup.path} /tmp/${fileName} -r" &&
          docker exec ${dockerId} sh -c "cd /tmp && tar -czvf ${fileName}.tar.gz ${fileName}" &&
          echo "Completed files dump at /tmp/${fileName}.tar.gz" &&
          mkdir -p ${envConfig.projectsDir}/backups &&
          docker cp ${dockerId}:/tmp/${fileName}.tar.gz ${envConfig.projectsDir}/backups/${fileName}.tar.gz &&
          echo 'Finished'`,
        {shell: true});
    }

    return `${envConfig.projectsDir}/backups/${fileName}.tar.gz`;
  }

  async backup(backup: Backup, additionalInfos?: {callbackUrl?: string}) {
    console.debug(`Backup for ${backup.id} started at ${new Date().toISOString()}`);
    const startTime = new Date().getTime();
    const container = await this.containerService.get(getStringIds(backup.container));

    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      return;
    }

    // Handle SERVICE type backups
    if (backup?.type === BackupType.SERVICE) {
      await this.backupService(backup, additionalInfos);
      return;
    }

    // Handle DATABASE type backups or legacy backups (no type) for database containers
    if (backup?.type === BackupType.DATABASE || (backup?.type == null && container.kind === ContainerKind.DATABASE)) {
      // Continue with existing database backup logic below
    } else if (backup?.type === BackupType.VOLUME || (backup?.type == null && container.kind !== ContainerKind.DATABASE)) {
      // Handle volume backups (including legacy backups for non-database containers)
      await this.backupVolume(backup);
      return;
    }

    const project = await this.projectService.getProjectByContainer(container);
    const dockerId = await this.dockerService.getId(getStringIds(container.id));
    const fileName = `${getStringIds(container.id)}-${new Date().toISOString().replace(/[:|.]/g, "-")}`;
    const folderName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}`;

    if (!dockerId) {
      console.debug(`Backup for ${container.name} failed because no docker id was found`)
      return;
    }

    let commands = [];
    if (container.type === DatabaseType.MONGO) {
      commands = [
        'apt-get update && apt-get install -y --no-install-recommends apt-utils awscli',
        `aws configure set aws_access_key_id ${backup.key}`,
        `aws configure set aws_secret_access_key ${backup.secret}`,
        `aws configure set default.region ${backup.region}`,
        `aws configure set verify_ssl false`,
        `echo 'Start dumping'`,
        `mongodump --uri="mongodb://localhost:27017" --out="/tmp/${fileName}"`,
        `echo 'Start zipping'`,
        `tar -zcvf /tmp/${fileName}.tar.gz /tmp/${fileName}`,
        `echo 'Start uploading to S3...'`,
        `aws s3 cp /tmp/${fileName}.tar.gz s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'S3 upload successful' || (echo 'S3 upload failed' && exit 1)`,
        `echo 'Verifying S3 upload...'`,
        `aws s3 ls s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'File verified in S3' || (echo 'File not found in S3 after upload' && exit 1)`,
        `echo 'Finished uploading'`,
        `rm -rf /tmp/${fileName} && rm -rf /tmp/${fileName}.tar.gz`,
        `echo 'Finished'`,
      ];
    } else if (container.type === DatabaseType.MARIA_DB) {
      commands = [
        'apt-get update && apt-get install -y --no-install-recommends apt-utils awscli',
        `aws configure set aws_access_key_id ${backup.key}`,
        `aws configure set aws_secret_access_key ${backup.secret}`,
        `aws configure set default.region ${backup.region}`,
        `aws configure set verify_ssl false`,
        `export $(grep -v '^#' ${envConfig.projectsDir}/${container.id}/.env | xargs)`,
        `echo 'Start dumping'`,
        `mariadb-dump --no-tablespaces -r /tmp/${fileName}.sql --add-drop-table --add-drop-database -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE`,
        `ls -al /tmp`,
        `cd /tmp && tar -zcvf ${fileName}.tar.gz ${fileName}.sql`,
        `ls -al /tmp`,
        `echo 'Start uploading to S3...'`,
        `aws s3 cp /tmp/${fileName}.tar.gz s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'S3 upload successful' || (echo 'S3 upload failed' && exit 1)`,
        `echo 'Verifying S3 upload...'`,
        `aws s3 ls s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'File verified in S3' || (echo 'File not found in S3 after upload' && exit 1)`,
        `rm -rf /tmp/${fileName} && rm -rf /tmp/${fileName}.tar.gz`,
        `echo 'Finished'`,
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {spawn} = require('child_process');
    const spawnProcess = spawn('docker', ['exec', dockerId, 'sh', '-c', commands.join(' && ')]);
    spawnProcess.stdout.on('data', async (data) => {
      if (data.toString()) {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
          this.pushLog(getStringIds(backup.id), line, { lastBackup: new Date() });
        });
      }
    });

    spawnProcess.on('error', async (code) => {
      console.debug(`Backup for ${container.name} failed with code ${code}`);
      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.FAILED,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }
    });

    spawnProcess.on('close', async (code) => {
      console.debug(`Backup for ${container.name} finished with code ${code}`);
      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        const backups = await this.listBackups(container.id, {force: true});
        const lastBackup = backups.find((b) => b.key.includes(fileName))

        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.SUCCEEDED,
            duration: endTime - startTime,
            size: lastBackup?.size || undefined,
            name: lastBackup?.label || undefined,
            key: lastBackup?.key || undefined
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }
    });

    return;
  }

  async backupService(backup: Backup, additionalInfos?: {callbackUrl?: string}) {
    console.debug(`Service backup for ${backup.id} started at ${new Date().toISOString()}`);
    const startTime = new Date().getTime();
    const container = await this.containerService.get(getStringIds(backup.container));

    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      return;
    }

    const project = await this.projectService.getProjectByContainer(container);
    const serviceName = container.type as keyof typeof SupportedBackupServices;
    const serviceConfig = SERVICE_BACKUP_CONFIGS[serviceName];

    if (!serviceConfig) {
      console.error(`No backup configuration found for service type: ${container.type}`);
      return;
    }

    const fileName = `${getStringIds(container.id)}-${new Date().toISOString().replace(/[:|.]/g, "-")}`;
    const folderName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}`;

    // Get all Docker service containers for this deployment
    const serviceContainers: any[] = await this.dockerService.getServiceContainers(getStringIds(container.id));
    const backupPromises = [];

    for (const target of serviceConfig.backupTargets) {
      // Find container by checking if the name contains the target container name
      const targetContainer = serviceContainers.find(sc =>
        sc.Names.includes(`_${target.containerName}`)
      );

      if (!targetContainer) {
        console.error(`Container ${target.containerName} not found for service ${serviceName}. Available containers: ${serviceContainers.map(c => c.Names).join(', ')}`);
        continue;
      }

      const dockerId = targetContainer.ID;
      const targetFileName = `${target.containerName}-${fileName}`;

      if (target.type === 'DATABASE') {
        backupPromises.push(this.backupServiceDatabase(backup, dockerId, targetFileName, target.dbType, folderName));
      } else if (target.type === 'VOLUME' && target.path) {
        backupPromises.push(this.backupServiceVolume(backup, dockerId, targetFileName, target.path, folderName));
      }
    }

    try {
      await Promise.all(backupPromises);

      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.SUCCEEDED,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }
    } catch (error) {
      console.error(`Service backup failed: ${error}`);

      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.FAILED,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }
    }
  }

  async backupServiceDatabase(backup: Backup, dockerId: string, fileName: string, dbType: string, folderName: string) {
    let commands = [];

    switch (dbType) {
      case 'postgresql':
        commands = [
          `echo "Starting PostgreSQL backup as root user"`,
          `whoami`,
          `echo "Checking environment variables..."`,
          `echo "POSTGRES_USER: $POSTGRES_USER"`,
          `echo "POSTGRES_DB: $POSTGRES_DB"`,
          `echo "POSTGRES_PASSWORD length: \${#POSTGRES_PASSWORD}"`,
          `echo "Checking available package managers..."`,
          `which apt-get && echo "apt-get available" || echo "apt-get not available"`,
          `which apk && echo "apk available" || echo "apk not available"`,
          `which pg_dump && echo "pg_dump already available" || echo "pg_dump not available"`,
          `which aws && echo "aws-cli already available" || echo "aws-cli not available"`,
          'if which apt-get > /dev/null; then echo "Installing via apt-get" && apt-get update && apt-get install -y --no-install-recommends apt-utils awscli postgresql-client; elif which apk > /dev/null; then echo "Installing via apk" && apk add --no-cache aws-cli postgresql-client; else echo "No package manager found, checking if tools are pre-installed"; fi',
          `which pg_dump && echo "pg_dump is now available" || (echo "ERROR: postgresql-client installation failed" && exit 1)`,
          `which aws && echo "aws-cli is now available" || (echo "ERROR: aws-cli installation failed" && exit 1)`,
          `echo "Configuring AWS..."`,
          `aws configure set aws_access_key_id ${backup.key}`,
          `aws configure set aws_secret_access_key ${backup.secret}`,
          `aws configure set default.region ${backup.region}`,
          `aws configure set verify_ssl false`,
          `echo 'Testing PostgreSQL connection...'`,
          `PGPASSWORD=$POSTGRES_PASSWORD pg_isready -h localhost -U $POSTGRES_USER -d $POSTGRES_DB && echo "PostgreSQL connection OK" || echo "WARNING: PostgreSQL connection test failed"`,
          `echo 'Starting PostgreSQL dump...'`,
          `PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h localhost -U $POSTGRES_USER -d $POSTGRES_DB > /tmp/${fileName}.sql`,
          `ls -la /tmp/${fileName}.sql && echo "PostgreSQL dump created successfully" || echo "ERROR: PostgreSQL dump failed"`,
          `echo 'Start zipping'`,
          `tar -zcvf /tmp/${fileName}.tar.gz /tmp/${fileName}.sql`,
          `ls -la /tmp/${fileName}.tar.gz && echo "Archive created successfully" || echo "ERROR: Archive creation failed"`,
          `echo 'Testing AWS configuration...'`,
          `aws configure list`,
          `echo 'Testing S3 access...'`,
          `aws s3 ls s3://${backup.bucket}/ --region ${backup.region} --endpoint-url ${backup.host} | head -5`,
          `echo 'Start uploading to S3...'`,
          `aws s3 cp /tmp/${fileName}.tar.gz s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'S3 upload successful' || (echo 'S3 upload failed' && exit 1)`,
          `echo 'Verifying S3 upload...'`,
          `aws s3 ls s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'File verified in S3' || (echo 'File not found in S3 after upload' && exit 1)`,
          `echo 'Finished uploading'`,
          `rm -rf /tmp/${fileName}.sql && rm -rf /tmp/${fileName}.tar.gz`,
          `echo 'Finished PostgreSQL backup'`,
        ];
        break;
      case 'mongodb':
        commands = [
          'apt-get update && apt-get install -y --no-install-recommends apt-utils awscli',
          `aws configure set aws_access_key_id ${backup.key}`,
          `aws configure set aws_secret_access_key ${backup.secret}`,
          `aws configure set default.region ${backup.region}`,
          `aws configure set verify_ssl false`,
          `echo 'Start dumping'`,
          `mongodump --uri="mongodb://localhost:27017" --out="/tmp/${fileName}"`,
          `echo 'Start zipping'`,
          `tar -zcvf /tmp/${fileName}.tar.gz /tmp/${fileName}`,
          `echo 'Start uploading to S3...'`,
          `aws s3 cp /tmp/${fileName}.tar.gz s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'S3 upload successful' || (echo 'S3 upload failed' && exit 1)`,
          `echo 'Verifying S3 upload...'`,
          `aws s3 ls s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'File verified in S3' || (echo 'File not found in S3 after upload' && exit 1)`,
          `echo 'Finished uploading'`,
          `rm -rf /tmp/${fileName} && rm -rf /tmp/${fileName}.tar.gz`,
          `echo 'Finished'`,
        ];
        break;
      default:
        console.error(`Unsupported database type: ${dbType}`);
        return;
    }

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {spawn} = require('child_process');
      // Use semicolons to continue even if individual commands fail - for debugging
      const spawnProcess = spawn('docker', ['exec', '-u', 'root', dockerId, 'sh', '-c', commands.join(' ; ')]);

      spawnProcess.stdout.on('data', async (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushLog(getStringIds(backup.id), `[${fileName}] ${line}`, { lastBackup: new Date() });
          });
        }
      });

      spawnProcess.stderr.on('data', async (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushLog(getStringIds(backup.id), `[${fileName}] ERROR: ${line}`);
          });
        }
      });

      spawnProcess.on('error', (code) => {
        console.error(`Database backup failed for ${fileName} with code ${code}`);
        reject(code);
      });

      spawnProcess.on('close', (code) => {
        console.debug(`Database backup finished for ${fileName} with code ${code}`);
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  async backupServiceVolume(backup: Backup, dockerId: string, fileName: string, path: string, folderName: string) {
    const commands = [
      `echo "Starting volume backup for ${path} as root user"`,
      `whoami`,
      'which apt-get > /dev/null && apt-get update && apt-get install -y --no-install-recommends apt-utils awscli || (which apk > /dev/null && apk add --no-cache aws-cli) || echo "Package manager not found, assuming aws-cli is pre-installed"',
      `aws configure set aws_access_key_id ${backup.key}`,
      `aws configure set aws_secret_access_key ${backup.secret}`,
      `aws configure set default.region ${backup.region}`,
      `aws configure set verify_ssl false`,
      `echo "Creating files dump for ${path}"`,
      `cp ${path} /tmp/${fileName} -r`,
      `cd /tmp`,
      `tar -czvf ${fileName}.tar.gz ${fileName} 1>/dev/null 2>&1`,
      `echo "Completed files dump at /tmp/${fileName}.tar.gz"`,
      `echo 'Start uploading to S3...'`,
      `aws s3 cp /tmp/${fileName}.tar.gz s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'S3 upload successful' || (echo 'S3 upload failed' && exit 1)`,
      `echo 'Verifying S3 upload...'`,
      `aws s3 ls s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'File verified in S3' || (echo 'File not found in S3 after upload' && exit 1)`,
      `rm -rf /tmp/${fileName} && rm -rf /tmp/${fileName}.tar.gz`,
      `echo 'Finished volume backup for ${path}'`,
    ];

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {spawn} = require('child_process');
      // Use semicolons to continue even if individual commands fail - for debugging
      const spawnProcess = spawn('docker', ['exec', '-u', 'root', dockerId, 'sh', '-c', commands.join(' ; ')]);

      spawnProcess.stdout.on('data', async (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushLog(getStringIds(backup.id), `[${fileName}] ${line}`, { lastBackup: new Date() });
          });
        }
      });

      spawnProcess.stderr.on('data', async (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushLog(getStringIds(backup.id), `[${fileName}] ERROR: ${line}`);
          });
        }
      });

      spawnProcess.on('error', (code) => {
        console.error(`Volume backup failed for ${fileName} with code ${code}`);
        reject(code);
      });

      spawnProcess.on('close', (code) => {
        console.debug(`Volume backup finished for ${fileName} with code ${code}`);
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  async backupVolume(backup: Backup) {
    const container = await this.containerService.get(getStringIds(backup.container));

    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      return;
    }

    console.debug(`Backup for ${container.name} started at ${new Date().toISOString()}`);

    const project = await this.projectService.getProjectByContainer(container);
    const dockerId = await this.dockerService.getId(getStringIds(container.id));
    const fileName = `${getStringIds(container.id)}-${new Date().toISOString().replace(/[:|.]/g, "-")}`;
    const folderName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}`;

    if (!dockerId) {
      console.debug(`Backup for ${container.name} failed because no docker id was found`)
      return;
    }

    const commands = [
      `aws configure set aws_access_key_id ${backup.key}`,
      `aws configure set aws_secret_access_key ${backup.secret}`,
      `aws configure set default.region ${backup.region}`,
      `aws configure set verify_ssl false`,
      `echo "Creating files dump"`,
      `cp ${backup.path} /tmp/${fileName} -r`,
      `cd /tmp`,
      `tar -czvf ${fileName}.tar.gz ${fileName} 1>/dev/null 2>&1`,
      `echo "Completed files dump at /tmp/${fileName}.tar.gz"`,
      `echo 'Start uploading to S3...'`,
      `aws s3 cp /tmp/${fileName}.tar.gz s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'S3 upload successful' || (echo 'S3 upload failed' && exit 1)`,
      `echo 'Verifying S3 upload...'`,
      `aws s3 ls s3://${backup.bucket}/${folderName}/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host} && echo 'File verified in S3' || (echo 'File not found in S3 after upload' && exit 1)`,
    ];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {spawn} = require('child_process');
    const spawnProcess = spawn('docker', ['exec', dockerId, 'sh', '-c', commands.join(' && ')]);
    spawnProcess.stdout.on('data', async (data) => {
      if (data.toString()) {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
          this.pushLog(getStringIds(backup.id), line, { lastBackup: new Date() });
        });
      }
    });

    return;
  }

  async restore(containerId: string, key: string, additionalInfos?: {callbackUrl?: string}) {
    console.debug(`Restore for ${containerId} started at ${new Date().toISOString()}`);
    const container = await this.containerService.getForce(containerId);
    const startTime = new Date().getTime();

    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      return;
    }

    await this.containerService.updateForce(containerId, {status: ContainerStatus.RESTORING});

    const result = await this.findForce({filterQuery: {container: getStringIds(containerId)}});
    if (!result.length) {
      await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});

      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.FAILED,
            key,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }

      return;
    }

    const backup = result[0];
    
    // Handle SERVICE type restores
    if (backup?.type === BackupType.SERVICE) {
      await this.restoreService(containerId, key, backup, additionalInfos);
      return;
    }
    
    const dockerId = await this.dockerService.getId(getStringIds(container.id));
    if (!dockerId) {
      await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});

      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.FAILED,
            key,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }

      return;
    }
    await this.mainDbModel.updateOne({_id: getStringIds(backup.id)}, {
      $set: {
        restoreLog: [],
      }
    }).exec();
    const project = await this.projectService.getProjectByContainer(container);
    const folderName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}`;

    if (container.type === DatabaseType.MONGO) {
      const commands = [
        'apt-get update && apt-get install -y --no-install-recommends apt-utils awscli',
        `aws configure set aws_access_key_id ${backup.key}`,
        `aws configure set aws_secret_access_key ${backup.secret}`,
        `aws configure set default.region ${backup.region}`,
        `aws configure set verify_ssl false`,
        `aws s3 cp s3://${backup.bucket}/${key} /tmp/${key} --region ${backup.region} --endpoint-url ${backup.host} --only-show-errors`,
        `tar -xvf /tmp/${key}`,
        `mongorestore --drop --uri="mongodb://localhost:27017" /tmp/${key.replace(`${folderName}/`, '').replace('.tar.gz', '')}`,
        `rm -rf /tmp/${folderName}`,
        `rm -rf /tmp/${key}`,
        `rm -rf /tmp/${key.replace('.tar.gz', '')}`,
        `echo 'Finished'`,
      ];

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {spawn} = require('child_process');
      const spawnProcess = spawn('docker', ['exec', dockerId, 'sh', '-c', commands.join(' && ')]);
      spawnProcess.stdout.on('data', (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushRestoreLog(getStringIds(backup.id), line);
          });
        }
      });
    } else if (container.type === DatabaseType.MARIA_DB) {
      let commands = [];
      if (key.endsWith('.sql.gz')) {
        const file = `${key.replace(`${folderName}/`, '').replace('.sql.gz', '')}`;
        commands = [
          'apt-get update && apt-get install -y --no-install-recommends apt-utils awscli',
          `aws configure set aws_access_key_id ${backup.key}`,
          `aws configure set aws_secret_access_key ${backup.secret}`,
          `aws configure set default.region ${backup.region}`,
          `aws configure set verify_ssl false`,
          `export $(grep -v '^#' ${envConfig.projectsDir}/${container.id}/.env | xargs)`,
          `aws s3 cp s3://${backup.bucket}/${key} /tmp/${key} --region ${backup.region} --endpoint-url ${backup.host} --only-show-errors`,
          `zcat /tmp/${key} > /tmp/${folderName}/${file}.sql`,
          `ls -al /tmp/${folderName}`,
          `echo 'Start importing ${file}.sql'`,
          `mariadb -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < '/tmp/${folderName}/${file}.sql'`,
          `echo 'Imported ${file}.sql'`,
          `rm -rf /tmp/${folderName}`,
          `rm -rf /tmp/${key}`,
          `rm -rf /tmp/${key.replace('.sql.gz', '')}`,
          `echo 'Finished'`,
        ];
      } else if (key.endsWith('.sql')) {
        const file = `${key.replace(`${folderName}/`, '').replace('.sql', '')}`;
        commands = [
          'apt-get update && apt-get install -y --no-install-recommends apt-utils awscli',
          `aws configure set aws_access_key_id ${backup.key}`,
          `aws configure set aws_secret_access_key ${backup.secret}`,
          `aws configure set default.region ${backup.region}`,
          `aws configure set verify_ssl false`,
          `export $(grep -v '^#' ${envConfig.projectsDir}/${container.id}/.env | xargs)`,
          `aws s3 cp s3://${backup.bucket}/${key} /tmp/${key} --region ${backup.region} --endpoint-url ${backup.host} --only-show-errors`,
          `cp /tmp/${key} /tmp/${folderName}/${file}.sql`,
          `ls -al /tmp/${folderName}`,
          `echo 'Start importing ${file}.sql'`,
          `mariadb -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < '/tmp/${folderName}/${file}.sql'`,
          `echo 'Imported ${file}.sql'`,
          `rm -rf /tmp/${folderName}`,
          `rm -rf /tmp/${key}`,
          `rm -rf /tmp/${key.replace('.sql', '')}`,
          `echo 'Finished'`,
        ];
      } else {
        const file = `${key.replace(`${folderName}/`, '').replace('.tar.gz', '')}`;
        commands = [
          'apt-get update && apt-get install -y --no-install-recommends apt-utils awscli',
          `aws configure set aws_access_key_id ${backup.key}`,
          `aws configure set aws_secret_access_key ${backup.secret}`,
          `aws configure set default.region ${backup.region}`,
          `aws configure set verify_ssl false`,
          `export $(grep -v '^#' ${envConfig.projectsDir}/${container.id}/.env | xargs)`,
          `aws s3 cp s3://${backup.bucket}/${key} /tmp/${key} --region ${backup.region} --endpoint-url ${backup.host} --only-show-errors`,
          `tar -xvf /tmp/${key}`,
          `tar -xvf /tmp/${folderName}/${file}.tar.gz -C /tmp/${folderName}`,
          `echo 'Show dir /tmp/${folderName}'`,
          `ls -al /tmp/${folderName}`,
          `echo 'Start importing ${file}.sql'`,
          `mariadb -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < '/tmp/${folderName}/${file}.sql'`,
          `echo 'Imported ${file}.sql'`,
          `rm -rf /tmp/${folderName}`,
          `rm -rf /tmp/${key}`,
          `rm -rf /tmp/${key.replace('.tar.gz', '')}`,
          `echo 'Finished'`,
        ];
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {spawn} = require('child_process');
      const spawnProcess = spawn('docker', ['exec', dockerId, 'sh', '-c', commands.join(' && ')]);
      spawnProcess.stdout.on('data', (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushRestoreLog(getStringIds(backup.id), line);
          });
        }
      });
      spawnProcess.stderr.on('data', (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushRestoreLog(getStringIds(backup.id), line);
          });
        }
      });
    }

    await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});
    if (additionalInfos?.callbackUrl) {
      const endTime = new Date().getTime();
      try {
        await axios.post(additionalInfos.callbackUrl, {
          status: BackupStatus.SUCCEEDED,
          key,
          duration: endTime - startTime
        });
      } catch (e) {
        console.debug(`Callback for ${container.name} failed with error ${e}`);
      }
    }

    return true;
  }

  async restoreVolume(containerId: string, key: string, additionalInfos?: {callbackUrl?: string}) {
    const container = await this.containerService.getForce(containerId);
    const startTime = new Date().getTime();
    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    await this.containerService.updateForce(containerId, {status: ContainerStatus.RESTORING});
    if (additionalInfos?.callbackUrl) {
      const endTime = new Date().getTime();
      try {
        await axios.post(additionalInfos.callbackUrl, {
          status: BackupStatus.STARTED,
          key,
          duration: endTime - startTime
        });
      } catch (e) {
        console.debug(`Callback for ${container.name} failed with error ${e}`);
      }
    }

    const result = await this.findForce({filterQuery: {container: getStringIds(containerId)}});
    if (!result.length) {
      console.error(`Backup for ${containerId} not found`);
      await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});

      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.FAILED,
            key,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }

      throw new Error('No backup found');
    }

    const backup = result[0];
    const dockerId = await this.dockerService.getId(getStringIds(container.id));
    if (!dockerId) {
      console.error(`Docker id for container ${containerId} not found`);
      await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});

      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.FAILED,
            key,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }
      return;
    }

    await this.mainDbModel.updateOne({_id: getStringIds(backup.id)}, {
      $set: {
        restoreLog: [],
      }
    }).exec();

    const project = await this.projectService.getProjectByContainer(container);
    const folderName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}`;
    const keyWithoutExt = key.replace('.tar.gz', '');
    const file = keyWithoutExt.replace(`${folderName}/`, '');
    console.debug('restoreVolume', project, folderName, keyWithoutExt);

    const commands = [
      'echo "Start restore and configure awscli"',
      `aws configure set aws_access_key_id ${backup.key}`,
      `aws configure set aws_secret_access_key ${backup.secret}`,
      `aws configure set default.region ${backup.region}`,
      `aws configure set verify_ssl false`,
      `echo "Start download files dump at ${new Date().toISOString()}"`,
      `aws s3 cp s3://${backup.bucket}/${key} /tmp/${key} --region ${backup.region} --endpoint-url ${backup.host} --only-show-errors`,
      `echo "Finished download files dump at ${new Date().toISOString()}"`,
      `echo "Extract files dump"`,
      `tar -xvf /tmp/${folderName}/${file}.tar.gz -C /tmp/${folderName} 1>/dev/null 2>&1`,
      `ls -al /tmp/${folderName}`,
      `echo "Copy files to volume"`,
      `cp -a /tmp/${folderName}/${file}/. ${backup.path}`,
      `echo "Remove files"`,
      `rm -rf ./tmp/${key}`,
      `rm -rf ./tmp/${folderName}`,
      `echo 'Finished'`,
    ];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {spawn} = require('child_process');
    const spawnProcess = spawn('docker', ['exec', dockerId, 'sh', '-c', commands.join(' && ')]);
    spawnProcess.stdout.on('data', (data) => {
      if (data.toString()) {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
          this.pushRestoreLog(getStringIds(backup.id), line);
        });
      }
    });

    spawnProcess.stderr.on('data', (data) => {
      console.debug('restoreVolume::spawnProcess::stderr', data.toString());
      if (data.toString()) {
        const lines = data.toString().split('\n');
        lines.forEach((line) => {
          this.pushRestoreLog(getStringIds(backup.id), line);
        });
      }
    });

    await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});

    if (additionalInfos?.callbackUrl) {
      const endTime = new Date().getTime();
      try {
        await axios.post(additionalInfos.callbackUrl, {
          status: BackupStatus.SUCCEEDED,
          key,
          duration: endTime - startTime
        });
      } catch (e) {
        console.debug(`Callback for ${container.name} failed with error ${e}`);
      }
    }

    return true;
  }

  async restoreService(containerId: string, key: string, backup: Backup, additionalInfos?: {callbackUrl?: string}) {
    console.debug(`Service restore for ${containerId} started at ${new Date().toISOString()}`);
    const startTime = new Date().getTime();
    const container = await this.containerService.getForce(containerId);
    
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    const project = await this.projectService.getProjectByContainer(container);
    const serviceName = container.type;

    // Get service configuration
    const serviceConfig = serviceName in SERVICE_BACKUP_CONFIGS 
      ? SERVICE_BACKUP_CONFIGS[serviceName as unknown as SupportedBackupServices]
      : null;
    if (!serviceConfig) {
      console.error(`No restore configuration found for service type: ${container.type}`);
      await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});
      return;
    }

    // Clear restore logs
    await this.mainDbModel.updateOne({_id: getStringIds(backup.id)}, {
      $set: {
        restoreLog: [],
      }
    }).exec();

    const folderName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}`;

    // Get all Docker service containers for this deployment
    const serviceContainers: any[] = await this.dockerService.getServiceContainers(getStringIds(container.id));
    console.debug(`Found ${serviceContainers.length} containers for service ${serviceName}`);

    const restorePromises = [];

    for (const target of serviceConfig.backupTargets) {
      // Find container by checking if the name contains the target container name
      const targetContainer = serviceContainers.find(sc =>
        sc.Names.includes(`_${target.containerName}`)
      );

      if (!targetContainer) {
        console.error(`Container ${target.containerName} not found for service ${serviceName}. Available containers: ${serviceContainers.map(c => c.Names).join(', ')}`);
        continue;
      }

      const dockerId = targetContainer.ID;
      const targetFileName = `${target.containerName}-${getStringIds(container.id)}-${new Date().toISOString().replace(/[:|.]/g, "-")}`;

      if (target.type === 'DATABASE') {
        restorePromises.push(this.restoreServiceDatabase(backup, dockerId, targetFileName, target.dbType, folderName, key));
      } else if (target.type === 'VOLUME' && target.path) {
        restorePromises.push(this.restoreServiceVolume(backup, dockerId, targetFileName, target.path, folderName, key));
      }
    }

    try {
      await Promise.all(restorePromises);

      await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});

      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.SUCCEEDED,
            key,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }
    } catch (error) {
      console.error(`Service restore failed: ${error}`);
      await this.containerService.updateForce(containerId, {status: ContainerStatus.DEPLOYED});

      if (additionalInfos?.callbackUrl) {
        const endTime = new Date().getTime();
        try {
          await axios.post(additionalInfos.callbackUrl, {
            status: BackupStatus.FAILED,
            key,
            duration: endTime - startTime
          });
        } catch (e) {
          console.debug(`Callback for ${container.name} failed with error ${e}`);
        }
      }
    }
  }

  async restoreServiceDatabase(backup: Backup, dockerId: string, fileName: string, dbType: string, folderName: string, s3Key: string) {
    let commands = [];

    switch (dbType) {
      case 'postgresql':
        commands = [
          `echo "Starting PostgreSQL restore as root user"`,
          `whoami`,
          'if which apt-get > /dev/null; then echo "Installing via apt-get" && apt-get update && apt-get install -y --no-install-recommends apt-utils awscli postgresql-client; elif which apk > /dev/null; then echo "Installing via apk" && apk add --no-cache aws-cli postgresql-client; else echo "No package manager found, checking if tools are pre-installed"; fi',
          `aws configure set aws_access_key_id ${backup.key}`,
          `aws configure set aws_secret_access_key ${backup.secret}`,
          `aws configure set default.region ${backup.region}`,
          `aws configure set verify_ssl false`,
          `echo 'Downloading backup from S3...'`,
          `aws s3 cp s3://${backup.bucket}/${s3Key} /tmp/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host}`,
          `echo 'Extracting backup...'`,
          `cd /tmp && tar -xzf ${fileName}.tar.gz`,
          `echo 'Stopping PostgreSQL temporarily for restore'`,
          `pg_ctl stop -D /var/lib/postgresql/data || echo "PostgreSQL already stopped"`,
          `echo 'Starting PostgreSQL restore...'`,
          `pg_ctl start -D /var/lib/postgresql/data`,
          `sleep 5`,
          `echo 'Dropping existing database...'`,
          `PGPASSWORD=$POSTGRES_PASSWORD dropdb -h localhost -U $POSTGRES_USER $POSTGRES_DB --if-exists`,
          `echo 'Creating new database...'`,
          `PGPASSWORD=$POSTGRES_PASSWORD createdb -h localhost -U $POSTGRES_USER $POSTGRES_DB`,
          `echo 'Restoring database from backup...'`,
          `PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB < /tmp/${fileName}.sql`,
          `rm -rf /tmp/${fileName}.tar.gz /tmp/${fileName}.sql`,
          `echo 'Finished PostgreSQL restore'`,
        ];
        break;
      case 'mongodb':
        commands = [
          'apt-get update && apt-get install -y --no-install-recommends apt-utils awscli',
          `aws configure set aws_access_key_id ${backup.key}`,
          `aws configure set aws_secret_access_key ${backup.secret}`,
          `aws configure set default.region ${backup.region}`,
          `aws configure set verify_ssl false`,
          `aws s3 cp s3://${backup.bucket}/${s3Key} /tmp/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host}`,
          `tar -xvf /tmp/${fileName}.tar.gz`,
          `mongorestore --drop --uri="mongodb://localhost:27017" /tmp/${fileName}`,
          `rm -rf /tmp/${fileName} /tmp/${fileName}.tar.gz`,
          `echo 'Finished MongoDB restore'`,
        ];
        break;
      default:
        console.error(`Unsupported database type for restore: ${dbType}`);
        return;
    }

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {spawn} = require('child_process');
      const spawnProcess = spawn('docker', ['exec', '-u', 'root', dockerId, 'sh', '-c', commands.join(' ; ')]);

      spawnProcess.stdout.on('data', async (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushRestoreLog(getStringIds(backup.id), `[${fileName}] ${line}`);
          });
        }
      });

      spawnProcess.stderr.on('data', async (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushRestoreLog(getStringIds(backup.id), `[${fileName}] ERROR: ${line}`);
          });
        }
      });

      spawnProcess.on('error', (code) => {
        console.error(`Database restore failed for ${fileName} with code ${code}`);
        reject(code);
      });

      spawnProcess.on('close', (code) => {
        console.debug(`Database restore finished for ${fileName} with code ${code}`);
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  async restoreServiceVolume(backup: Backup, dockerId: string, fileName: string, path: string, folderName: string, s3Key: string) {
    const commands = [
      `echo "Starting volume restore for ${path} as root user"`,
      `whoami`,
      'which apt-get > /dev/null && apt-get update && apt-get install -y --no-install-recommends apt-utils awscli || (which apk > /dev/null && apk add --no-cache aws-cli) || echo "Package manager not found, assuming aws-cli is pre-installed"',
      `aws configure set aws_access_key_id ${backup.key}`,
      `aws configure set aws_secret_access_key ${backup.secret}`,
      `aws configure set default.region ${backup.region}`,
      `aws configure set verify_ssl false`,
      `echo 'Downloading backup from S3...'`,
      `aws s3 cp s3://${backup.bucket}/${s3Key} /tmp/${fileName}.tar.gz --region ${backup.region} --endpoint-url ${backup.host}`,
      `echo 'Extracting backup...'`,
      `cd /tmp && tar -xzf ${fileName}.tar.gz`,
      `echo 'Backing up existing data...'`,
      `mv ${path} ${path}.backup.$(date +%s) || echo "No existing data to backup"`,
      `echo 'Restoring files to ${path}...'`,
      `cp -r /tmp/${fileName} ${path}`,
      `rm -rf /tmp/${fileName}.tar.gz /tmp/${fileName}`,
      `echo 'Finished volume restore for ${path}'`,
    ];

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {spawn} = require('child_process');
      const spawnProcess = spawn('docker', ['exec', '-u', 'root', dockerId, 'sh', '-c', commands.join(' ; ')]);

      spawnProcess.stdout.on('data', async (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushRestoreLog(getStringIds(backup.id), `[${fileName}] ${line}`);
          });
        }
      });

      spawnProcess.stderr.on('data', async (data) => {
        if (data.toString()) {
          const lines = data.toString().split('\n');
          lines.forEach((line) => {
            this.pushRestoreLog(getStringIds(backup.id), `[${fileName}] ERROR: ${line}`);
          });
        }
      });

      spawnProcess.on('error', (code) => {
        console.error(`Volume restore failed for ${fileName} with code ${code}`);
        reject(code);
      });

      spawnProcess.on('close', (code) => {
        console.debug(`Volume restore finished for ${fileName} with code ${code}`);
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  async processUpload(id: string) {
    const container = await this.containerService.get(getStringIds(id));

    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      return;
    }

    console.debug(`process import of backup for ${container.name} started at ${new Date().toISOString()}`);
    const dockerId = await this.dockerService.getId(getStringIds(container.id));
    const result = await this.findForce({filterQuery: {container: getStringIds(id)}});
    if (!result.length) {
      return;
    }

    const backup = result[0];

    if (container.kind === ContainerKind.DATABASE) {
      if (container.type === DatabaseType.MONGO) {
        await execa(`docker cp ${envConfig.projectsDir}/backups/backup.tar.gz ${dockerId}:/tmp/backup.tar.gz`, {shell: true});
        await execa(`docker exec ${dockerId} sh -c "mkdir -p /tmp/backup && tar -xvf /tmp/backup.tar.gz -C /tmp/backup --strip-components=1"`, {shell: true});
        await execa(`docker exec ${dockerId} sh -c "mongorestore --drop --uri=\"mongodb://localhost:27017\" /tmp/backup"`, {shell: true});
        await execa(`docker exec ${dockerId} sh -c "rm -rf /tmp/backup"`, {shell: true});
        await execa(`docker exec ${dockerId} sh -c "rm -rf /tmp/backup.tar.gz"`, {shell: true});
        await execa(`rm -rf ${envConfig.projectsDir}/backups/backup.tar.gz`, {shell: true});
      } else if (container.type === DatabaseType.MARIA_DB) {
        await execa(`
          export $(grep -v '^#' ${envConfig.projectsDir}/${container.id}/.env | xargs) &&
          docker cp ${envConfig.projectsDir}/backups/backup.tar.gz ${dockerId}:/tmp/backup.tar.gz &&
          docker exec ${dockerId} sh -c "tar -xvf /tmp/backup.tar.gz" &&
          echo 'Start import' &&
          docker exec ${dockerId} sh -c "mariadb -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < '/tmp/backup.sql'" &&
          docker exec ${dockerId} sh -c "rm -rf /tmp/backup.tar.gz" &&
          echo 'Finished import' &&
          rm -rf ${envConfig.projectsDir}/backups/backup.tar.gz`,
          {shell: true});
      }
    } else {
      if (!backup) {
        throw new Error('No backup found');
      }

      await execa(`
          docker cp ${envConfig.projectsDir}/backups/backup.tar.gz ${dockerId}:/tmp/backup.tar.gz &&
          docker exec ${dockerId} sh -c "ls -al /tmp"
          docker exec ${dockerId} sh -c "tar -xvf /tmp/backup.tar.gz" &&
          echo 'Start import' &&
          docker exec ${dockerId} sh -c "ls -al /tmp" &&
          docker exec ${dockerId} sh -c "cp -a /tmp/backup/. ${backup.path}" &&
          rm -rf ${envConfig.projectsDir}/backups/backup.tar.gz &&
          rm -rf ${envConfig.projectsDir}/backups/backup &&
          echo 'Finished'`,

        {shell: true});
    }
  }

  async listBackups(containerId: string, serviceOptions?: ServiceOptions): Promise<{ label: string, key: string; size?: number }[]> {
    let files: { label: string, key: string }[] = [];
    const result = await this.find({filterQuery: {container: getStringIds(containerId)}}, serviceOptions);

    if (!result.length) {
      return;
    }

    const backup = result[0];
    const container = await this.containerService.get(getStringIds(backup.container));
    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      return;
    }

    const project = await this.projectService.getProjectByContainer(container);
    const dockerId = await this.dockerService.getId(getStringIds(container.id));
    if (!dockerId) {
      return;
    }

    const s3Client = new S3Client({
      endpoint: backup.host,
      region: backup.region,
      credentials: {
        accessKeyId: backup.key,
        secretAccessKey: backup.secret,
      },
      forcePathStyle: true,
      requestHandler: new Agent({ rejectUnauthorized: false }),
    } as any);

    // Read the object.
    // Create an async iterator over lists of objects in a bucket.
    const folderName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}/`;
    const paginator = paginateListObjectsV2(
      {client: s3Client},
      {
        Bucket: backup.bucket,
        Delimiter: "/",
        Prefix: folderName,
        StartAfter: folderName,
      }
    );

    for await (const page of paginator) {
      const objects = page.Contents;

      if (!objects?.length) {
        continue;
      }

      files = [...files, ...objects.map((object) => {
        return {
          label: object.Key.replace(folderName, '').replace(`${containerId}-`, `${container.name} - `).replace('.tar.gz', ''),
          key: object.Key,
          size: object.Size, // in bytes
        }
      })];
    }

    files = files.sort((a, b) => {
      const aString = a.label.replace(`${container.name} - `, '');
      const aDate = new Date(aString);
      const bString = b.label.replace(`${container.name} - `, '');
      const bDate = new Date(bString);
      return bDate.getTime() - aDate.getTime();
    })

    return files;
  }

  async deleteBackupInS3(containerId: string, key: string, serviceOptions?: ServiceOptions) {
    const result = await this.find({filterQuery: {container: getStringIds(containerId)}}, serviceOptions);

    if (!result.length) {
      return;
    }

    const backup = result[0];
    const container = await this.containerService.get(getStringIds(containerId));
    if (!container || container.status !== ContainerStatus.DEPLOYED) {
      return;
    }

    const project = await this.projectService.getProjectByContainer(container);
    const dockerId = await this.dockerService.getId(getStringIds(container.id));
    if (!dockerId) {
      return;
    }

    const folderName = `${project.name.toLowerCase().replace(/\s/g, "_")}-${container.type}`;
    const s3Client = new S3Client({
      endpoint: backup.host,
      region: backup.region,
      credentials: {
        accessKeyId: backup.key,
        secretAccessKey: backup.secret,
      },
      forcePathStyle: true,
      requestHandler: new Agent({ rejectUnauthorized: false }),
    } as any);

    console.debug(`Deleting backup ${key} in S3`);

    s3Client.send(new DeleteObjectCommand({
      Bucket: backup.bucket,
      Key: `${folderName}/${key}`,
    }), (err, data) => {
      console.debug('Deleted', err, data);
    });
  }
}
