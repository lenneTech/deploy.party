import { getDb } from '../migrations-utils/db';
import { Db } from 'mongodb';

export const up = async () => {
  const db: Db = await getDb();
  
  // Add tagMatchType and tagPattern fields to all existing containers
  // Set default tagMatchType to 'EXACT' for existing TAG deployment containers for backward compatibility
  await db.collection('containers').updateMany(
    { deploymentType: 'TAG' },
    { 
      $set: { 
        tagMatchType: 'EXACT'
      }
    }
  );

  console.log('✅ Migration completed: Added tag pattern support fields to containers');
};

export const down = async () => {
  const db: Db = await getDb();
  
  // Remove tagMatchType and tagPattern fields from all containers
  await db.collection('containers').updateMany(
    {},
    { 
      $unset: { 
        tagMatchType: "",
        tagPattern: ""
      }
    }
  );

  console.log('✅ Migration rollback completed: Removed tag pattern support fields from containers');
};
