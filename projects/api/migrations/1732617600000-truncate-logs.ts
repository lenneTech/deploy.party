import { getDb } from '../migrations-utils/db';
import { Db } from 'mongodb';

const BUILD_LOG_LIMIT = 5000;
const CONTAINER_LOG_LIMIT = 1000;
const BACKUP_LOG_LIMIT = 1000;

export const up = async () => {
  const db: Db = await getDb();

  // Truncate build logs to last 5000 entries
  const builds = await db.collection('builds').find({ log: { $exists: true } }).toArray();
  let buildCount = 0;

  for (const build of builds) {
    if (build.log && Array.isArray(build.log) && build.log.length > BUILD_LOG_LIMIT) {
      await db.collection('builds').updateOne(
        { _id: build._id },
        { $set: { log: build.log.slice(-BUILD_LOG_LIMIT) } }
      );
      buildCount++;
    }
  }

  console.log(`✅ Truncated logs for ${buildCount} builds (limit: ${BUILD_LOG_LIMIT})`);

  // Truncate container logs to last 1000 entries
  const containers = await db.collection('containers').find({ logs: { $exists: true } }).toArray();
  let containerCount = 0;

  for (const container of containers) {
    if (container.logs && Array.isArray(container.logs) && container.logs.length > CONTAINER_LOG_LIMIT) {
      await db.collection('containers').updateOne(
        { _id: container._id },
        { $set: { logs: container.logs.slice(-CONTAINER_LOG_LIMIT) } }
      );
      containerCount++;
    }
  }

  console.log(`✅ Truncated logs for ${containerCount} containers (limit: ${CONTAINER_LOG_LIMIT})`);

  // Truncate backup logs to last 1000 entries
  const backups = await db.collection('backups').find({
    $or: [
      { log: { $exists: true } },
      { restoreLog: { $exists: true } }
    ]
  }).toArray();
  let backupLogCount = 0;
  let backupRestoreLogCount = 0;

  for (const backup of backups) {
    const update: Record<string, unknown> = {};

    if (backup.log && Array.isArray(backup.log) && backup.log.length > BACKUP_LOG_LIMIT) {
      update.log = backup.log.slice(-BACKUP_LOG_LIMIT);
      backupLogCount++;
    }

    if (backup.restoreLog && Array.isArray(backup.restoreLog) && backup.restoreLog.length > BACKUP_LOG_LIMIT) {
      update.restoreLog = backup.restoreLog.slice(-BACKUP_LOG_LIMIT);
      backupRestoreLogCount++;
    }

    if (Object.keys(update).length > 0) {
      await db.collection('backups').updateOne(
        { _id: backup._id },
        { $set: update }
      );
    }
  }

  console.log(`✅ Truncated log for ${backupLogCount} backups (limit: ${BACKUP_LOG_LIMIT})`);
  console.log(`✅ Truncated restoreLog for ${backupRestoreLogCount} backups (limit: ${BACKUP_LOG_LIMIT})`);
};

export const down = async () => {
  // Cannot restore truncated logs
  console.log('⚠️ Cannot restore truncated logs - this migration is irreversible');
};
