// tslint:disable:no-implicit-dependencies
/**
 * mongoose接続テスト
 */
import * as pecorino from '@motionpicture/pecorino-domain';
import * as sinon from 'sinon';

import { connectMongo } from './connectMongo';

let sandbox: sinon.SinonSandbox;

describe('connectMongo', () => {
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    it('MongoDBに接続できるはず', async () => {
        sinon.mock(pecorino.mongoose).expects('connect').once().resolves();

        await connectMongo();
        sandbox.verify();
    });
});
