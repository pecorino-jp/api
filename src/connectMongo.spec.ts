// tslint:disable:no-implicit-dependencies
/**
 * MonogoDB接続テスト
 */
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { connectMongo } from './connectMongo';

let sandbox: sinon.SinonSandbox;

describe('connectMongo', () => {
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    it('MongoDBに接続できるはず', async () => {
        sinon.mock(mongoose).expects('connect').once().resolves();

        await connectMongo({ defaultConnection: true });
        sandbox.verify();
    });

    it('デフォルトコネクションがfalseでもMongoDBに接続できるはず', async () => {
        sinon.mock(mongoose).expects('createConnection').once().resolves({});

        await connectMongo({ defaultConnection: false });
        sandbox.verify();
    });
});
