import {HttpExceptionLogFilter, RoleEnum, TestGraphQLType, TestHelper} from '@lenne.tech/nest-server';
import {Test, TestingModule} from '@nestjs/testing';
import * as fs from 'fs';
import {PubSub} from 'graphql-subscriptions';
import {VariableType} from 'json-to-graphql-query';
import {MongoClient, ObjectId} from 'mongodb';
import * as path from 'path';
import envConfig from '../src/config.env';
import {FileInfo} from '../src/server/modules/file/file-info.model';
import {User} from '../src/server/modules/user/user.model';
import {UserService} from '../src/server/modules/user/user.service';
import {ServerModule} from '../src/server/server.module';

describe('File (e2e)', () => {
  // To enable debugging, include these flags in the options of the request you want to debug
  const log = true;
  const logError = true;

  // Testenvironment properties
  let app;
  let testHelper: TestHelper;

  // database
  let connection;
  let db;

  // Global vars
  let userService: UserService;
  const users: Partial<User & { token: string }>[] = [];
  let fileInfo: FileInfo;
  let fileContent: string;

  // ===================================================================================================================
  // Preparations
  // ===================================================================================================================

  /**
   * Before all tests
   */
  beforeAll(async () => {
    // Indicates that cookies are enabled
    if (envConfig.cookies) {
      console.error('NOTE: Cookie handling is enabled. The tests with tokens will fail!');
    }
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [ServerModule],
        providers: [
          UserService,
          {
            provide: 'PUB_SUB',
            useValue: new PubSub(),
          },
        ],
      }).compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalFilters(new HttpExceptionLogFilter());
      app.setBaseViewsDir(envConfig.templates.path);
      app.setViewEngine(envConfig.templates.engine);
      await app.init();
      testHelper = new TestHelper(app);
      userService = moduleFixture.get(UserService);

      // Connection to database
      connection = await MongoClient.connect(envConfig.mongoose.uri);
      db = await connection.db();
    } catch (e) {
      console.error('beforeAllError', e);
    }
  });

  /**
   * After all tests are finished
   */
  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  // ===================================================================================================================
  // Initialization tests
  // ===================================================================================================================

  /**
   * Create and verify users for testing
   */
  it('createAndVerifyUsers', async () => {
    const userCount = 2;
    for (let i = 0; i < userCount; i++) {
      const random = Math.random().toString(36).substring(7);
      const input = {
        password: random,
        email: random + '@testusers.com',
        firstName: 'Test' + random,
        lastName: 'User' + random,
      };

      // Sign up user
      const res: any = await testHelper.graphQl({
        name: 'signUp',
        type: TestGraphQLType.MUTATION,
        arguments: { input },
        fields: [{ user: ['id', 'email', 'firstName', 'lastName'] }],
      });
      res.user.password = input.password;
      users.push(res.user);

      // Verify user
      await db.collection('users').updateOne({ _id: new ObjectId(res.id) }, { $set: { verified: true } });
    }
    expect(users.length).toBeGreaterThanOrEqual(userCount);
  });

  /**
   * Sign in users
   */
  it('signInUsers', async () => {
    for (const user of users) {
      const res: any = await testHelper.graphQl({
        name: 'signIn',
        type: TestGraphQLType.MUTATION,
        arguments: {
          input: {
            email: user.email,
            password: user.password,
          },
        },
        fields: ['token', { user: ['id', 'email'] }],
      });
      expect(res.user.id).toEqual(user.id);
      expect(res.user.email).toEqual(user.email);
      user.token = res.token;
    }
  });

  /**
   * Prepare users
   */
  it('prepareUsers', async () => {
    await db
      .collection('users')
      .findOneAndUpdate({ _id: new ObjectId(users[0].id) }, { $set: { roles: [RoleEnum.ADMIN] } });
  });

  // ===================================================================================================================
  // Tests for file handling via GraphQL
  // ===================================================================================================================

  it('uploadFileViaGraphQL', async () => {
    const filename = Math.random().toString(36).substring(7) + '.txt';
    fileContent = 'Hello GraphQL';

    // Set paths
    const local = path.join(__dirname, filename);

    // Write and send file
    await fs.promises.writeFile(local, fileContent);
    const res: any = await testHelper.graphQl(
      {
        name: 'uploadFile',
        type: TestGraphQLType.MUTATION,
        variables: { file: 'Upload!' },
        arguments: { file: new VariableType('file') },
        fields: ['id', 'filename'],
      },
      { variables: { file: { type: 'attachment', value: local } }, token: users[0].token }
    );
    expect(res.id.length).toBeGreaterThan(0);
    expect(res.filename).toEqual(filename);
    fileInfo = res;

    // Remove files
    await fs.promises.unlink(local);
  });

  it('getFileInfoForGraphQLFile', async () => {
    const res: any = await testHelper.graphQl(
      {
        name: 'getFileInfo',
        type: TestGraphQLType.QUERY,
        arguments: { filename: fileInfo.filename },
        fields: ['id', 'filename'],
      },
      { token: users[0].token }
    );
    expect(res.id).toEqual(fileInfo.id);
    expect(res.filename).toEqual(fileInfo.filename);
  });

  it('downloadGraphQLFile', async () => {
    const res = await testHelper.download('/files/' + fileInfo.id, users[0].token);
    expect(res.statusCode).toEqual(200);
    expect(res.data).toEqual(fileContent);
  });

  it('deleteGraphQLFile', async () => {
    const res: any = await testHelper.graphQl(
      {
        name: 'deleteFile',
        type: TestGraphQLType.MUTATION,
        arguments: { filename: fileInfo.filename },
        fields: ['id'],
      },
      { token: users[0].token }
    );
    expect(res.id).toEqual(fileInfo.id);
  });

  it('getGraphQLFileInfo', async () => {
    const res: any = await testHelper.graphQl(
      {
        name: 'getFileInfo',
        type: TestGraphQLType.QUERY,
        arguments: { filename: fileInfo.filename },
        fields: ['id', 'filename'],
      },
      { token: users[0].token }
    );
    expect(res).toEqual(null);
  });

  it('uploadFilesViaGraphQL', async () => {
    // Set paths
    const local1 = path.join(__dirname, 'test1.txt');
    const local2 = path.join(__dirname, 'test2.txt');
    const remote1 = path.join(__dirname, '..', 'uploads', 'test1.txt');
    const remote2 = path.join(__dirname, '..', 'uploads', 'test2.txt');

    // Write and send file
    await fs.promises.writeFile(local1, 'Hello GraphQL 1');
    await fs.promises.writeFile(local2, 'Hello GraphQL 2');
    const res: any = await testHelper.graphQl(
      {
        name: 'uploadFiles',
        type: TestGraphQLType.MUTATION,
        variables: { files: '[Upload!]!' },
        arguments: { files: new VariableType('files') },
      },
      { variables: { files: { type: 'attachment', value: [local1, local2] } }, token: users[0].token }
    );
    expect(res).toEqual(true);

    // Check uploaded files
    const stat1 = await fs.promises.stat(remote1);
    expect(!!stat1).toEqual(true);
    const stat2 = await fs.promises.stat(remote2);
    expect(!!stat2).toEqual(true);

    // Remove files
    await fs.promises.unlink(local1);
    await fs.promises.unlink(local2);
    await fs.promises.unlink(remote1);
    await fs.promises.unlink(remote2);
  });

  // ===================================================================================================================
  // Tests for file handling via REST
  // ===================================================================================================================

  it('uploadFileViaREST', async () => {
    const filename = Math.random().toString(36).substring(7) + '.txt';
    fileContent = 'Hello REST';

    // Set paths
    const local = path.join(__dirname, filename);

    // Write and send file
    await fs.promises.writeFile(local, fileContent);
    const res = await testHelper.rest('/files/upload', {
      statusCode: 201,
      token: users[0].token,
      attachments: { file: local },
    });
    expect(res.id.length).toBeGreaterThan(0);
    expect(res.filename).toEqual(filename);
    fileInfo = res;

    // Remove files
    await fs.promises.unlink(local);
  });

  it('getFileInfoForRESTFile', async () => {
    const res = await testHelper.rest('/files/info/' + fileInfo.id, { token: users[0].token });
    expect(res.id).toEqual(fileInfo.id);
    expect(res.filename).toEqual(fileInfo.filename);
  });

  it('downloadGraphQLFile', async () => {
    const res = await testHelper.download('/files/' + fileInfo.id, users[0].token);
    expect(res.statusCode).toEqual(200);
    expect(res.data).toEqual(fileContent);
  });

  it('deleteGraphQLFile', async () => {
    const res = await testHelper.rest('/files/' + fileInfo.id, { method: 'DELETE', token: users[0].token });
    expect(res.id).toEqual(fileInfo.id);
  });

  it('getGraphQLFileInfo', async () => {
    const res = await testHelper.rest('/files/info/' + fileInfo.id, { token: users[0].token });
    expect(res).toEqual(null);
  });

  // ===================================================================================================================
  // Clean up tests
  // ===================================================================================================================

  /**
   * Delete users
   */
  it('deleteUsers', async () => {
    // Add admin role to last user
    await userService.setRoles(users[users.length - 1].id, ['admin']);

    for (const user of users) {
      const res: any = await testHelper.graphQl(
        {
          name: 'deleteUser',
          type: TestGraphQLType.MUTATION,
          arguments: {
            id: user.id,
          },
          fields: ['id'],
        },
        { token: users[users.length - 1].token }
      );
      expect(res.id).toEqual(user.id);
    }
  });
});
