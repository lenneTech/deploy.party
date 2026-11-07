import { randomBytes } from 'crypto';
import { Db } from 'mongodb';
import { getDb } from '../migrations-utils/db';

/**
 * DEV-4068: every source gets its own webhook secret (see webhook-token.helper). Sources created
 * before get one here; new sources get it on create. Nothing is checked until the instance sets
 * NSC__WEBHOOK_TOKEN_MODE, so the secrets can be put into the existing GitLab hooks first.
 */
export const up = async () => {
  const db: Db = await getDb();
  const sources = await db
    .collection('sources')
    .find({ $or: [{ webhookSecret: { $exists: false } }, { webhookSecret: null }, { webhookSecret: '' }] }, { projection: { _id: 1 } })
    .toArray();

  for (const source of sources) {
    await db.collection('sources').updateOne({ _id: source._id }, { $set: { webhookSecret: randomBytes(32).toString('hex') } });
  }

  console.log(`✅ Migration completed: webhook secret added to ${sources.length} sources`);
};

export const down = async () => {
  const db: Db = await getDb();
  const result = await db.collection('sources').updateMany({}, { $unset: { webhookSecret: '' } });
  console.log(`✅ Migration reverted: webhook secret removed from ${result.modifiedCount} sources`);
};
