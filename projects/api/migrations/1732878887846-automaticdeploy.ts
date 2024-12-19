import {getDb} from '../migrations-utils/db';
import {Db} from 'mongodb';

export const up = async () => {
  const db: Db = await getDb();
  console.debug('Updating autoDeploy...');
  await db.collection('containers').updateMany({}, { $set: { autoDeploy: true } });
  console.debug('Updating deploymentType...');
  await db.collection('containers').updateMany({}, { $set: { deploymentType: 'BRANCH' } });
};

export const down = async () => {
  const db: Db = await getDb();
  /*
      Code you downgrade script here!
   */
};
