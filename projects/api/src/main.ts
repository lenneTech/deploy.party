import {HttpExceptionLogFilter} from '@lenne.tech/nest-server';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {exec} from 'child_process';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import envConfig from './config.env';
import {ServerModule} from './server/server.module';
import {InternalMigrationModule} from './server/internal-migration.module';
import * as bodyParser from 'body-parser';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

/**
 * Preparations for server start
 */
async function bootstrap() {
  // Create a new server based on express
  const server = await NestFactory.create<NestExpressApplication>(
    // Include server module, with all necessary modules for the project
    ServerModule,
  );

  // Log exceptions
  if (envConfig.logExceptions) {
    server.useGlobalFilters(new HttpExceptionLogFilter());
  }

  // Compression (gzip)
  if (envConfig.compression) {
    let envCompressionOptions = {};
    if (typeof envConfig.compression === 'object') {
      envCompressionOptions = envConfig.compression;
    }
    const compressionOptions = {
      filter: () => {
        return true;
      },
      threshold: 0,
      ...envCompressionOptions,
    };
    server.use(compression(compressionOptions));
  }

  // Cookie handling
  if (envConfig.cookies) {
    server.use(cookieParser());
  }

  // Asset directory
  server.useStaticAssets(envConfig.staticAssets.path, envConfig.staticAssets.options);

  // Templates directory
  server.setBaseViewsDir(envConfig.templates.path);
  server.setViewEngine(envConfig.templates.engine);

  // Enable cors to allow requests from other domains
  server.enableCors();

  // the next two lines did the trick
  server.use(bodyParser.json({limit: '900mb'}));
  server.use(bodyParser.urlencoded({limit: '900mb', extended: true}));

  const config = new DocumentBuilder()
    .setTitle('API description')
    .setDescription('The deploy.party API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(server, config);
  SwaggerModule.setup('api', server, documentFactory);

  // Start server on configured port
  await server.listen(envConfig.port);

  // Internal migration server (localhost only, port 9090)
  try {
    const internalServer = await NestFactory.create<NestExpressApplication>(
      InternalMigrationModule,
      { logger: ['error', 'warn'] },
    );
    await internalServer.listen(9090, '127.0.0.1');
    console.log('Internal migration server started on 127.0.0.1:9090');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to start internal migration server:', errorMessage);
    // Non-fatal: main server continues running
  }

  // Run command after server init
  if (envConfig.execAfterInit) {
    exec(envConfig.execAfterInit, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
    });
  }
}

// Start server
bootstrap();
