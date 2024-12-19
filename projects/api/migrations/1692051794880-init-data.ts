import {getDb} from '../migrations-utils/db';
import {Db, ObjectId} from 'mongodb';
import {sha256} from 'js-sha256';
import bcrypt = require('bcrypt');

export const up = async () => {
  const db: Db = await getDb();

  const registries = [
    {
      name: 'localhost',
      url: 'localhost:5000',
    }
  ]

  const registriesInsert = await db.collection('registries').insertMany(registries);
  const registryIds = [];

  for (const key in registriesInsert.insertedIds) {
    registryIds.push(registriesInsert.insertedIds[key]);
  }

  console.debug('registryIds', registryIds)

  // check if no team exists
  const teamExists = await db.collection('teams').findOne({});
  if (teamExists) {
    console.debug('Team already exists, skipping team creation');
    return;
  }

  const team = {
    name: 'main',
    projects: [],
    registries: registryIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const teamInsert = await db.collection('teams').insertOne(team);

  const user = {
    firstName: 'admin',
    lastName: 'of deploy.party',
    username: 'admin.deploy.party',
    email: 'admin@deploy.party',
    roles: ['admin'],
    password: await bcrypt.hash(sha256('deploy-party'), 10),
    team: new ObjectId(teamInsert.insertedId),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection('users').insertOne(user);
};

export const down = async () => {
  const db: Db = await getDb();
  /*
      Code you downgrade script here!
   */
};
