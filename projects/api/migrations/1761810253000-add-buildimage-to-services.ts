import { getDb } from '../migrations-utils/db';
import { Db } from 'mongodb';

export const up = async () => {
  const db: Db = await getDb();

  // Add buildImage field to all existing SERVICE containers without buildImage
  // Set default buildImage to 'latest' for non-CUSTOM service containers
  const result = await db.collection('containers').updateMany(
    {
      kind: 'SERVICE',
      type: { $ne: 'CUSTOM' },
      $or: [
        { buildImage: { $exists: false } },
        { buildImage: null },
        { buildImage: '' }
      ]
    },
    {
      $set: {
        buildImage: 'latest'
      }
    }
  );

  console.log(`✅ Migration completed: Added buildImage='latest' to ${result.modifiedCount} service containers`);
};

export const down = async () => {
  const db: Db = await getDb();

  // Remove buildImage field from SERVICE containers that have it set to 'latest'
  // This is optional - only revert if buildImage was set by this migration
  const result = await db.collection('containers').updateMany(
    {
      kind: 'SERVICE',
      buildImage: 'latest'
    },
    {
      $unset: {
        buildImage: ""
      }
    }
  );

  console.log(`✅ Migration rollback completed: Removed buildImage field from ${result.modifiedCount} service containers`);
};
