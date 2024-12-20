import {getEnvironmentConfig, IServerOptions} from '@lenne.tech/nest-server';
import {join} from 'path';
import {CronExpression} from "@nestjs/schedule";
import * as dotenv from 'dotenv';

/**
 * Configuration for the different environments
 * See: https://github.com/lenneTech/nest-server/blob/main/src/core/common/interfaces/server-options.interface.ts
 */
dotenv.config();
export const config: { [env: string]: Partial<IServerOptions> } = {
  // ===========================================================================
  // local environment
  // ===========================================================================
  local: {
    cronJobs: {
      containerLogs: {
        cronTime: CronExpression.EVERY_5_SECONDS,
        timeZone: 'Europe/Berlin',
        runOnInit: true,
      },
      buildTimeout: {
        cronTime: CronExpression.EVERY_MINUTE,
        timeZone: 'Europe/Berlin',
        runOnInit: true,
      },
      containerStateTimeout: {
        cronTime: CronExpression.EVERY_MINUTE,
        timeZone: 'Europe/Berlin',
        runOnInit: true,
      },
    },
    graphQl: {
      driver: {
        introspection: true,
      }
    },
    staticAssets: {
      path: join(__dirname, '..', 'public'),
      options: {prefix: ''},
    },
    templates: {
      path: join(__dirname, 'assets', 'templates'),
      engine: 'ejs',
    },
  },

  // ===========================================================================
  // Production environment
  // ===========================================================================
  production: {
    cronJobs: {
      containerLogs: {
        cronTime: CronExpression.EVERY_5_SECONDS,
        timeZone: 'Europe/Berlin',
        runOnInit: true,
      },
      buildTimeout: {
        cronTime: CronExpression.EVERY_MINUTE,
        timeZone: 'Europe/Berlin',
        runOnInit: true,
      },
      dockerCleanup: {
        cronTime: CronExpression.EVERY_HOUR,
        timeZone: 'Europe/Berlin',
        runOnInit: false,
      },
      containerStateTimeout: {
        cronTime: CronExpression.EVERY_MINUTE,
        timeZone: 'Europe/Berlin',
        runOnInit: true,
      },
    },
    graphQl: {
      driver: {
        introspection: true,
      }
    },
    staticAssets: {
      path: join(__dirname, '..', 'public'),
      options: {prefix: ''},
    },
    templates: {
      path: join(__dirname, 'assets', 'templates'),
      engine: 'ejs',
    },
  },
};

export default getEnvironmentConfig({ config });
