// tslint:disable:no-implicit-dependencies
/**
 * not foundハンドラーミドルウェアテスト
 */
import { chevre } from '@chevre/domain';
import * as assert from 'assert';
import * as sinon from 'sinon';

import { notFoundHandler } from './notFoundHandler';

let sandbox: sinon.SinonSandbox;

describe('notFoundHandler()', () => {
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('PECORINOエラーと共にnextが呼ばれるはず', async () => {
        const params = {
            req: { chevre },
            res: {},
            next: () => undefined
        };

        sandbox.mock(params)
            .expects('next')
            .once()
            .withExactArgs(sinon.match.instanceOf(chevre.factory.errors.NotFound));

        const result = await notFoundHandler(<any>params.req, <any>params.res, params.next);
        assert.equal(result, undefined);
        sandbox.verify();
    });
});
