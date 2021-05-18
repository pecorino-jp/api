/**
 * ルーター
 */
import * as express from 'express';

import devRouter from './dev';
import healthRouter from './health';
import ahRouter from './_ah';

import accountsRouter from './accounts';
import actionsRouter from './actions';
import depositTransactionsRouter from './transactions/deposit';
import transferTransactionsRouter from './transactions/transfer';
import withdrawTransactionsRouter from './transactions/withdraw';

const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/_ah', ahRouter);
router.use('/health', healthRouter);

router.use('/accounts', accountsRouter);
router.use('/actions', actionsRouter);
router.use('/transactions/deposit', depositTransactionsRouter);
router.use('/transactions/withdraw', withdrawTransactionsRouter);
router.use('/transactions/transfer', transferTransactionsRouter);

// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    router.use('/dev', devRouter);
}

export default router;
