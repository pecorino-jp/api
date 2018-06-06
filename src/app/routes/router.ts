/**
 * ルーター
 * @ignore
 */
import * as express from 'express';

import accountsRouter from './accounts';
import actionsRouter from './actions';
import devRouter from './dev';
import healthRouter from './health';
import depositTransactionsRouter from './transactions/deposit';
import transferTransactionsRouter from './transactions/transfer';
import withdrawTransactionsRouter from './transactions/withdraw';

const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/accounts', accountsRouter);
router.use('/actions', actionsRouter);
router.use('/health', healthRouter);
router.use('/transactions/deposit', depositTransactionsRouter);
router.use('/transactions/withdraw', withdrawTransactionsRouter);
router.use('/transactions/transfer', transferTransactionsRouter);

// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    router.use('/dev', devRouter);
}

export default router;
