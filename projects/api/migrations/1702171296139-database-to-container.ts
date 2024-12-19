import {getDb} from '../migrations-utils/db';
import {Collection, Db} from 'mongodb';

export const up = async () => {
  console.debug('migration DEPRECATED!');
};

export const down = async () => {
  const db: Db = await getDb();
  /*
      Code you downgrade script here!
   */
};
