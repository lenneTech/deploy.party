import { CoreAuthService, CoreModule } from '@lenne.tech/nest-server';
import { Module } from '@nestjs/common';
import envConfig from '../config.env';
import { MigrationController } from './migration.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';

@Module({
  imports: [
    CoreModule.forRoot(CoreAuthService, AuthModule.forRoot(envConfig.jwt), envConfig),
    AuthModule.forRoot(envConfig.jwt),
    ProjectModule,
  ],
  controllers: [MigrationController],
})
export class InternalMigrationModule {}
